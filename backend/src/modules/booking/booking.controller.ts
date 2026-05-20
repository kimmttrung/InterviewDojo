// src/modules/booking/booking.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  QueryBookingDto,
  UpdateBookingStatusDto,
  PaymentDto,
} from './dto/booking.dto';
import { BookingResponse } from './interfaces/booking.interface';
import { Messages } from '../../common/constants/messages.constant';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @Roles(Role.CANDIDATE)
  @ResponseMessage(Messages.BOOKING.CREATED)
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingResponse> {
    return this.bookingService.create(Number(user.sub), dto);
  }

  @Post(':id/pay')
  @Roles(Role.CANDIDATE)
  @ResponseMessage('Thanh toán thành công')
  async pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() paymentDto: PaymentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingResponse> {
    if (paymentDto.method === 'INTERNAL_WALLET') {
      return this.bookingService.payWithWallet(id, Number(user.sub));
    }
    // TODO: Thêm các cổng thanh toán khác
    throw new BadRequestException('Phương thức thanh toán chưa hỗ trợ');
  }

  @Patch(':id/accept')
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.BOOKING.STATUS_UPDATED)
  async accept(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingResponse> {
    return this.bookingService.accept(id, Number(user.sub));
  }

  @Patch(':id/reject')
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.BOOKING.STATUS_UPDATED)
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingResponse> {
    return this.bookingService.reject(id, Number(user.sub), reason);
  }

  @Get()
  @ResponseMessage(Messages.BOOKING.FETCHED)
  async findAll(
    @Query() query: QueryBookingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bookingService.findAll(query, user);
  }

  @Get(':id')
  @ResponseMessage(Messages.BOOKING.DETAIL_FETCHED)
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingResponse> {
    return this.bookingService.findById(id, user);
  }

  // Optional: nếu vẫn muốn giữ endpoint /status cũ
  @Patch(':id/status')
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.BOOKING.STATUS_UPDATED)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingResponse> {
    return this.bookingService.updateStatus(id, Number(user.sub), dto);
  }
}
