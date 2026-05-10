import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { PlanResponse } from './interfaces/plan.interface';
import { Messages } from '../../common/constants/messages.constant';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  // Lấy danh sách gói của một Mentor cụ thể (Dành cho Candidate/Admin)
  @Get('mentors/:mentor_id/allplans')
  @ResponseMessage(Messages.PLAN.FETCHED)
  async getPlansByMentor(
    @Param('mentor_id', ParseIntPipe) mentorId: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlanResponse[]> {
    return this.planService.findAllByMentor(mentorId, user);
  }

  // Mentor tự lấy danh sách gói của mình
  @Get('plans/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.PLAN.FETCHED)
  async getMyPlans(@CurrentUser() user: JwtPayload): Promise<PlanResponse[]> {
    return this.planService.findAllByMentor(user.sub, user);
  }

  // Mentor tạo mới gói dịch vụ
  @Post('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.PLAN.CREATED)
  async createPlan(
    @Body() createPlanDto: CreatePlanDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PlanResponse> {
    return this.planService.create(user.sub, createPlanDto);
  }

  // Mentor cập nhật gói dịch vụ
  @Put('mentor/me/:plan_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.PLAN.UPDATED)
  async updatePlan(
    @Param('plan_id', ParseIntPipe) planId: number,
    @Body() updatePlanDto: UpdatePlanDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PlanResponse> {
    return this.planService.update(planId, user.sub, updatePlanDto);
  }

  // Mentor xóa/ẩn gói dịch vụ
  @Delete('mentor/me/:plan_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.PLAN.DELETED)
  async removePlan(
    @Param('plan_id', ParseIntPipe) planId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<PlanResponse> {
    return this.planService.remove(planId, user.sub);
  }

  // Admin duyệt gói dịch vụ (Nếu cần thiết kế thêm logic duyệt)
  @Patch('mentors/:mentor_id/:plan_id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.PLAN.APPROVED)
  async approvePlan(
    @Param('plan_id', ParseIntPipe) planId: number,
  ): Promise<PlanResponse> {
    return this.planService.approve(planId);
  }
}
