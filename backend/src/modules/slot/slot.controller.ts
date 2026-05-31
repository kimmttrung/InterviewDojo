import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { Role } from '@prisma/client';

import { SlotService } from './slot.service';

import { CreateSlotDto, UpdateSlotDto, QuerySlotDto } from './dto/slot.dto';

import { SlotResponse } from './interfaces/slot.interfaces';

import { Messages } from '../../common/constants/messages.constant';

import { ResponseMessage } from '../../common/decorators/response-message.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('slots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @Get()
  @ResponseMessage(Messages.SLOT.FETCHED)
  async findAll(
    @Query() query: QuerySlotDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SlotResponse[]> {
    return this.slotService.findAll(query, user);
  }

  @Post()
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.SLOT.CREATED)
  async create(
    @Body() createSlotDto: CreateSlotDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SlotResponse> {
    return this.slotService.create(user.sub, createSlotDto);
  }

  @Patch(':id')
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.SLOT.UPDATED)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSlotDto: UpdateSlotDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SlotResponse> {
    return this.slotService.update(id, user.sub, updateSlotDto);
  }

  @Delete(':id')
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.SLOT.DELETED)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<SlotResponse> {
    return this.slotService.remove(id, user.sub);
  }

  @Get('mentors/:mentorId/available-days')
  @ResponseMessage(Messages.SLOT.GET_AVAILABLE_DAYS)
  async getAvailableDays(
    @Param('mentorId', ParseIntPipe) mentorId: number,
    @Query('planId', ParseIntPipe) planId: number,
    @Query('month') month: string,
  ) {
    return this.slotService.getAvailableDays(mentorId, planId, month);
  }

  @Get('mentors/:mentorId/available-sessions')
  @ResponseMessage(Messages.SLOT.GET_AVAILABLE_SESSIONS)
  async getAvailableSessions(
    @Param('mentorId', ParseIntPipe) mentorId: number,
    @Query('planId', ParseIntPipe) planId: number,
    @Query('date') date: string,
  ) {
    return this.slotService.getAvailableSessions(mentorId, planId, date);
  }
}
