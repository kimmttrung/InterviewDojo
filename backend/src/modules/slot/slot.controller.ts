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
import { Role } from '@prisma/client'; // Import Role từ Prisma như trong file roles.decorator.ts của bạn

import { SlotService } from './slot.service';
import {
  CreateSlotDto,
  CreateBatchSlotDto,
  UpdateSlotDto,
  DeleteBatchSlotDto,
  QuerySlotDto,
} from './dto/slot.dto';
import {
  SlotResponse,
  BatchPayloadResponse,
} from './interfaces/slot.interfaces';

// Constants & Decorators
import { Messages } from '../../common/constants/messages.constant';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

// Guards & Interfaces
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('slots')
@UseGuards(JwtAuthGuard, RolesGuard) // Bật chốt chặn bảo mật cho toàn bộ Controller
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @Get()
  // Không đặt @Roles ở đây vì GET cho phép cả MENTOR, CANDIDATE và ADMIN truy cập.
  // RolesGuard đã được thiết kế để return `true` nếu không có requireRoles.
  @ResponseMessage(Messages.SLOT.FETCHED)
  async findAll(
    @Query() query: QuerySlotDto,
    @CurrentUser() user: JwtPayload, // Ép kiểu chuẩn thay vì any
  ): Promise<SlotResponse[]> {
    return this.slotService.findAll(query, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR) // Chỉ Mentor (hoặc Admin do logic RolesGuard) mới được truy cập
  @ResponseMessage(Messages.SLOT.CREATED)
  async create(
    @Body() createSlotDto: CreateSlotDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SlotResponse> {
    // Truyền user.sub (chính là userId) vào service
    return this.slotService.create(user.sub, createSlotDto);
  }

  @Post('batch')
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.SLOT.BATCH_CREATED)
  async createBatch(
    @Body() createBatchSlotDto: CreateBatchSlotDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BatchPayloadResponse> {
    return this.slotService.createBatch(user.sub, createBatchSlotDto);
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

  @Delete('batch')
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.SLOT.BATCH_DELETED)
  async removeBatch(
    @Body() deleteBatchSlotDto: DeleteBatchSlotDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BatchPayloadResponse> {
    return this.slotService.removeBatch(user.sub, deleteBatchSlotDto);
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
}
