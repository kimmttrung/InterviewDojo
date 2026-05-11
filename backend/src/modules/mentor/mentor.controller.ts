import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MentorService } from './mentor.service';
import { QueryMentorDto, UpdateMentorDto } from './dto/mentor.dto';
import { MentorResponse } from './interfaces/mentor.interface';
import { Messages } from '../../common/constants/messages.constant';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('mentors')
export class MentorController {
  constructor(private readonly mentorService: MentorService) {}

  @Get()
  @ResponseMessage(Messages.MENTOR.FETCHED)
  async findAll(
    @Query() query: QueryMentorDto,
    @CurrentUser() user?: JwtPayload,
  ): Promise<MentorResponse[]> {
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

  @Get(':id/available-slots')
  @ResponseMessage(Messages.MENTOR.AVAILABLE_SLOTS_FETCHED)
  findAvailableSlots(@Param('id', ParseIntPipe) id: number) {
    return this.mentorService.findAvailableSlots(id);
  }

  @Get(':id')
  @ResponseMessage(Messages.MENTOR.DETAIL_FETCHED)
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.mentorService.findById(id);
  }
}
