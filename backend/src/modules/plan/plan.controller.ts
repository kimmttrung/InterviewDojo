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

  @Get('users/:userId')
  @ResponseMessage(Messages.PLAN.FETCHED)
  async getPlansByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlanResponse[]> {
    return this.planService.findAllByMentor(userId, user);
  }
  /**
   * Candidate/Admin: Xem danh sách gói của một mentor cụ thể
   * GET /plans/mentor/:mentorId
   */
  @Get('mentor/:mentorId')
  @ResponseMessage(Messages.PLAN.FETCHED)
  async getPlansByMentor(
    @Param('mentorId', ParseIntPipe) mentorId: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlanResponse[]> {
    return this.planService.findAllByMentor(mentorId, user);
  }

  /**
   * Mentor: Xem danh sách gói của chính mình
   * GET /plans/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.PLAN.FETCHED)
  async getMyPlans(@CurrentUser() user: JwtPayload): Promise<PlanResponse[]> {
    return this.planService.findAllByMentor(user.sub, user);
  }

  /**
   * Mentor: Tạo gói dịch vụ mới
   * POST /plans
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.PLAN.CREATED)
  async createPlan(
    @Body() createPlanDto: CreatePlanDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PlanResponse> {
    return this.planService.create(user.sub, createPlanDto);
  }

  /**
   * Mentor: Cập nhật gói dịch vụ
   * PUT /plans/:planId
   */
  @Put(':planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.PLAN.UPDATED)
  async updatePlan(
    @Param('planId', ParseIntPipe) planId: number,
    @Body() updatePlanDto: UpdatePlanDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PlanResponse> {
    return this.planService.update(planId, user.sub, updatePlanDto);
  }

  /**
   * Mentor: Xóa gói dịch vụ
   * DELETE /plans/:planId
   */
  @Delete(':planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @ResponseMessage(Messages.PLAN.DELETED)
  async removePlan(
    @Param('planId', ParseIntPipe) planId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<PlanResponse> {
    return this.planService.remove(planId, user.sub);
  }

  /**
   * Admin: Duyệt gói dịch vụ
   * PATCH /plans/:planId/approve
   */
  @Patch(':planId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.PLAN.APPROVED)
  async approvePlan(
    @Param('planId', ParseIntPipe) planId: number,
  ): Promise<PlanResponse> {
    return this.planService.approve(planId);
  }
}
