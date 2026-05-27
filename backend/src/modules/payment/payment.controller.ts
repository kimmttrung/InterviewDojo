// src/modules/payment/payment.controller.ts
import {
  Controller,
  Post,
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

  /**
   * Người dùng tạo yêu cầu nạp tiền.
   * Service trả raw data → TransformInterceptor bọc thành { success, data, message }.
   */
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
   * Webhook từ SePay — không cần auth, không bọc response.
   * SePay chỉ cần HTTP 200 + body bất kỳ, không cần format chuẩn.
   *
   * rawBody hoạt động khi main.ts dùng: NestFactory.create(AppModule, { rawBody: true })
   */
  @Post('webhook/sepay')
  @HttpCode(HttpStatus.OK)
  sepayWebhook(
    @Body() payload: any,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(payload);
    return this.paymentService.handleSePayWebhook(payload, rawBody, signature);
  }

  /**
   * Mock thanh toán thành công — chỉ ADMIN, chỉ môi trường dev.
   */
  @Post('mock/:paymentId')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(Messages.PAYMENT.MOCK_SUCCESS)
  mockPayment(@Param('paymentId', ParseIntPipe) paymentId: number) {
    return this.paymentService.mockPaymentSuccess(paymentId);
  }
}
