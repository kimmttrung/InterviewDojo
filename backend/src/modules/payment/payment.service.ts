// src/modules/payment/payment.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentStatus, PaymentProvider, Currency } from '@prisma/client';
import { WalletService } from '../wallet/wallet.service';
import { sepayConfig } from '@/config/sepay.config';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  // ==================== PUBLIC ====================

  /**
   * Tạo đơn nạp tiền (PENDING).
   * Trả raw data — TransformInterceptor sẽ bọc thành { success, data, message }.
   */
  async createDeposit(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Số tiền không hợp lệ');
    if (amount < 10000)
      throw new BadRequestException('Số tiền tối thiểu là 10,000 VNĐ');

    const orderCode = `DEP_${randomUUID().replace(/-/g, '').slice(0, 15).toUpperCase()}`;
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000);

    const payment = await this.prisma.payment.create({
      data: {
        orderCode,
        userId,
        amount,
        currency: Currency.VND,
        provider: PaymentProvider.VIETQR,
        status: PaymentStatus.PENDING,
        expiredAt,
      },
    });

    return {
      paymentId: payment.id,
      orderCode,
      amount,
      expiredAt,
    };
  }

  /**
   * Xử lý webhook từ SePay.
   * Trả raw object — SePay chỉ cần HTTP 200, không quan tâm body format.
   */
  async handleSePayWebhook(
    payload: any,
    rawBody: string,
    signatureHeader?: string,
  ) {
    // 1. Log ngay để phục vụ debug và đối soát
    const log = await this.prisma.paymentWebhookLog.create({
      data: {
        provider: 'SEPAY',
        payload,
        signature: signatureHeader ?? null,
        status: 'RECEIVED',
      },
    });

    // 2. Verify HMAC-SHA256 signature
    if (sepayConfig.webhookSecret) {
      if (!this.verifySignature(rawBody, signatureHeader ?? '')) {
        await this.updateWebhookLog(log.id, 'FAILED', 'Invalid signature');
        throw new ForbiddenException('Invalid signature');
      }
    } else {
      this.logger.warn(
        'SEPAY_WEBHOOK_SECRET chưa cấu hình — bỏ qua verify signature',
      );
    }

    // 3. Chỉ xử lý giao dịch tiền vào
    if (payload.transferType && payload.transferType !== 'in') {
      await this.updateWebhookLog(
        log.id,
        'SKIPPED',
        'Not an incoming transfer',
      );
      return { message: 'Skipped: not an incoming transfer' };
    }

    // 4. Trích xuất orderCode từ content/description
    const content: string = payload.content ?? payload.description ?? '';
    const match = content.match(/DEP_[A-Z0-9]+/);
    if (!match) {
      await this.updateWebhookLog(
        log.id,
        'FAILED',
        'No valid orderCode in description',
      );
      throw new BadRequestException('Invalid orderCode in description');
    }
    const orderCode = match[0];

    // 5. Tìm payment
    const payment = await this.prisma.payment.findUnique({
      where: { orderCode },
    });
    if (!payment) {
      await this.updateWebhookLog(log.id, 'FAILED', 'Payment not found');
      throw new NotFoundException('Payment not found');
    }

    // 6. Idempotency — SePay có thể retry nhiều lần
    if (payment.status !== PaymentStatus.PENDING) {
      await this.updateWebhookLog(
        log.id,
        'DUPLICATE',
        `Already ${payment.status}`,
      );
      return { message: 'Payment already processed' };
    }

    // 7. Kiểm tra hết hạn
    if (payment.expiredAt && payment.expiredAt < new Date()) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.EXPIRED },
      });
      await this.updateWebhookLog(log.id, 'EXPIRED', 'Payment expired');
      throw new BadRequestException('Payment expired');
    }

    // 8. So khớp số tiền — SePay dùng field `transferAmount`
    const webhookAmount = payload.transferAmount ?? payload.amount;
    if (webhookAmount !== payment.amount) {
      await this.updateWebhookLog(
        log.id,
        'FAILED',
        `Amount mismatch: expected ${payment.amount}, got ${webhookAmount}`,
      );
      throw new BadRequestException('Amount mismatch');
    }

    // 9. Cập nhật Payment + cộng tiền trong 1 transaction
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            providerTransactionId: String(
              payload.id ?? payload.transactionId ?? '',
            ),
          },
        });

        await this.walletService.depositAtomic(
          payment.userId!,
          payment.amount,
          orderCode,
          `DEPOSIT_VIA_SEPAY_${payload.id ?? payload.transactionId ?? 'unknown'}`,
          tx,
        );
      });

      await this.updateWebhookLog(log.id, 'VERIFIED', 'Success');
      return { message: 'Payment successful' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.updateWebhookLog(log.id, 'FAILED', message);
      throw error;
    }
  }

  /**
   * Mock thanh toán thành công — chỉ dùng trong dev.
   * Trả raw data — TransformInterceptor bọc lại.
   */
  async mockPaymentSuccess(paymentId: number) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Mock only available in non-production');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment already processed');
    }
    if (payment.expiredAt && payment.expiredAt < new Date()) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.EXPIRED },
      });
      throw new BadRequestException('Payment expired');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.PAID, paidAt: new Date() },
      });
      await this.walletService.depositAtomic(
        payment.userId!,
        payment.amount,
        payment.orderCode,
        'MOCK_DEPOSIT',
        tx,
      );
    });

    return { paymentId, orderCode: payment.orderCode, amount: payment.amount };
  }

  /**
   * Cron: auto-expire payment PENDING quá hạn (mỗi 5 phút).
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoExpirePayments() {
    const result = await this.prisma.payment.updateMany({
      where: {
        status: PaymentStatus.PENDING,
        expiredAt: { lt: new Date() },
      },
      data: { status: PaymentStatus.EXPIRED },
    });
    if (result.count > 0) {
      this.logger.warn(`[Cron] Auto-expired ${result.count} pending payments`);
    }
  }

  // ==================== PRIVATE ====================

  /**
   * Verify HMAC-SHA256 signature của SePay.
   * Dùng timingSafeEqual để tránh timing attack.
   */
  private verifySignature(rawBody: string, signature: string): boolean {
    try {
      const expected = createHmac('sha256', sepayConfig.webhookSecret)
        .update(rawBody, 'utf8')
        .digest('hex');

      const expectedBuf = Buffer.from(expected, 'hex');
      const receivedBuf = Buffer.from(signature, 'hex');

      if (expectedBuf.length !== receivedBuf.length) return false;
      return timingSafeEqual(expectedBuf, receivedBuf);
    } catch {
      return false;
    }
  }

  private async updateWebhookLog(
    logId: number,
    status: string,
    error?: string,
  ) {
    await this.prisma.paymentWebhookLog.update({
      where: { id: logId },
      data: { status, error: error ?? null },
    });
  }
}
