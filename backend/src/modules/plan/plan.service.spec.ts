import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanService } from './plan.service';

describe('PlanService', () => {
  let service: PlanService;

  const prisma = {
    mentorProfile: { findUnique: jest.fn() },
    coachingCategory: { findUnique: jest.fn() },
    coachingPlan: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const basePlan = {
    id: 3,
    mentorId: 20,
    categoryId: 2,
    title: 'Backend Mock',
    description: 'Practice',
    duration: 60,
    price: 100,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    category: { name: 'Backend' },
    mentor: { userId: 7 },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PlanService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(PlanService);
    jest.clearAllMocks();
  });

  it('shows only active plans to a visitor and includes questions', async () => {
    prisma.mentorProfile.findUnique.mockResolvedValue({ id: 20 });
    prisma.coachingPlan.findMany.mockResolvedValue([
      {
        ...basePlan,
        questions: [
          {
            id: 1,
            question: 'Why Nest?',
            type: 'TEXT',
            isRequired: true,
            orderIndex: 1,
          },
        ],
      },
    ]);

    const result = await service.findAllByMentor(7);

    expect(prisma.coachingPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { mentorId: 20, isActive: true } }),
    );
    expect(result[0].questions).toEqual([
      {
        id: 1,
        question: 'Why Nest?',
        type: 'TEXT',
        isRequired: true,
        orderIndex: 1,
      },
    ]);
  });

  it('allows owner and admin to see inactive plans and returns empty without profile', async () => {
    prisma.mentorProfile.findUnique.mockResolvedValueOnce({ id: 20 });
    prisma.coachingPlan.findMany.mockResolvedValueOnce([]);
    await service.findAllByMentor(7, { sub: 7, role: Role.MENTOR });
    expect(prisma.coachingPlan.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { mentorId: 20 } }),
    );

    prisma.mentorProfile.findUnique.mockResolvedValueOnce({ id: 20 });
    prisma.coachingPlan.findMany.mockResolvedValueOnce([]);
    await service.findAllByMentor(7, { sub: 1, role: Role.ADMIN });
    expect(prisma.coachingPlan.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { mentorId: 20 } }),
    );

    prisma.mentorProfile.findUnique.mockResolvedValueOnce(null);
    await expect(service.findAllByMentor(999)).resolves.toEqual([]);
  });

  it('creates a plan for an existing mentor profile and category', async () => {
    prisma.coachingCategory.findUnique.mockResolvedValue({ id: 2 });
    prisma.mentorProfile.findUnique.mockResolvedValue({ id: 20 });
    prisma.coachingPlan.create.mockResolvedValue(basePlan);

    const result = await service.create(7, {
      categoryId: 2,
      title: 'Backend Mock',
      description: 'Practice',
      duration: 60,
      price: 100,
    });

    expect(prisma.coachingPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mentorId: 20, isActive: true }),
      }),
    );
    expect(result.categoryName).toBe('Backend');
    expect(result.mentorUserId).toBe(7);
  });

  it('rejects plan creation with a missing category or mentor profile', async () => {
    prisma.coachingCategory.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.create(7, { categoryId: 99 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.coachingCategory.findUnique.mockResolvedValueOnce({ id: 2 });
    prisma.mentorProfile.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.create(7, { categoryId: 2 } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updates and removes plans owned by the mentor', async () => {
    prisma.coachingPlan.findUnique.mockResolvedValue(basePlan);
    prisma.coachingPlan.update.mockResolvedValue({ ...basePlan, title: 'New' });
    prisma.coachingPlan.delete.mockResolvedValue(basePlan);

    await expect(service.update(3, 7, { title: 'New' })).resolves.toEqual(
      expect.objectContaining({ title: 'New' }),
    );
    await expect(service.remove(3, 7)).resolves.toEqual(
      expect.objectContaining({ id: 3 }),
    );
  });

  it('rejects missing or foreign plans during update and remove', async () => {
    prisma.coachingPlan.findUnique.mockResolvedValueOnce(null);
    await expect(service.update(99, 7, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.coachingPlan.findUnique.mockResolvedValueOnce(basePlan);
    await expect(service.update(3, 99, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    prisma.coachingPlan.findUnique.mockResolvedValueOnce(basePlan);
    await expect(service.remove(3, 99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    prisma.coachingPlan.findUnique.mockResolvedValueOnce(null);
    await expect(service.remove(99, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('approves a plan by activating it', async () => {
    prisma.coachingPlan.update.mockResolvedValue(basePlan);

    await expect(service.approve(3)).resolves.toEqual(
      expect.objectContaining({ isActive: true }),
    );
    expect(prisma.coachingPlan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3 },
        data: { isActive: true },
      }),
    );
  });

  it('maps missing mentor and category relations to null', async () => {
    prisma.coachingCategory.findUnique.mockResolvedValue({ id: 2 });
    prisma.mentorProfile.findUnique.mockResolvedValue({ id: 20 });
    prisma.coachingPlan.create.mockResolvedValue({
      ...basePlan,
      category: null,
      mentor: null,
    });

    const created = await service.create(7, {
      categoryId: 2,
      title: 'No relations',
      duration: 30,
      price: 50,
    } as any);
    expect(created.categoryName).toBeNull();
    expect(created.mentorUserId).toBeNull();

    prisma.mentorProfile.findUnique.mockResolvedValue({ id: 20 });
    prisma.coachingPlan.findMany.mockResolvedValue([
      { ...basePlan, category: null, mentor: null, questions: [] },
    ]);
    const listed = await service.findAllByMentor(7, { sub: 7 });
    expect(listed[0].categoryName).toBeNull();
    expect(listed[0].mentorUserId).toBeNull();
  });
});
