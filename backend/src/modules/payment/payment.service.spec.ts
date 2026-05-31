import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Currency, PaymentProvider, PaymentStatus } from '@prisma/client';
import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: any;
  let walletService: jest.Mocked<Pick<WalletService, 'depositAtomic'>>;

  const pendingPayment = {
    id: 1,
    orderCode: 'DEPABC123',
    userId: 10,
    amount: 100000,
    status: PaymentStatus.PENDING,
    expiredAt: new Date(Date.now() + 60_000),
  };

  beforeEach(() => {
    prisma = {
      payment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      paymentWebhookLog: {
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    walletService = { depositAtomic: jest.fn() };
    service = new PaymentService(
      prisma,
      walletService as unknown as WalletService,
    );
  });

  it('creates a deposit payment with a pending VietQR order', async () => {
    prisma.payment.create.mockResolvedValue({ id: 1 });

    const result = await service.createDeposit(10, 100000);

    expect(result).toEqual(
      expect.objectContaining({ paymentId: 1, amount: 100000 }),
    );
    expect(result.orderCode).toMatch(/^DEP[A-Z0-9]{15}$/);
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 10,
        amount: 100000,
        currency: Currency.VND,
        provider: PaymentProvider.VIETQR,
        status: PaymentStatus.PENDING,
      }),
    });
  });

  it('rejects deposits below the minimum amount', async () => {
    await expect(service.createDeposit(10, 9999)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('prevents a user from reading another user payment status', async () => {
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);

    await expect(service.getPaymentStatus(1, 99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('marks webhook payment as paid and deposits wallet credit atomically', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);
    prisma.payment.update.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.PAID,
    });

    await expect(
      service.handleSePayWebhook(
        {
          id: 'TX123',
          transferType: 'in',
          content: 'Topup DEPABC123',
          transferAmount: 100000,
        },
        '{"content":"Topup DEPABC123"}',
      ),
    ).resolves.toEqual({ message: 'Payment successful' });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        status: PaymentStatus.PAID,
        providerTransactionId: 'TX123',
      }),
    });
    expect(walletService.depositAtomic).toHaveBeenCalledWith(
      10,
      100000,
      'DEPABC123',
      'DEPOSIT_VIA_SEPAY_TX123',
      prisma,
    );
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: { status: 'VERIFIED', error: 'Success' },
    });
  });

  it('skips duplicate webhook events for already processed payments', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.PAID,
    });

    await expect(
      service.handleSePayWebhook(
        {
          transferType: 'in',
          content: 'Topup DEPABC123',
          transferAmount: 100000,
        },
        '{}',
      ),
    ).resolves.toEqual({ message: 'Payment already processed' });

    expect(walletService.depositAtomic).not.toHaveBeenCalled();
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: { status: 'DUPLICATE', error: 'Already PAID' },
    });
  });

  it('rejects webhook events with an amount mismatch', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);

    await expect(
      service.handleSePayWebhook(
        {
          transferType: 'in',
          content: 'Topup DEPABC123',
          transferAmount: 50000,
        },
        '{}',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(walletService.depositAtomic).not.toHaveBeenCalled();
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: {
        status: 'FAILED',
        error: 'Amount mismatch: expected 100000, got 50000',
      },
    });
  });

  it('processes mock payment success outside production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);

    await expect(service.mockPaymentSuccess(1)).resolves.toEqual({
      paymentId: 1,
      orderCode: 'DEPABC123',
      amount: 100000,
    });

    expect(walletService.depositAtomic).toHaveBeenCalledWith(
      10,
      100000,
      'DEPABC123',
      'MOCK_DEPOSIT',
      prisma,
    );
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('throws when mock payment target is missing', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);

    await expect(service.mockPaymentSuccess(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
