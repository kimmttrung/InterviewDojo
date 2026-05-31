import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, Role } from '@prisma/client';
import { MentorAdminService } from './mentor-admin.service';

describe('MentorAdminService', () => {
  let service: MentorAdminService;
  let prisma: any;
  let eventEmitter: any; // Add eventEmitter mock holder

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(), // Added to support user promotion
      },
      mentorProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      mentorApprovalLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb), // Mock transaction to immediately execute array elements
    };

    // Mock EventEmitter2
    eventEmitter = {
      emit: jest.fn(),
    };

    // Pass BOTH arguments into the constructor to fix TS2554 error
    service = new MentorAdminService(prisma, eventEmitter);
  });

  it('lists mentor profiles filtered by approval status', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
    prisma.user.count.mockResolvedValue(1);

    const result = await service.findAll({
      page: 2,
      limit: 10,
      status: ApprovalStatus.PENDING,
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          mentorProfile: { is: { approvalStatus: ApprovalStatus.PENDING } },
        },
        skip: 10,
        take: 10,
      }),
    );
    expect(result.meta).toEqual(
      expect.objectContaining({ total: 1, page: 2, limit: 10 }),
    );
  });

  it('maps mentor detail skills from user skills', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'mentor@test.com',
      mentorProfile: { id: 9 },
      skills: [
        {
          level: 'ADVANCED',
          experienceMonths: 24,
          proofUrl: 'https://proof.test',
          skill: { id: 3, name: 'React', type: 'TECHNICAL' },
        },
      ],
    });

    const result = await service.findOne(1);

    expect(result.skills).toEqual([
      {
        id: 3,
        name: 'React',
        type: 'TECHNICAL',
        level: 'ADVANCED',
        experienceMonths: 24,
        proofUrl: 'https://proof.test',
      },
    ]);
  });

  it('throws when mentor detail has no mentor profile', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, mentorProfile: null });

    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approves a pending mentor, upgrades user role, writes log, and emits event', async () => {
    prisma.mentorProfile.findUnique.mockResolvedValue({
      id: 9,
      userId: 1,
      approvalStatus: ApprovalStatus.PENDING,
      user: { id: 1, role: Role.CANDIDATE }, // Added to mock the included user relation
    });

    await service.approve(1, 99);

    // Verify transaction executes all updates including the role promotion and normalized notes
    expect(prisma.$transaction).toHaveBeenCalledWith([
      prisma.mentorProfile.update({
        where: { userId: 1 },
        data: { approvalStatus: ApprovalStatus.ACTIVE },
      }),
      prisma.user.update({
        where: { id: 1 },
        data: { role: Role.MENTOR },
      }),
      prisma.mentorApprovalLog.create({
        data: {
          mentorId: 9,
          adminId: 99,
          statusBefore: ApprovalStatus.PENDING,
          statusAfter: ApprovalStatus.ACTIVE,
          note: 'Profile approved by administrator',
        },
      }),
    ]);

    // Verify the profile updated event was triggered
    expect(eventEmitter.emit).toHaveBeenCalledWith('user.profile.updated', {
      userId: 1,
      role: Role.MENTOR,
    });
  });

  it('rejects approving an already active mentor', async () => {
    prisma.mentorProfile.findUnique.mockResolvedValue({
      approvalStatus: ApprovalStatus.ACTIVE,
    });

    await expect(service.approve(1, 99)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a mentor with an admin reason and writes an approval log', async () => {
    prisma.mentorProfile.findUnique.mockResolvedValue({
      id: 9,
      userId: 1,
      approvalStatus: ApprovalStatus.PENDING,
    });

    await service.reject(1, 'Missing evidence', 99);

    expect(prisma.$transaction).toHaveBeenCalledWith([
      prisma.mentorProfile.update({
        where: { userId: 1 },
        data: { approvalStatus: ApprovalStatus.REJECTED },
      }),
      prisma.mentorApprovalLog.create({
        data: {
          mentorId: 9,
          adminId: 99,
          statusBefore: ApprovalStatus.PENDING,
          statusAfter: ApprovalStatus.REJECTED,
          note: 'Missing evidence',
        },
      }),
    ]);
  });
});
