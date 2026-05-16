import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { MentorService } from './mentor.service';
import { QueryMentorDto, UpdateMentorDto } from './dto/mentor.dto';
import {
  MentorResponse,
  PaginatedMentorResponse,
} from './interfaces/mentor.interface';
import { Messages } from '../../common/constants/messages.constant';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UploadedFileType } from '@/common/types/uploaded-file.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { BookingService } from '../booking/booking.service';
@Controller('mentors')
export class MentorController {
  constructor(
    private readonly mentorService: MentorService,
    private readonly bookingService: BookingService,
  ) {}

  @Get()
  @ResponseMessage(Messages.MENTOR.FETCHED)
  async findAll(
    @Query() query: QueryMentorDto,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PaginatedMentorResponse> {
    return this.mentorService.findAll(query, user);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.MENTOR.UPDATED)
  async updateMe(
    @Body() updateMentorDto: UpdateMentorDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MentorResponse> {
    return this.mentorService.updateMe(Number(user.sub), updateMentorDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  async getMyMentorProfile(@CurrentUser('sub') userId: number) {
    const mentorProfile = await this.mentorService.getMyMentorProfile(userId);

    return mentorProfile;
  }

  // @Get(':id/available-slots')
  // @ResponseMessage(Messages.MENTOR.AVAILABLE_SLOTS_FETCHED)
  // findAvailableSlots(@Param('id', ParseIntPipe) id: number) {
  //   return this.mentorService.findAvailableSlots(id);
  // }

  @Get(':id')
  @ResponseMessage(Messages.MENTOR.DETAIL_FETCHED)
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.mentorService.findById(id);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.MENTOR.APPROVED)
  async approveMentor(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.mentorService.approveMentor(id, Number(admin.sub));
  }

  @Post('upload/introduction-video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadIntroductionVideo(
    @UploadedFile()
    file: UploadedFileType,
  ) {
    const data = await this.mentorService.uploadIntroductionVideo(file);

    return data;
  }

  @Patch('bookings/:bookingId/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.MENTOR_BOOKING.ACCEPT_SUCCESS)
  async acceptBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bookingService.accept(bookingId, Number(user.sub));
  }

  @Patch('bookings/:bookingId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.MENTOR_BOOKING.REJECT_SUCCESS)
  async rejectBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bookingService.reject(bookingId, Number(user.sub), reason);
  }
}
