import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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
      mentorId: plan.mentorId, // MentorProfile.id
      mentorUserId: plan.mentor?.userId ?? null, // User.id (nếu có include)
      categoryId: plan.categoryId,
      categoryName: plan.category?.name ?? null,
      title: plan.title,
      description: plan.description,
      duration: plan.duration,
      price: plan.price,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
    };
  }

  async findAllByMentor(
    userId: number,
    currentUser?: any,
  ): Promise<PlanResponse[]> {
    const isAdmin = currentUser?.role === Role.ADMIN;
    const isOwner = currentUser?.sub === userId;

    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId },
    });

    if (!mentorProfile) return [];

    const whereCondition: any = { mentorId: mentorProfile.id };
    if (!isAdmin && !isOwner) {
      whereCondition.isActive = true;
    }

    const plans = await this.prisma.coachingPlan.findMany({
      where: whereCondition,
      include: {
        category: true,
        mentor: { select: { userId: true } },
        questions: { orderBy: { orderIndex: 'asc' } }, // thêm questions
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => ({
      id: plan.id,
      mentorId: plan.mentorId,
      mentorUserId: plan.mentor?.userId ?? null,
      categoryId: plan.categoryId,
      categoryName: plan.category?.name ?? null,
      title: plan.title,
      description: plan.description,
      duration: plan.duration,
      price: plan.price,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      questions: plan.questions.map((q) => ({
        // thêm questions vào response
        id: q.id,
        question: q.question,
        type: q.type,
        isRequired: q.isRequired,
        orderIndex: q.orderIndex,
      })),
    }));
  }

  async create(
    mentorUserId: number,
    data: CreatePlanDto,
  ): Promise<PlanResponse> {
    // 1. Kiểm tra category
    const category = await this.prisma.coachingCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) throw new BadRequestException('Danh mục không tồn tại');

    // 2. Lấy MentorProfile từ userId
    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
    });
    if (!mentorProfile) {
      throw new ForbiddenException(
        'Bạn phải tạo Mentor Profile trước khi tạo gói dịch vụ.',
      );
    }

    // 3. Tạo Plan – dùng mentorProfile.id
    const plan = await this.prisma.coachingPlan.create({
      data: {
        mentorId: mentorProfile.id,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        duration: data.duration,
        price: data.price,
        isActive: data.isActive ?? true,
      },
      include: {
        category: true, // để mapToPlanResponse lấy categoryName
        mentor: {
          // để lấy userId
          select: { userId: true },
        },
      },
    });

    return this.mapToPlanResponse(plan);
  }

  async update(
    planId: number,
    userId: number, // User.id từ token
    data: UpdatePlanDto,
  ): Promise<PlanResponse> {
    // 1. Tìm plan hiện tại (kèm userId của mentor)
    const plan = await this.prisma.coachingPlan.findUnique({
      where: { id: planId },
      include: { mentor: { select: { userId: true } } },
    });

    if (!plan) {
      throw new NotFoundException(Messages.PLAN.NOT_FOUND);
    }

    // 2. Kiểm tra quyền sở hữu
    if (plan.mentor.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa gói này');
    }

    // 3. Cập nhật
    const updatedPlan = await this.prisma.coachingPlan.update({
      where: { id: planId },
      data,
      include: {
        category: true,
        mentor: { select: { userId: true } },
      },
    });

    return this.mapToPlanResponse(updatedPlan);
  }

  async remove(planId: number, userId: number): Promise<PlanResponse> {
    const plan = await this.prisma.coachingPlan.findUnique({
      where: { id: planId },
      include: { mentor: { select: { userId: true } } },
    });

    if (!plan) {
      throw new NotFoundException(Messages.PLAN.NOT_FOUND);
    }

    if (plan.mentor.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa gói này');
    }

    const deletedPlan = await this.prisma.coachingPlan.delete({
      where: { id: planId },
      include: {
        category: true,
        mentor: { select: { userId: true } },
      },
    });

    return this.mapToPlanResponse(deletedPlan);
  }

  async approve(planId: number): Promise<PlanResponse> {
    const plan = await this.prisma.coachingPlan.update({
      where: { id: planId },
      data: { isActive: true },
      include: {
        category: true,
        mentor: { select: { userId: true } },
      },
    });

    return this.mapToPlanResponse(plan);
  }
}
