import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Currency, PaymentProvider, PaymentStatus } from '@prisma/client';
import { createHmac } from 'crypto';
import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: any;
  let walletService: jest.Mocked<Pick<WalletService, 'depositAtomic'>>;

  const future = new Date(Date.now() + 60_000);
  const pendingPayment = {
    id: 1,
    orderCode: 'DEPABC123',
    userId: 10,
    amount: 100000,
    status: PaymentStatus.PENDING,
    expiredAt: future,
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
    jest.spyOn((service as any).logger, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.SEPAY_WEBHOOK_SECRET;
    process.env.NODE_ENV = 'test';
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

  it('rejects non-positive and below-minimum deposits', async () => {
    await expect(service.createDeposit(10, 0)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.createDeposit(10, 9999)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('returns payment status for the owner', async () => {
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);

    await expect(service.getPaymentStatus(1, 10)).resolves.toEqual({
      paymentId: 1,
      status: PaymentStatus.PENDING,
      expiredAt: future,
      amount: 100000,
      orderCode: 'DEPABC123',
    });
  });

  it('rejects missing or unauthorized payment status reads', async () => {
    prisma.payment.findUnique.mockResolvedValueOnce(null);
    await expect(service.getPaymentStatus(404, 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.payment.findUnique.mockResolvedValueOnce(pendingPayment);
    await expect(service.getPaymentStatus(1, 99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('marks webhook payment as paid and deposits wallet credit atomically', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);

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

  it('accepts valid signed webhook payloads', async () => {
    process.env.SEPAY_WEBHOOK_SECRET = 'secret';
    const rawBody = '{"content":"Topup DEPABC123"}';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature =
      'sha256=' +
      createHmac('sha256', 'secret')
        .update(`${timestamp}.${rawBody}`, 'utf8')
        .digest('hex');
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);

    await expect(
      service.handleSePayWebhook(
        {
          transactionId: 'TX456',
          description: 'Topup DEPABC123',
          amount: 100000,
        },
        rawBody,
        signature,
        timestamp,
      ),
    ).resolves.toEqual({ message: 'Payment successful' });

    expect(walletService.depositAtomic).toHaveBeenCalledWith(
      10,
      100000,
      'DEPABC123',
      'DEPOSIT_VIA_SEPAY_TX456',
      prisma,
    );
  });

  it('rejects stale timestamps and invalid signatures', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });

    await expect(
      service.handleSePayWebhook({}, '{}', undefined, '1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: expect.objectContaining({ status: 'FAILED' }),
    });

    process.env.SEPAY_WEBHOOK_SECRET = 'secret';
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 51 });
    const freshTimestamp = String(Math.floor(Date.now() / 1000));
    await expect(
      service.handleSePayWebhook({}, '{}', 'sha256=bad', freshTimestamp),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 51 },
      data: { status: 'FAILED', error: 'Invalid signature' },
    });

    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 52 });
    await expect(service.handleSePayWebhook({}, '{}')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 52 },
      data: { status: 'FAILED', error: 'Invalid signature' },
    });
  });

  it('skips outgoing webhook transfers', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });

    await expect(
      service.handleSePayWebhook({ transferType: 'out' }, '{}'),
    ).resolves.toEqual({ message: 'Skipped: not an incoming transfer' });
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: { status: 'SKIPPED', error: 'Not an incoming transfer' },
    });
  });

  it('rejects webhook payloads without a valid order code or payment row', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });

    await expect(service.handleSePayWebhook({}, '{}')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: { status: 'FAILED', error: 'No valid orderCode in description' },
    });

    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 51 });
    prisma.payment.findUnique.mockResolvedValue(null);
    await expect(
      service.handleSePayWebhook({ content: 'DEPABC123' }, '{}'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 51 },
      data: { status: 'FAILED', error: 'Payment not found' },
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

  it('expires webhook payments when payment deadline has passed', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue({
      ...pendingPayment,
      expiredAt: new Date(Date.now() - 60_000),
    });

    await expect(
      service.handleSePayWebhook(
        { content: 'DEPABC123', transferAmount: 100000 },
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

  it('updates webhook log when atomic deposit fails', async () => {
    const error = new Error('wallet unavailable');
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);
    prisma.$transaction.mockRejectedValue(error);

    await expect(
      service.handleSePayWebhook(
        { content: 'DEPABC123', transferAmount: 100000 },
        '{}',
      ),
    ).rejects.toThrow('wallet unavailable');
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: { status: 'FAILED', error: 'wallet unavailable' },
    });
  });

  it('uses fallback provider transaction id and handles non-error transaction failures', async () => {
    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 50 });
    prisma.payment.findUnique.mockResolvedValue(pendingPayment);

    await expect(
      service.handleSePayWebhook(
        { content: 'DEPABC123', transferAmount: 100000 },
        '{}',
      ),
    ).resolves.toEqual({ message: 'Payment successful' });
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ providerTransactionId: '' }),
    });
    expect(walletService.depositAtomic).toHaveBeenCalledWith(
      10,
      100000,
      'DEPABC123',
      'DEPOSIT_VIA_SEPAY_unknown',
      prisma,
    );

    prisma.paymentWebhookLog.create.mockResolvedValue({ id: 51 });
    prisma.$transaction.mockRejectedValueOnce('plain failure');
    await expect(
      service.handleSePayWebhook(
        { content: 'DEPABC123', transferAmount: 100000 },
        '{}',
      ),
    ).rejects.toBe('plain failure');
    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 51 },
      data: { status: 'FAILED', error: 'Unknown error' },
    });
  });

  it('processes mock payment success outside production', async () => {
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
  });

  it('rejects mock payment in production, missing, processed, and expired states', async () => {
    process.env.NODE_ENV = 'production';
    await expect(service.mockPaymentSuccess(1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    process.env.NODE_ENV = 'test';
    prisma.payment.findUnique.mockResolvedValueOnce(null);
    await expect(service.mockPaymentSuccess(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.payment.findUnique.mockResolvedValueOnce({
      ...pendingPayment,
      status: PaymentStatus.PAID,
    });
    await expect(service.mockPaymentSuccess(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    prisma.payment.findUnique.mockResolvedValueOnce({
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

  it('auto-expires old pending payments and logs only when rows changed', async () => {
    const loggerSpy = jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation();
    prisma.payment.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 2 });

    await service.autoExpirePayments();
    await service.autoExpirePayments();

    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: {
        status: PaymentStatus.PENDING,
        expiredAt: { lt: expect.any(Date) },
      },
      data: { status: PaymentStatus.EXPIRED },
    });
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(
      '[Cron] Auto-expired 2 pending payments',
    );
  });

  it('covers direct signature verification branches', () => {
    process.env.SEPAY_WEBHOOK_SECRET = 'secret';
    const rawBody = '{}';
    const timestamp = '123';
    const signature = createHmac('sha256', 'secret')
      .update(`${timestamp}.${rawBody}`, 'utf8')
      .digest('hex');

    expect(
      (service as any).verifySignature(rawBody, signature, timestamp),
    ).toBe(true);
    expect((service as any).verifySignature(rawBody, '00', timestamp)).toBe(
      false,
    );
    delete process.env.SEPAY_WEBHOOK_SECRET;
    expect(
      (service as any).verifySignature(rawBody, signature, timestamp),
    ).toBe(false);
  });

  it('updates webhook log with null error when no error is provided', async () => {
    await (service as any).updateWebhookLog(77, 'OK');

    expect(prisma.paymentWebhookLog.update).toHaveBeenCalledWith({
      where: { id: 77 },
      data: { status: 'OK', error: null },
    });
  });
});
