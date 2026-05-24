import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, Role } from '@prisma/client';
import { MentorService } from './mentor.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('MentorService', () => {
  let service: MentorService;
  let consoleErrorSpy: jest.SpyInstance;

  const prisma = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    slot: {
      findMany: jest.fn(),
    },
    mentorProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    mentorApprovalLog: {
      create: jest.fn(),
    },
    userSkill: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const cloudinary = {
    uploadVideo: jest.fn(),
  };

  beforeEach(async () => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const moduleRef = await Test.createTestingModule({
      providers: [
        MentorService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();

    service = moduleRef.get(MentorService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const mentorUser: any = {
    id: 1,
    email: 'mentor@test.com',
    name: 'Mentor A',
    bio: 'Bio',
    avatarUrl: null,
    experienceYears: 3,
    linkedInLink: null,
    githubLink: null,
    createdAt: new Date(),
    role: Role.MENTOR,
    mentorProfile: {
      id: 10,
      headline: 'Backend Mentor',
      introductionVideoUrl: null,
      approvalStatus: ApprovalStatus.ACTIVE,
      createdAt: new Date(),
      experiences: [],
      coachingPlans: [],
    },
    skills: [],
  };

  it('findAll - happy path', async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findMany.mockResolvedValue([mentorUser]);

    const result = await service.findAll({ page: 1, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.items[0].id).toBe(1);
  });

  it('findAll - applies admin status, filters, search and safe pagination limit', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.user.findMany.mockResolvedValue([]);

    const result = await service.findAll(
      {
        page: 2,
        limit: 99,
        status: ApprovalStatus.PENDING,
        roleIds: [1],
        companyIds: [2],
        industry: 'software',
        skillIds: [3],
        categoryIds: [4],
        search: 'backend',
      } as any,
      { sub: 99, role: Role.ADMIN } as any,
    );

    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { role: Role.MENTOR },
        { mentorProfile: { is: { approvalStatus: ApprovalStatus.PENDING } } },
        { skills: { some: { skillId: { in: [3] } } } },
      ]),
    );
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 50, take: 50 }),
    );
    expect(result.meta.limit).toBe(50);
  });

  it('findAll - forces active status for a non-admin user', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.user.findMany.mockResolvedValue([]);

    await service.findAll(
      { status: ApprovalStatus.REJECTED } as any,
      { sub: 1, role: Role.CANDIDATE } as any,
    );

    expect(prisma.user.count.mock.calls[0][0].where.AND).toContainEqual({
      mentorProfile: { is: { approvalStatus: ApprovalStatus.ACTIVE } },
    });
  });

  it('findById - happy path', async () => {
    prisma.user.findFirst.mockResolvedValue(mentorUser);

    const result = await service.findById(1);

    expect(result.id).toBe(1);
    expect(result.email).toBe('mentor@test.com');
  });

  it('findAll and findById map nested experience, skill, plan and nullable details', async () => {
    const richUser: any = {
      ...mentorUser,
      mentorProfile: {
        ...mentorUser.mentorProfile,
        experiences: [
          {
            id: 1,
            description: 'Backend',
            isCurrent: true,
            startDate: new Date('2020-01-01'),
            endDate: null,
            company: { id: 1, name: 'Acme', logoUrl: null, industry: 'Tech' },
            jobRole: { id: 2, name: 'Engineer', description: 'Build' },
          },
        ],
        coachingPlans: [
          {
            id: 4,
            title: 'Interview',
            description: 'Practice',
            duration: 60,
            price: 100,
            questions: [
              {
                id: 5,
                question: 'Tell me',
                type: 'TEXT',
                placeholder: null,
                isRequired: true,
                orderIndex: 0,
              },
            ],
          },
        ],
      },
      skills: [
        {
          skill: { id: 6, name: 'NestJS', type: 'BACKEND' },
          level: 'INTERMEDIATE',
          experienceMonths: 12,
          proofUrl: null,
        },
      ],
    };
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findMany.mockResolvedValue([richUser]);
    const listed = await service.findAll({ page: 1, limit: 10 });
    expect(listed.items[0].mentorProfile?.experiences[0].company.name).toBe(
      'Acme',
    );
    expect(listed.items[0].skills[0].name).toBe('NestJS');

    prisma.user.findFirst.mockResolvedValueOnce(richUser);
    const detailed = await service.findById(1);
    expect(detailed.mentorProfile?.coachingPlans[0].questions[0].id).toBe(5);
    expect(detailed.mentorProfile?.experiences[0].jobRole?.name).toBe(
      'Engineer',
    );

    prisma.user.findFirst.mockResolvedValueOnce({
      ...richUser,
      mentorProfile: {
        ...richUser.mentorProfile,
        experiences: [
          {
            ...richUser.mentorProfile.experiences[0],
            company: null,
            jobRole: null,
          },
        ],
      },
    });
    const nullable = await service.findById(1);
    expect(nullable.mentorProfile?.experiences[0].company).toBeNull();
    expect(nullable.mentorProfile?.experiences[0].jobRole).toBeNull();
  });

  it('maps users without mentor profiles and defaults admin status filtering', async () => {
    const withoutProfile: any = {
      ...mentorUser,
      mentorProfile: null,
      skills: [],
    };
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findMany.mockResolvedValue([withoutProfile]);

    const list = await service.findAll({ page: 1, limit: 10 }, {
      sub: 99,
      role: Role.ADMIN,
    } as any);
    expect(list.items[0].mentorProfile).toBeNull();
    expect(prisma.user.findMany.mock.calls[0][0].where.AND).toContainEqual({
      mentorProfile: { is: { approvalStatus: ApprovalStatus.ACTIVE } },
    });

    prisma.user.findFirst.mockResolvedValue(withoutProfile);
    const detail = await service.findById(1);
    expect(detail.mentorProfile).toBeNull();
  });

  it('findById - unhappy path mentor not found', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findAvailableSlots - happy path', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 1 });
    prisma.slot.findMany.mockResolvedValue([
      {
        id: 100,
        mentorId: 1,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        isActive: true,
      },
    ]);

    const result = await service.findAvailableSlots(1);

    expect(result).toHaveLength(1);
    expect(result[0].mentorId).toBe(1);
  });

  it('findAvailableSlots - unhappy path mentor not found', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.findAvailableSlots(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updateMe - unhappy path user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.updateMe(999, {} as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updateMe - unhappy path user is not mentor', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      role: Role.CANDIDATE,
      mentorProfile: null,
    });

    await expect(service.updateMe(1, {} as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updateMe - updates profile data and returns remapped mentor', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      role: Role.MENTOR,
      mentorProfile: { id: 10 },
    });
    const tx = {
      user: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({
          ...mentorUser,
          name: 'Updated Mentor',
          mentorProfile: {
            ...mentorUser.mentorProfile,
            headline: 'Updated headline',
          },
        }),
      },
      mentorProfile: { upsert: jest.fn().mockResolvedValue({ id: 10 }) },
      experience: { deleteMany: jest.fn(), upsert: jest.fn() },
      userSkill: { deleteMany: jest.fn(), upsert: jest.fn() },
      coachingPlan: { deleteMany: jest.fn(), upsert: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await service.updateMe(1, {
      name: 'Updated Mentor',
      headline: 'Updated headline',
    } as any);

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ name: 'Updated Mentor' }),
    });
    expect(tx.mentorProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 1 },
      update: expect.objectContaining({
        headline: 'Updated headline',
        approvalStatus: ApprovalStatus.PENDING,
      }),
      create: expect.objectContaining({
        userId: 1,
        headline: 'Updated headline',
        approvalStatus: ApprovalStatus.PENDING,
      }),
    });
    expect(result.name).toBe('Updated Mentor');
  });

  it('updateMe - synchronizes experiences, skills, plans and nested questions', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      role: Role.MENTOR,
      mentorProfile: { id: 10 },
    });
    const tx = {
      user: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(mentorUser),
      },
      mentorProfile: { upsert: jest.fn().mockResolvedValue({ id: 10 }) },
      experience: { deleteMany: jest.fn(), upsert: jest.fn() },
      userSkill: { deleteMany: jest.fn(), upsert: jest.fn() },
      coachingPlan: { deleteMany: jest.fn(), upsert: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await service.updateMe(1, {
      headline: undefined,
      experiences: [
        {
          id: 2,
          companyId: 1,
          jobRoleId: 2,
          startDate: '2020-01-01',
          endDate: '2021-01-01',
          isCurrent: false,
        },
        {
          companyId: 1,
          jobRoleId: 2,
          startDate: '2022-01-01',
          isCurrent: true,
        },
      ],
      skills: [{ skillId: 3, experienceMonths: 12, proofUrl: null }],
      coachingPlans: [
        {
          id: 4,
          categoryId: 5,
          title: 'Mock',
          duration: 60,
          price: 100,
          questions: [{ id: 6, question: 'Why?', type: 'TEXT' }],
        },
        {
          categoryId: 5,
          title: 'Empty',
          duration: 30,
          price: 50,
        },
      ],
    } as any);

    expect(tx.experience.deleteMany).toHaveBeenCalled();
    expect(tx.experience.upsert).toHaveBeenCalledTimes(2);
    expect(tx.userSkill.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ level: 'LEARNING' }),
      }),
    );
    expect(tx.coachingPlan.upsert).toHaveBeenCalledTimes(2);
  });

  it('updateMe - handles a new nested question without an id', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      role: Role.MENTOR,
      mentorProfile: { id: 10 },
    });
    const upsert = jest.fn();
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        user: {
          update: jest.fn(),
          findUnique: jest.fn().mockResolvedValue(mentorUser),
        },
        mentorProfile: { upsert: jest.fn().mockResolvedValue({ id: 10 }) },
        coachingPlan: { deleteMany: jest.fn(), upsert },
      }),
    );

    await service.updateMe(1, {
      coachingPlans: [
        {
          categoryId: 5,
          title: 'New',
          questions: [{ question: 'New question', type: 'TEXT' }],
        },
      ],
    } as any);

    expect(upsert.mock.calls[0][0].update.questions.upsert[0].where).toEqual({
      id: 0,
    });
  });

  it.each([
    [[{ companyId: 0, jobRoleId: 2, startDate: '2020-01-01' }]],
    [[{ companyId: 1, jobRoleId: 0, startDate: '2020-01-01' }]],
    [[{ companyId: 1, jobRoleId: 2 }]],
    [
      [
        {
          companyId: 1,
          jobRoleId: 2,
          startDate: '2022-01-01',
          endDate: '2021-01-01',
        },
      ],
    ],
  ])('updateMe - rejects invalid experience input %#', async (experiences) => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      role: Role.MENTOR,
      mentorProfile: { id: 10 },
    });
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        user: { update: jest.fn(), findUnique: jest.fn() },
        mentorProfile: { upsert: jest.fn().mockResolvedValue({ id: 10 }) },
        experience: { deleteMany: jest.fn(), upsert: jest.fn() },
      }),
    );

    await expect(
      service.updateMe(1, { experiences } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateMe - rejects a plan without category and a missing transaction result', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      role: Role.MENTOR,
      mentorProfile: { id: 10 },
    });
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        user: { update: jest.fn(), findUnique: jest.fn() },
        mentorProfile: { upsert: jest.fn().mockResolvedValue({ id: 10 }) },
        coachingPlan: { deleteMany: jest.fn(), upsert: jest.fn() },
      }),
    );
    await expect(
      service.updateMe(1, {
        coachingPlans: [{ categoryId: 0, title: 'Invalid' }],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.$transaction.mockResolvedValueOnce(null);
    await expect(service.updateMe(1, {} as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('uploadIntroductionVideo - happy path', async () => {
    cloudinary.uploadVideo.mockResolvedValue({
      secure_url: 'https://cdn.test/video.mp4',
    });

    const result = await service.uploadIntroductionVideo({} as any);

    expect(result.videoUrl).toBe('https://cdn.test/video.mp4');
    expect(cloudinary.uploadVideo).toHaveBeenCalledWith(
      {},
      'mentor-introduction-video',
    );
  });

  it('approveMentor - activates mentor profile and writes approval log', async () => {
    prisma.user.findUnique.mockResolvedValue({
      mentorProfile: { id: 10, approvalStatus: ApprovalStatus.PENDING },
    });
    prisma.mentorProfile.update.mockResolvedValue({ id: 10 });
    prisma.mentorApprovalLog.create.mockResolvedValue({ id: 1 });
    prisma.$transaction.mockResolvedValue([]);

    await expect(service.approveMentor(1, 99)).resolves.toBeNull();

    expect(prisma.mentorProfile.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { approvalStatus: ApprovalStatus.ACTIVE },
    });
    expect(prisma.mentorApprovalLog.create).toHaveBeenCalledWith({
      data: {
        mentorId: 10,
        adminId: 99,
        statusBefore: ApprovalStatus.PENDING,
        statusAfter: ApprovalStatus.ACTIVE,
      },
    });
  });

  it('rejectMentor - rejects mentor with admin note and rejects missing profile', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      mentorProfile: { id: 10, approvalStatus: ApprovalStatus.PENDING },
    });
    prisma.mentorProfile.update.mockResolvedValue({ id: 10 });
    prisma.mentorApprovalLog.create.mockResolvedValue({ id: 1 });
    prisma.$transaction.mockResolvedValue([]);

    await expect(service.rejectMentor(1, 99, 'Incomplete')).resolves.toBeNull();
    expect(prisma.mentorApprovalLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        statusAfter: ApprovalStatus.REJECTED,
        note: 'Incomplete',
      }),
    });

    prisma.user.findUnique.mockResolvedValueOnce({ mentorProfile: null });
    await expect(service.rejectMentor(2, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('approveMentor - rejects a missing mentor profile', async () => {
    prisma.user.findUnique.mockResolvedValue({ mentorProfile: null });

    await expect(service.approveMentor(99, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getMyMentorProfile - maps experience, skill and coaching plan details', async () => {
    prisma.mentorProfile.findUnique.mockResolvedValue({
      id: 10,
      approvalStatus: ApprovalStatus.ACTIVE,
      headline: 'Backend',
      introductionVideoUrl: '/intro.mp4',
      user: {
        name: 'Mentor',
        bio: 'Bio',
        avatarUrl: null,
        githubLink: '/github',
        linkedInLink: '/linkedin',
      },
      experiences: [
        {
          id: 1,
          startDate: new Date('2020-01-01'),
          endDate: null,
          isCurrent: true,
          description: 'Dev',
          proofUrl: null,
          company: { id: 1, name: 'Acme', logoUrl: null },
          jobRole: { id: 2, name: 'Engineer' },
        },
      ],
      coachingPlans: [
        {
          id: 5,
          title: 'Mock',
          description: null,
          duration: 60,
          price: 100,
          isActive: true,
          category: { id: 3, name: 'Backend', slug: 'backend' },
          questions: [],
        },
      ],
    });
    prisma.userSkill.findMany.mockResolvedValue([
      {
        skill: { id: 6, name: 'NestJS', type: 'BACKEND' },
        experienceMonths: 12,
        level: 'INTERMEDIATE',
        proofUrl: null,
      },
    ]);

    const result = await service.getMyMentorProfile(1);

    expect(result.name).toBe('Mentor');
    expect(result.experiences[0].company.name).toBe('Acme');
    expect(result.skills[0]).toEqual(
      expect.objectContaining({ skill: 'NestJS', skillId: 6 }),
    );
    expect(result.coachingPlans[0].category.name).toBe('Backend');
  });

  it('getMyMentorProfile - rejects when profile does not exist', async () => {
    prisma.mentorProfile.findUnique.mockResolvedValue(null);

    await expect(service.getMyMentorProfile(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
