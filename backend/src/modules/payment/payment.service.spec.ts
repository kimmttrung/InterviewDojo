import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { Currency, PaymentProvider, PaymentStatus } from '@prisma/client';
import { sepayConfig } from '@/config/sepay.config';
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
    sepayConfig.webhookSecret = '';
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

  it('rejects non-positive deposit amounts', async () => {
    await expect(service.createDeposit(10, 0)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('returns payment status for the owner and rejects a missing payment', async () => {
    prisma.payment.findUnique
      .mockResolvedValueOnce(pendingPayment)
      .mockResolvedValueOnce(null);

    await expect(service.getPaymentStatus(1, 10)).resolves.toEqual({
      paymentId: 1,
      status: PaymentStatus.PENDING,
      expiredAt: pendingPayment.expiredAt,
      amount: 100000,
      orderCode: 'DEPABC123',
    });
    await expect(service.getPaymentStatus(404, 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
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

  it('rejects webhook requests with an old timestamp', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });

    await expect(
      service.handleSePayWebhook(
        { content: 'Topup DEPABC123', transferAmount: 100000 },
        '{}',
        undefined,
        String(Math.floor(Date.now() / 1000) - 301),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: {
        status: 'FAILED',
        error: expect.stringContaining('Timestamp too old'),
      },
    });
  });

  it('skips outgoing webhook transfers before looking up payment', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });

    await expect(
      service.handleSePayWebhook(
        { transferType: 'out', content: 'Topup DEPABC123' },
        '{}',
      ),
    ).resolves.toEqual({ message: 'Skipped: not an incoming transfer' });

    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: { status: 'SKIPPED', error: 'Not an incoming transfer' },
    });
  });

  it('rejects webhook without an order code or without a matching payment', async () => {
    prisma.paymentWebhookLog.create
      .mockResolvedValueOnce({ id: 50 })
      .mockResolvedValueOnce({ id: 51 });
    prisma.payment.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.handleSePayWebhook({ content: 'No code here' }, '{}'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.handleSePayWebhook({ description: 'Topup DEPABC123' }, '{}'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.paymentWebhookLog.update).toHaveBeenNthCalledWith(1, {
      where: { id: 50 },
      data: {
        status: 'FAILED',
        error: 'No valid orderCode in description',
      },
    });
    expect(prisma.paymentWebhookLog.update).toHaveBeenNthCalledWith(2, {
      where: { id: 51 },
      data: { status: 'FAILED', error: 'Payment not found' },
    });
  });

  it('rejects expired webhook payments and marks them expired', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue({
      ...pendingPayment,
      expiredAt: new Date(Date.now() - 60_000),
    });

    await expect(
      service.handleSePayWebhook(
        { content: 'Topup DEPABC123', transferAmount: 100000 },
        '{}',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: PaymentStatus.EXPIRED },
    });
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: { status: 'EXPIRED', error: 'Payment expired' },
    });
  });

  it('verifies configured webhook signatures and rejects invalid signatures', async () => {
    sepayConfig.webhookSecret = 'secret';
    prisma.paymentWebhookLog.create
      .mockResolvedValueOnce({ id: 50 })
      .mockResolvedValueOnce({ id: 51 });
    prisma.payment.findUnique.mockResolvedValueOnce(pendingPayment);
    const rawBody = '{"content":"Topup DEPABC123","amount":100000}';
    const signature = `sha256=${createHmac('sha256', 'secret')
      .update(rawBody, 'utf8')
      .digest('hex')}`;

    await expect(
      service.handleSePayWebhook(
        { content: 'Topup DEPABC123', amount: 100000, transactionId: 'TX999' },
        rawBody,
        signature,
      ),
    ).resolves.toEqual({ message: 'Payment successful' });

    await expect(
      service.handleSePayWebhook(
        { content: 'Topup DEPABC123', amount: 100000 },
        rawBody,
        'sha256=bad',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(walletService.depositAtomic).toHaveBeenCalledWith(
      10,
      100000,
      'DEPABC123',
      'DEPOSIT_VIA_SEPAY_TX999',
      prisma,
    );
    expect(prisma.paymentWebhookLog.update).toHaveBeenLastCalledWith({
      where: { id: 51 },
      data: { status: 'FAILED', error: 'Invalid signature' },
    });
  });

  it('verifies signatures without prefix and rejects missing signatures when secret is configured', async () => {
    sepayConfig.webhookSecret = 'secret';
    prisma.paymentWebhookLog.create
      .mockResolvedValueOnce({ id: 52 })
      .mockResolvedValueOnce({ id: 53 });
    prisma.payment.findUnique.mockResolvedValueOnce(pendingPayment);
    const rawBody = '{"content":"Topup DEPABC123","amount":100000}';
    const signature = createHmac('sha256', 'secret')
      .update(rawBody, 'utf8')
      .digest('hex');

    await expect(
      service.handleSePayWebhook(
        { content: 'Topup DEPABC123', amount: 100000 },
        rawBody,
        signature,
      ),
    ).resolves.toEqual({ message: 'Payment successful' });

    await expect(
      service.handleSePayWebhook(
        { content: 'Topup DEPABC123', amount: 100000 },
        rawBody,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects webhook payloads without content or description', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });

    await expect(service.handleSePayWebhook({}, '{}')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('marks webhook log failed when wallet deposit throws', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);
    walletService.depositAtomic.mockRejectedValue(new Error('wallet down'));

    await expect(
      service.handleSePayWebhook(
        { content: 'Topup DEPABC123', transferAmount: 100000 },
        '{}',
      ),
    ).rejects.toThrow('wallet down');

    expect(prisma.paymentWebhookLog.update).toHaveBeenLastCalledWith({
      where: { id: 50 },
      data: { status: 'FAILED', error: 'wallet down' },
    });
  });

  it('marks webhook log failed with fallback message for non-error transaction failures', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);
    walletService.depositAtomic.mockRejectedValue('string failure');

    await expect(
      service.handleSePayWebhook(
        { content: 'Topup DEPABC123', transferAmount: 100000 },
        '{}',
      ),
    ).rejects.toBe('string failure');

    expect(prisma.paymentWebhookLog.update).toHaveBeenLastCalledWith({
      where: { id: 50 },
      data: { status: 'FAILED', error: 'Unknown error' },
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

  it('rejects mock payment in production and already processed payments', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    await expect(service.mockPaymentSuccess(1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    process.env.NODE_ENV = 'test';
    prisma.payment.findUnique.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.PAID,
    });
    await expect(service.mockPaymentSuccess(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('expires mock payments that are already past their deadline', async () => {
    process.env.NODE_ENV = 'test';
    prisma.payment.findUnique.mockResolvedValue({
      ...pendingPayment,
      expiredAt: new Date(Date.now() - 60_000),
    });

    await expect(service.mockPaymentSuccess(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: PaymentStatus.EXPIRED },
    });
  });

  it('autoExpirePayments updates expired pending payments and logs only when needed', async () => {
    const warnSpy = jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation(() => undefined);
    prisma.payment.updateMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 0 });

    await service.autoExpirePayments();
    await service.autoExpirePayments();

    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: {
        status: PaymentStatus.PENDING,
        expiredAt: { lt: expect.any(Date) },
      },
      data: { status: PaymentStatus.EXPIRED },
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('updateWebhookLog stores null error when no error is provided', async () => {
    await (service as any).updateWebhookLog(77, 'OK');

    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 77 },
      data: { status: 'OK', error: null },
    });
  });
});
