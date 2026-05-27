import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { sepayConfig } from '@/config/sepay.config';
import { randomUUID } from 'crypto';

@Injectable()
export class SePayService {
  private readonly logger = new Logger(SePayService.name);
  constructor(private httpService: HttpService) {}

  async createQrCode(
    amount: number,
    description: string,
  ): Promise<{ qrDataUrl: string; orderId: string }> {
    const orderId = `DEPOSIT_${randomUUID().replace(/-/g, '').slice(0, 12)}`;

    // Gọi SePay API tạo QR tĩnh hoặc động
    // Tài liệu SePay: https://my.sepay.vn/api/docs
    const payload = {
      amount,
      description,
      bankCode: sepayConfig.bankCode,
      accountNumber: sepayConfig.accountNumber,
      // Có thể thêm các tham số khác
    };
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${sepayConfig.baseUrl}/qr/dynamic`, payload, {
          headers: { Authorization: `Bearer ${sepayConfig.apiKey}` },
        }),
      );
      if (response.data.status !== 200) {
        throw new BadRequestException('Không thể tạo QR code');
      }
      return {
        qrDataUrl: response.data.data.qrDataUrl,
        orderId,
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Lỗi khi tạo QR thanh toán');
    }
  }
}
