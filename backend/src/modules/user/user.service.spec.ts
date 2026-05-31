import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role, SessionMode } from '@prisma/client';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('UserService', () => {
  let service: UserService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    skill: {
      findMany: jest.fn(),
    },
    jobRole: {
      findUnique: jest.fn(),
    },
    mockSession: {
      count: jest.fn(),
    },
    codeSubmission: {
      count: jest.fn(),
    },
    feedback: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const cloudinaryService = {
    uploadAvatar: jest.fn(),
    deleteFile: jest.fn(),
  };

  const baseUser: any = {
    id: 1,
    email: 'user@test.com',
    name: 'User Test',
    bio: 'Bio',
    avatarUrl: null,
    linkedInLink: null,
    githubLink: null,
    experienceYears: 1,
    creditBalance: 100,
    role: Role.CANDIDATE,
    status: 'ACTIVE',
    targetRoleId: null,
    skills: [],
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinaryService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(UserService);

    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getMe', () => {
    it('happy path - return current user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        experienceYears: 1,
        skills: [
          {
            level: 'BEGINNER',
            experienceMonths: 6,
            proofUrl: 'https://proof.test',
            skill: {
              id: 10,
              name: 'NestJS',
              type: 'BACKEND',
            },
          },
        ],
      });

      const result = await service.getMe(1);

      expect(result.id).toBe(1);
      expect(result.currentLevel).toBe('Junior/Fresher');
      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe('NestJS');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });
    });

    it('unhappy path - user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('happy path - return user by id', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        experienceYears: 3,
        skills: [],
        targetRole: {
          id: 1,
          name: 'Backend Developer',
        },
      });

      const result = await service.findById(1);

      expect(result.id).toBe(1);
      expect(result.currentLevel).toBe('Mid-level');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          targetRole: true,
          skills: { include: { skill: true } },
        },
      });
    });

    it('unhappy path - user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateMe', () => {
    it('unhappy path - missing dto', async () => {
      await expect(
        service.updateMe(1, undefined as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('happy path - update basic profile without skills', async () => {
      prisma.$transaction.mockImplementation(async (callback) =>
        callback({
          user: {
            update: jest.fn().mockResolvedValue({
              ...baseUser,
              name: 'Updated User',
              experienceYears: 6,
              skills: [],
            }),
          },
        }),
      );

      const result = await service.updateMe(1, {
        name: 'Updated User',
        experienceYears: 6,
      } as any);

      expect(result.name).toBe('Updated User');
      expect(result.currentLevel).toBe('Senior');
    });

    it('happy path - update with valid skills and connect target role', async () => {
      const txSkillFindMany = jest.fn().mockResolvedValue([{ id: 10 }]);
      const txUserUpdate = jest.fn().mockResolvedValue({
        ...baseUser,
        targetRoleId: 2,
        skills: [
          {
            level: 'INTERMEDIATE',
            experienceMonths: 12,
            proofUrl: null,
            skill: {
              id: 10,
              name: 'TypeScript',
              type: 'LANGUAGE',
            },
          },
        ],
      });

      prisma.$transaction.mockImplementation(async (callback) =>
        callback({
          skill: {
            findMany: txSkillFindMany,
          },
          user: {
            update: txUserUpdate,
          },
        }),
      );

      const result = await service.updateMe(1, {
        name: 'User Updated',
        targetRoleId: 2,
        skills: [
          {
            skillId: 10,
            level: 'INTERMEDIATE',
            experienceMonths: 12,
            proofUrl: null,
          },
        ],
      } as any);

      expect(result.targetRoleId).toBe(2);
      expect(result.skills[0].skillId).toBe(10);
      expect(txSkillFindMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [10],
          },
        },
        select: {
          id: true,
        },
      });
      expect(txUserUpdate).toHaveBeenCalled();
    });

    it('happy path - disconnect target role when targetRoleId is null', async () => {
      const txUserUpdate = jest.fn().mockResolvedValue({
        ...baseUser,
        targetRoleId: null,
        skills: [],
      });

      prisma.$transaction.mockImplementation(async (callback) =>
        callback({
          user: {
            update: txUserUpdate,
          },
        }),
      );

      const result = await service.updateMe(1, {
        targetRoleId: null,
      } as any);

      expect(result.targetRoleId).toBeNull();

      const updateArgs = txUserUpdate.mock.calls[0][0];
      expect(updateArgs.data.targetRole).toEqual({
        disconnect: true,
      });
    });

    it('unhappy path - invalid skill id', async () => {
      prisma.$transaction.mockImplementation(async (callback) =>
        callback({
          skill: {
            findMany: jest.fn().mockResolvedValue([]),
          },
          user: {
            update: jest.fn(),
          },
        }),
      );

      await expect(
        service.updateMe(1, {
          skills: [
            {
              skillId: 999,
              level: 'BEGINNER',
              experienceMonths: 1,
            },
          ],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getStats', () => {
    it('happy path - return stats with average score', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.mockSession.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);
      prisma.codeSubmission.count.mockResolvedValue(5);
      prisma.feedback.findMany.mockResolvedValue([
        { overallScore: 8 },
        { overallScore: 9 },
      ]);

      const result = await service.getStats(1);

      expect(result.totalCodeSubmissions).toBe(5);
      expect(result.totalPracticeSessions).toBe(5);
      expect(result.practiceBreakdown.soloMode).toBe(3);
      expect(result.practiceBreakdown.peerMode).toBe(2);
      expect(result.averageScore).toBe(8.5);
      expect(prisma.mockSession.count).toHaveBeenNthCalledWith(1, {
        where: { intervieweeId: 1, mode: SessionMode.SOLO },
      });
      expect(prisma.mockSession.count).toHaveBeenNthCalledWith(2, {
        where: { intervieweeId: 1, mode: SessionMode.MEET },
      });
    });

    it('happy path - no feedback returns average score 0', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.mockSession.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.codeSubmission.count.mockResolvedValue(0);
      prisma.feedback.findMany.mockResolvedValue([]);

      const result = await service.getStats(1);

      expect(result.averageScore).toBe(0);
    });

    it('unhappy path - user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getStats(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateTargetRole', () => {
    it('happy path - candidate updates target role', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        role: Role.CANDIDATE,
      });
      prisma.jobRole.findUnique.mockResolvedValue({
        id: 2,
        name: 'Backend Developer',
      });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        targetRoleId: 2,
      });

      const result = await service.updateTargetRole(1, {
        target_role_id: 2,
      });

      expect(result).toEqual({
        targetRole: 'Backend Developer',
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { targetRole: { connect: { id: 2 } } },
      });
    });

    it('unhappy path - user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTargetRole(999, { target_role_id: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('unhappy path - user is not candidate', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        role: Role.MENTOR,
      });

      await expect(
        service.updateTargetRole(1, { target_role_id: 1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('unhappy path - target role not found', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        role: Role.CANDIDATE,
      });
      prisma.jobRole.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTargetRole(1, { target_role_id: 999 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('uploadAvatar', () => {
    const validFile: any = {
      size: 1024,
      mimetype: 'image/png',
      originalname: 'avatar.png',
      buffer: Buffer.from('test'),
    };

    it('unhappy path - file too large', async () => {
      await expect(
        service.uploadAvatar(1, {
          ...validFile,
          size: 6 * 1024 * 1024,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('unhappy path - invalid mime type', async () => {
      await expect(
        service.uploadAvatar(1, {
          ...validFile,
          mimetype: 'application/pdf',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('happy path - upload avatar without old avatar', async () => {
      prisma.user.findUnique.mockResolvedValue({
        avatarUrl: null,
      });
      cloudinaryService.uploadAvatar.mockResolvedValue({
        secure_url: 'https://cloudinary.com/new-avatar.png',
      });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        avatarUrl: 'https://cloudinary.com/new-avatar.png',
        skills: [],
      });

      const result = await service.uploadAvatar(1, validFile);

      expect(result.avatarUrl).toBe('https://cloudinary.com/new-avatar.png');
      expect(cloudinaryService.deleteFile).not.toHaveBeenCalled();
    });

    it('happy path - upload avatar and delete old avatar', async () => {
      prisma.user.findUnique.mockResolvedValue({
        avatarUrl:
          'https://res.cloudinary.com/demo/image/upload/v123/users/old-avatar.jpg',
      });
      cloudinaryService.uploadAvatar.mockResolvedValue({
        secure_url: 'https://cloudinary.com/new-avatar.png',
      });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        avatarUrl: 'https://cloudinary.com/new-avatar.png',
        skills: [],
      });
      cloudinaryService.deleteFile.mockResolvedValue({ result: 'ok' });

      const result = await service.uploadAvatar(1, validFile);

      expect(result.avatarUrl).toBe('https://cloudinary.com/new-avatar.png');
      expect(cloudinaryService.deleteFile).toHaveBeenCalledWith(
        'users/old-avatar',
        'image',
      );
    });

    it('happy path - old avatar delete fails but upload still succeeds', async () => {
      prisma.user.findUnique.mockResolvedValue({
        avatarUrl:
          'https://res.cloudinary.com/demo/image/upload/v123/users/old-avatar.jpg',
      });
      cloudinaryService.uploadAvatar.mockResolvedValue({
        secure_url: 'https://cloudinary.com/new-avatar.png',
      });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        avatarUrl: 'https://cloudinary.com/new-avatar.png',
        skills: [],
      });
      cloudinaryService.deleteFile.mockRejectedValue(
        new Error('delete failed'),
      );

      const result = await service.uploadAvatar(1, validFile);

      expect(result.avatarUrl).toBe('https://cloudinary.com/new-avatar.png');
    });

    it('happy path - old avatar url cannot extract public id', async () => {
      prisma.user.findUnique.mockResolvedValue({
        avatarUrl: 'invalid-url',
      });
      cloudinaryService.uploadAvatar.mockResolvedValue({
        secure_url: 'https://cloudinary.com/new-avatar.png',
      });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        avatarUrl: 'https://cloudinary.com/new-avatar.png',
        skills: [],
      });

      const result = await service.uploadAvatar(1, validFile);

      expect(result.avatarUrl).toBe('https://cloudinary.com/new-avatar.png');
      expect(cloudinaryService.deleteFile).not.toHaveBeenCalled();
    });

    it('continues when parsing an existing avatar URL throws unexpectedly', async () => {
      prisma.user.findUnique.mockResolvedValue({
        avatarUrl: 'https://res.cloudinary.com/demo/image/upload/avatar.png',
      });
      cloudinaryService.uploadAvatar.mockResolvedValue({
        secure_url: 'https://cloudinary.com/new-avatar.png',
      });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        avatarUrl: 'https://cloudinary.com/new-avatar.png',
        skills: [],
      });
      const matchSpy = jest
        .spyOn(String.prototype, 'match')
        .mockImplementationOnce(() => {
          throw new Error('parse failed');
        });

      const result = await service.uploadAvatar(1, validFile);

      expect(result.avatarUrl).toBe('https://cloudinary.com/new-avatar.png');
      expect(cloudinaryService.deleteFile).not.toHaveBeenCalled();
      matchSpy.mockRestore();
    });
  });
});
