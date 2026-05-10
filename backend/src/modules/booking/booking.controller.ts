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
} from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  QueryBookingDto,
  UpdateBookingStatusDto,
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
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingResponse> {
    return this.bookingService.create(user.sub, createBookingDto);
  }

  @Get()
  @ResponseMessage(Messages.BOOKING.FETCHED)
  async findAll(
    @Query() query: QueryBookingDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.bookingService.findAll(query, user);
  }

  @Get(':book_id')
  @ResponseMessage(Messages.BOOKING.DETAIL_FETCHED)
  async findById(
    @Param('book_id', ParseIntPipe) bookId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingResponse> {
    return this.bookingService.findById(bookId, user);
  }

  @Patch(':book_id/status')
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.BOOKING.STATUS_UPDATED)
  async updateStatus(
    @Param('book_id', ParseIntPipe) bookId: number,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingResponse> {
    return this.bookingService.updateStatus(
      bookId,
      user.sub,
      updateBookingStatusDto,
    );
  }
}
