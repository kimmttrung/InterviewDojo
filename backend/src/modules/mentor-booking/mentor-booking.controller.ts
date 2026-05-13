import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';
import { MentorBookingService } from './mentor-booking.service';
import { QueryBookingDto } from './dto/query-booking.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';
import { BookingListResponse } from './interfaces/booking-list.interface';
import { BookingDetail } from './interfaces/booking-detail.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Mentor Bookings')
@ApiBearerAuth()
@Controller('mentor/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MentorBookingController {
  constructor(private readonly mentorBookingService: MentorBookingService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách booking của mentor' })
  @ResponseMessage(Messages.MENTOR_BOOKING.FETCHED)
  @Roles(Role.MENTOR, Role.ADMIN)
  async getBookings(
    @CurrentUser() user: { sub: number; role?: Role },
    @Query() query: QueryBookingDto,
  ): Promise<BookingListResponse> {
    return this.mentorBookingService.getBookings(user.sub, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết một booking' })
  @ResponseMessage(Messages.MENTOR_BOOKING.DETAIL_FETCHED)
  @Roles(Role.MENTOR, Role.ADMIN)
  async getBookingDetail(
    @CurrentUser() user: { sub: number; role?: Role },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BookingDetail> {
    return this.mentorBookingService.getBookingDetail(user.sub, id);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mentor chấp nhận booking' })
  @ResponseMessage(Messages.MENTOR_BOOKING.ACCEPT_SUCCESS)
  @Roles(Role.MENTOR, Role.ADMIN)
  async acceptBooking(
    @CurrentUser() user: { sub: number; role?: Role },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.mentorBookingService.acceptBooking(user.sub, id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mentor từ chối booking' })
  @ResponseMessage(Messages.MENTOR_BOOKING.REJECT_SUCCESS)
  @Roles(Role.MENTOR, Role.ADMIN)
  async rejectBooking(
    @CurrentUser() user: { sub: number; role?: Role },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectBookingDto,
  ) {
    return this.mentorBookingService.rejectBooking(user.sub, id, dto);
  }
}
