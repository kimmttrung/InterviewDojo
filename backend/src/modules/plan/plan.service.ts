import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { PlanResponse } from './interfaces/plan.interface';
import { Messages } from '../../common/constants/messages.constant';
import { Role } from '@prisma/client';

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  private mapToPlanResponse(plan: any): PlanResponse {
    return {
      id: plan.id,
      mentorId: plan.mentorId,
      title: plan.title,
      description: plan.description,
      durationMinutes: plan.durationMinutes,
      price: plan.price,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
    };
  }

  async findAllByMentor(
    mentorId: number,
    currentUser: any,
  ): Promise<PlanResponse[]> {
    // Logic RBAC:
    // - Candidate/Admin: Truyền mentor_id trên URL, xem các gói đang active (Candidate) hoặc tất cả (Admin)
    // - Mentor: Có thể truyền hoặc không, nhưng nếu là Mentor thì chỉ được xem của chính họ (nếu họ truy cập /mentors/me/plans)

    const isAdmin = currentUser?.role === Role.ADMIN;
    const isOwner = currentUser?.sub === mentorId;

    // Nếu không phải admin và không phải chủ sở hữu, chỉ hiển thị gói đang active
    const whereCondition: any = { mentorId };
    if (!isAdmin && !isOwner) {
      whereCondition.isActive = true;
    }

    const plans = await this.prisma.coachingPlan.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
    });

    return plans.map(this.mapToPlanResponse);
  }

  async create(mentorId: number, data: CreatePlanDto): Promise<PlanResponse> {
    // Đảm bảo user này thực sự là Mentor (đã có profile)
    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId: mentorId },
    });

    if (!mentorProfile) {
      throw new ForbiddenException(
        'Bạn phải tạo Mentor Profile trước khi tạo gói dịch vụ.',
      );
    }

    const plan = await this.prisma.coachingPlan.create({
      data: {
        mentorId,
        title: data.title,
        description: data.description,
        duration: data.duration,
        price: data.price,
        isActive: data.isActive ?? true,
      },
    });

    return this.mapToPlanResponse(plan);
  }

  async update(
    planId: number,
    mentorId: number,
    data: UpdatePlanDto,
  ): Promise<PlanResponse> {
    const plan = await this.prisma.coachingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.mentorId !== mentorId) {
      throw new NotFoundException(Messages.PLAN.NOT_FOUND);
    }

    const updatedPlan = await this.prisma.coachingPlan.update({
      where: { id: planId },
      data,
    });

    return this.mapToPlanResponse(updatedPlan);
  }

  async remove(planId: number, mentorId: number): Promise<PlanResponse> {
    const plan = await this.prisma.coachingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.mentorId !== mentorId) {
      throw new NotFoundException(Messages.PLAN.NOT_FOUND);
    }

    const deletedPlan = await this.prisma.coachingPlan.delete({
      where: { id: planId },
    });
    return this.mapToPlanResponse(deletedPlan);
  }

  async approve(planId: number): Promise<PlanResponse> {
    const plan = await this.prisma.coachingPlan.update({
      where: { id: planId },
      data: { isActive: true },
    });

    return this.mapToPlanResponse(plan);
  }
}
