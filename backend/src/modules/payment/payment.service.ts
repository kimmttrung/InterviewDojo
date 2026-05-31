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

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  // ==================== PUBLIC ====================

  async createDeposit(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Số tiền không hợp lệ');
    if (amount < 10000)
      throw new BadRequestException('Số tiền tối thiểu là 10,000 VNĐ');

    const orderCode = `DEP${randomUUID().replace(/-/g, '').slice(0, 15).toUpperCase()}`;
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

    return { paymentId: payment.id, orderCode, amount, expiredAt };
  }

  /**
   * Polling endpoint: trả status của payment.
   * Frontend gọi mỗi 3 giây khi đang hiển thị QR.
   * Kiểm tra userId để tránh user A xem payment của user B.
   */
  async getPaymentStatus(paymentId: number, userId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        status: true,
        expiredAt: true,
        userId: true,
        amount: true,
        orderCode: true,
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId)
      throw new ForbiddenException('Access denied');

    return {
      paymentId: payment.id,
      status: payment.status, // PENDING | PAID | EXPIRED | FAILED
      expiredAt: payment.expiredAt,
      amount: payment.amount,
      orderCode: payment.orderCode,
    };
  }

  async handleSePayWebhook(
    payload: any,
    rawBody: string,
    signatureHeader?: string,
    timestampHeader?: string,
    method?: string,
    url?: string,
  ) {
    // 1. Log ngay để debug/đối soát
    const log = await this.prisma.paymentWebhookLog.create({
      data: {
        provider: 'SEPAY',
        payload,
        // Lưu signature đầy đủ gồm cả prefix "sha256=..."
        signature: signatureHeader ?? null,
        status: 'RECEIVED',
      },
    });

    // 2. Chống replay attack: timestamp không được lệch quá 5 phút
    if (timestampHeader) {
      const ts = parseInt(timestampHeader, 10);
      const diffSeconds = Math.abs(Date.now() / 1000 - ts);
      if (diffSeconds > 300) {
        await this.updateWebhookLog(
          log.id,
          'FAILED',
          `Timestamp too old: ${diffSeconds}s`,
        );
        throw new ForbiddenException('Request timestamp too old');
      }
    }

    // 3. Verify HMAC-SHA256 signature (khi đã cấu hình secret)
    if (process.env.SEPAY_WEBHOOK_SECRET) {
      // Gọi verifySignature với đủ tham số
      if (
        !this.verifySignature(
          rawBody,
          signatureHeader ?? '',
          timestampHeader ?? '',
          method ?? 'POST',
          url ?? '/api/v1/payment/webhook/sepay',
        )
      ) {
        await this.updateWebhookLog(log.id, 'FAILED', 'Invalid signature');
        throw new ForbiddenException('Invalid signature');
      }
    } else {
      this.logger.warn(
        'SEPAY_WEBHOOK_SECRET chưa cấu hình — bỏ qua verify signature',
      );
    }

    if (payload.transferType && payload.transferType !== 'in') {
      await this.updateWebhookLog(
        log.id,
        'SKIPPED',
        'Not an incoming transfer',
      );
      return { message: 'Skipped: not an incoming transfer' };
    }

    const content: string = payload.content ?? payload.description ?? '';
    const match = content.match(/DEP_?[A-Z0-9]+/);
    if (!match) {
      await this.updateWebhookLog(
        log.id,
        'FAILED',
        'No valid orderCode in description',
      );
      throw new BadRequestException('Invalid orderCode in description');
    }
    const orderCode = match[0];

    const payment = await this.prisma.payment.findUnique({
      where: { orderCode },
    });
    if (!payment) {
      await this.updateWebhookLog(log.id, 'FAILED', 'Payment not found');
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      await this.updateWebhookLog(
        log.id,
        'DUPLICATE',
        `Already ${payment.status}`,
      );
      return { message: 'Payment already processed' };
    }

    if (payment.expiredAt && payment.expiredAt < new Date()) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.EXPIRED },
      });
      await this.updateWebhookLog(log.id, 'EXPIRED', 'Payment expired');
      throw new BadRequestException('Payment expired');
    }

    const webhookAmount = payload.transferAmount ?? payload.amount;
    if (webhookAmount !== payment.amount) {
      await this.updateWebhookLog(
        log.id,
        'FAILED',
        `Amount mismatch: expected ${payment.amount}, got ${webhookAmount}`,
      );
      throw new BadRequestException('Amount mismatch');
    }

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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoExpirePayments() {
    const result = await this.prisma.payment.updateMany({
      where: { status: PaymentStatus.PENDING, expiredAt: { lt: new Date() } },
      data: { status: PaymentStatus.EXPIRED },
    });
    if (result.count > 0) {
      this.logger.warn(`[Cron] Auto-expired ${result.count} pending payments`);
    }
  }

  // ==================== PRIVATE ====================

  /**
   * Verify HMAC-SHA256 signature của SePay.
   *
   * SePay gửi header:
   *   X-SePay-Signature: sha256=<hex>
   *   X-SePay-Timestamp: <unix_timestamp>
   *
   * Cần strip prefix "sha256=" trước khi so sánh.
   * Dùng timingSafeEqual để tránh timing attack.
   */
  private verifySignature(
    rawBody: string,
    signatureHeader: string,
    timestamp: string,
    method: string,
    url: string,
  ): boolean {
    const secret = process.env.SEPAY_WEBHOOK_SECRET;
    if (!secret) return false;
    // Tạo chuỗi ký theo đúng thứ tự: method + "\n" + url + "\n" + rawBody + "\n" + timestamp
    const data = `${method}\n${url}\n${rawBody}\n${timestamp}`;
    const computed = createHmac('sha256', secret)
      .update(data, 'utf8')
      .digest('hex');
    const signatureHex = signatureHeader.startsWith('sha256=')
      ? signatureHeader.slice(7)
      : signatureHeader;
    try {
      const expectedBuf = Buffer.from(computed, 'hex');
      const receivedBuf = Buffer.from(signatureHex, 'hex');
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
