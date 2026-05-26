import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SlotService } from './slot.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

describe('SlotService', () => {
  let service: SlotService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    slot: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    coachingPlan: {
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
    blockedEvent: {
      findMany: jest.fn(),
    },
  };

  const activeMentor = { status: 'ACTIVE' };

  const baseSlot = {
    id: 1,
    mentorId: 10,
    startTime: new Date(Date.now() + 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    isActive: true,
    recurrentType: 'NONE',
    recurrentUntil: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [SlotService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(SlotService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('happy path - mentor gets own slots', async () => {
      prisma.slot.findMany.mockResolvedValue([baseSlot]);

      const result = await service.findAll({}, {
        sub: 10,
        role: 'MENTOR',
      } as any);

      expect(result).toHaveLength(1);
      expect(prisma.slot.findMany).toHaveBeenCalledWith({
        where: {
          mentorId: 10,
        },
        orderBy: {
          startTime: 'asc',
        },
      });
    });

    it('happy path - admin queries by mentorId with dates', async () => {
      prisma.slot.findMany.mockResolvedValue([baseSlot]);

      const result = await service.findAll(
        {
          mentorId: 10,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        } as any,
        { sub: 99, role: 'ADMIN' } as any,
      );

      expect(result[0].id).toBe(1);
      expect(prisma.slot.findMany).toHaveBeenCalledWith({
        where: {
          mentorId: 10,
          startTime: { gte: new Date('2026-01-01') },
          endTime: { lte: new Date('2026-01-31') },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
    });

    it('unhappy path - missing mentorId', async () => {
      await expect(
        service.findAll({}, { sub: 99, role: 'ADMIN' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('create', () => {
    it('happy path', async () => {
      const start = new Date(Date.now() + 60 * 60 * 1000);
      const end = new Date(Date.now() + 2 * 60 * 60 * 1000);

      prisma.user.findUnique.mockResolvedValue(activeMentor);
      prisma.slot.findFirst.mockResolvedValue(null);
      prisma.slot.create.mockResolvedValue({
        ...baseSlot,
        startTime: start,
        endTime: end,
      });

      const result = await service.create(10, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      } as any);

      expect(result.mentorId).toBe(10);
      expect(prisma.slot.create).toHaveBeenCalled();
    });

    it('unhappy path - mentor inactive or not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create(10, {
          startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('unhappy path - start >= end', async () => {
      prisma.user.findUnique.mockResolvedValue(activeMentor);

      const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const end = new Date(Date.now() + 60 * 60 * 1000);

      await expect(
        service.create(10, {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('unhappy path - start in past', async () => {
      prisma.user.findUnique.mockResolvedValue(activeMentor);

      const start = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const end = new Date(Date.now() + 60 * 60 * 1000);

      await expect(
        service.create(10, {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('unhappy path - overlapping slot', async () => {
      prisma.user.findUnique.mockResolvedValue(activeMentor);
      prisma.slot.findFirst.mockResolvedValue(baseSlot);

      const start = new Date(Date.now() + 60 * 60 * 1000);
      const end = new Date(Date.now() + 2 * 60 * 60 * 1000);

      await expect(
        service.create(10, {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('happy path - recurrentUntil has value', async () => {
      const start = new Date(Date.now() + 60 * 60 * 1000);
      const end = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const recurrentUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      prisma.user.findUnique.mockResolvedValue(activeMentor);
      prisma.slot.findFirst.mockResolvedValue(null);
      prisma.slot.create.mockResolvedValue({
        ...baseSlot,
        startTime: start,
        endTime: end,
        recurrentType: 'WEEKLY',
        recurrentUntil,
      });

      const result = await service.create(10, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        isActive: false,
        recurrentType: 'WEEKLY',
        recurrentUntil: recurrentUntil.toISOString(),
      } as any);

      expect(result.recurrentType).toBe('WEEKLY');
      expect(result.isActive).toBe(true);
    });
  });

  describe('update', () => {
    it('happy path', async () => {
      const newStart = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const newEnd = new Date(Date.now() + 4 * 60 * 60 * 1000);

      prisma.user.findUnique.mockResolvedValue(activeMentor);
      prisma.slot.findUnique.mockResolvedValue(baseSlot);
      prisma.slot.findFirst.mockResolvedValue(null);
      prisma.slot.update.mockResolvedValue({
        ...baseSlot,
        startTime: newStart,
        endTime: newEnd,
        isActive: false,
      });

      const result = await service.update(1, 10, {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        isActive: false,
      } as any);

      expect(result.id).toBe(1);
      expect(result.isActive).toBe(false);
    });

    it('unhappy path - slot not found', async () => {
      prisma.user.findUnique.mockResolvedValue(activeMentor);
      prisma.slot.findUnique.mockResolvedValue(null);

      await expect(service.update(1, 10, {} as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('unhappy path - slot belongs to another mentor', async () => {
      prisma.user.findUnique.mockResolvedValue(activeMentor);
      prisma.slot.findUnique.mockResolvedValue({
        ...baseSlot,
        mentorId: 999,
      });

      await expect(service.update(1, 10, {} as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('unhappy path - new start >= new end', async () => {
      prisma.user.findUnique.mockResolvedValue(activeMentor);
      prisma.slot.findUnique.mockResolvedValue(baseSlot);

      const start = new Date(Date.now() + 5 * 60 * 60 * 1000);
      const end = new Date(Date.now() + 4 * 60 * 60 * 1000);

      await expect(
        service.update(1, 10, {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('unhappy path - overlapping when update', async () => {
      prisma.user.findUnique.mockResolvedValue(activeMentor);
      prisma.slot.findUnique.mockResolvedValue(baseSlot);
      prisma.slot.findFirst.mockResolvedValue({
        ...baseSlot,
        id: 2,
      });

      await expect(service.update(1, 10, {} as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('happy path - update recurrentUntil to null', async () => {
      prisma.user.findUnique.mockResolvedValue(activeMentor);
      prisma.slot.findUnique.mockResolvedValue(baseSlot);
      prisma.slot.findFirst.mockResolvedValue(null);
      prisma.slot.update.mockResolvedValue({
        ...baseSlot,
        recurrentUntil: null,
      });

      const result = await service.update(1, 10, {
        recurrentUntil: null,
      } as any);

      expect(result.recurrentUntil).toBeNull();
    });

    it('happy path - updates recurrent type and a future recurrent end date', async () => {
      const recurrentUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      prisma.user.findUnique.mockResolvedValue(activeMentor);
      prisma.slot.findUnique.mockResolvedValue(baseSlot);
      prisma.slot.findFirst.mockResolvedValue(null);
      prisma.slot.update.mockResolvedValue({
        ...baseSlot,
        recurrentType: 'WEEKLY',
        recurrentUntil,
      });

      await service.update(1, 10, {
        recurrentType: 'WEEKLY',
        recurrentUntil: recurrentUntil.toISOString(),
      } as any);

      expect(prisma.slot.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recurrentType: 'WEEKLY',
            recurrentUntil,
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('happy path', async () => {
      prisma.slot.findUnique.mockResolvedValue(baseSlot);
      prisma.slot.delete.mockResolvedValue(baseSlot);

      const result = await service.remove(1, 10);

      expect(result.id).toBe(1);
      expect(prisma.slot.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('unhappy path - slot not found', async () => {
      prisma.slot.findUnique.mockResolvedValue(null);

      await expect(service.remove(1, 10)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('unhappy path - slot belongs to another mentor', async () => {
      prisma.slot.findUnique.mockResolvedValue({
        ...baseSlot,
        mentorId: 999,
      });

      await expect(service.remove(1, 10)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getAvailableDays', () => {
    it('unhappy path - invalid plan', async () => {
      prisma.coachingPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.getAvailableDays(10, 1, '2026-01'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('happy path - has available day', async () => {
      prisma.coachingPlan.findUnique.mockResolvedValue({
        id: 1,
        isActive: true,
        duration: 60,
      });

      prisma.slot.findMany.mockResolvedValue([
        {
          ...baseSlot,
          startTime: new Date('2026-01-10T01:00:00.000Z'),
          endTime: new Date('2026-01-10T04:00:00.000Z'),
        },
      ]);

      prisma.booking.findMany.mockResolvedValue([]);
      prisma.blockedEvent.findMany.mockResolvedValue([]);

      const result = await service.getAvailableDays(10, 1, '2026-01');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('happy path - occupied sessions still calculated', async () => {
      prisma.coachingPlan.findUnique.mockResolvedValue({
        id: 1,
        isActive: true,
        duration: 60,
      });

      prisma.slot.findMany.mockResolvedValue([
        {
          ...baseSlot,
          startTime: new Date('2026-01-10T01:00:00.000Z'),
          endTime: new Date('2026-01-10T03:00:00.000Z'),
        },
      ]);

      prisma.booking.findMany.mockResolvedValue([
        {
          startTime: new Date('2026-01-10T01:00:00.000Z'),
          endTime: new Date('2026-01-10T02:00:00.000Z'),
          status: BookingStatus.ACCEPTED,
        },
      ]);

      prisma.blockedEvent.findMany.mockResolvedValue([]);

      const result = await service.getAvailableDays(10, 1, '2026-01');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getAvailableSessions', () => {
    it('unhappy path - invalid plan', async () => {
      prisma.coachingPlan.findUnique.mockResolvedValue({
        id: 1,
        isActive: false,
        duration: 60,
      });

      await expect(
        service.getAvailableSessions(10, 1, '2026-01-10'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('happy path - returns sessions', async () => {
      prisma.coachingPlan.findUnique.mockResolvedValue({
        id: 1,
        isActive: true,
        duration: 60,
      });

      prisma.slot.findMany.mockResolvedValue([
        {
          ...baseSlot,
          startTime: new Date('2026-01-10T01:00:00.000Z'),
          endTime: new Date('2026-01-10T03:00:00.000Z'),
        },
      ]);

      prisma.booking.findMany.mockResolvedValue([]);
      prisma.blockedEvent.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSessions(10, 1, '2026-01-10');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('startTime');
      expect(result[0]).toHaveProperty('endTime');
    });

    it('happy path - skips overlapped sessions', async () => {
      prisma.coachingPlan.findUnique.mockResolvedValue({
        id: 1,
        isActive: true,
        duration: 60,
      });

      prisma.slot.findMany.mockResolvedValue([
        {
          ...baseSlot,
          startTime: new Date('2026-01-10T01:00:00.000Z'),
          endTime: new Date('2026-01-10T03:00:00.000Z'),
        },
      ]);

      prisma.booking.findMany.mockResolvedValue([
        {
          startTime: new Date('2026-01-10T01:00:00.000Z'),
          endTime: new Date('2026-01-10T02:00:00.000Z'),
          status: BookingStatus.ACCEPTED,
        },
      ]);

      prisma.blockedEvent.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSessions(10, 1, '2026-01-10');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
