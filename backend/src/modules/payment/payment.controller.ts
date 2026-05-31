// src/modules/payment/payment.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  ParseIntPipe,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { DepositDto } from './dto/deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(Messages.PAYMENT.DEPOSIT_CREATED)
  deposit(
    @CurrentUser() user: JwtPayload,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: DepositDto,
  ) {
    return this.paymentService.createDeposit(user.sub, dto.amount);
  }

  /**
   * Polling endpoint — frontend gọi mỗi 3 giây để kiểm tra trạng thái payment.
   * Chỉ trả status + expiredAt, không lộ thông tin nhạy cảm.
   * Guard bằng JWT để tránh bị scrape.
   */
  @Get('status/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(Messages.PAYMENT.STATUS_FETCHED)
  getPaymentStatus(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentService.getPaymentStatus(paymentId, user.sub);
  }

  /**
   * Webhook từ SePay — public, không auth.
   * rawBody cần thiết để verify HMAC-SHA256.
   * Yêu cầu main.ts: NestFactory.create(AppModule, { rawBody: true })
   */
  @Post('webhook/sepay')
  @HttpCode(HttpStatus.OK)
  sepayWebhook(
    @Body() payload: any,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-sepay-signature') signature: string, // SePay gửi "X-SePay-Signature"
    @Headers('x-sepay-timestamp') timestamp: string, // Unix timestamp, dùng chống replay
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(payload);
    return this.paymentService.handleSePayWebhook(
      payload,
      rawBody,
      signature,
      timestamp,
    );
  }

  /**
   * Mock — chỉ dev, comment guard để tiện test.
   */
  @Post('mock/:paymentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(Messages.PAYMENT.MOCK_SUCCESS)
  mockPayment(@Param('paymentId', ParseIntPipe) paymentId: number) {
    return this.paymentService.mockPaymentSuccess(paymentId);
  }
}
