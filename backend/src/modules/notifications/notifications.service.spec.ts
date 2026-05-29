import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const prisma = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(NotificationsService);
    jest.clearAllMocks();
  });

  it('findMyNotifications - happy path with default page and limit', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    prisma.notification.findMany.mockResolvedValue([
      {
        id: 1,
        type: 'BOOKING',
        title: 'Booking created',
        message: 'Your booking was created',
        targetUrl: '/bookings/1',
        isRead: false,
        createdAt,
      },
    ]);

    prisma.notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(5);

    const result = await service.findMyNotifications(10, {});

    expect(result.items).toHaveLength(1);
    expect(result.items[0].createdAt).toBe(createdAt.toISOString());
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    expect(result.unreadCount).toBe(5);

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 10 },
      skip: 0,
      take: 10,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('findMyNotifications - filter isRead true', async () => {
    prisma.notification.findMany.mockResolvedValue([]);
    prisma.notification.count.mockResolvedValueOnce(0).mockResolvedValueOnce(2);

    const result = await service.findMyNotifications(10, {
      page: 2,
      limit: 5,
      isRead: 'true',
    } as any);

    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(5);

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 10, isRead: true },
      skip: 5,
      take: 5,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('findMyNotifications - filter isRead false', async () => {
    prisma.notification.findMany.mockResolvedValue([]);
    prisma.notification.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    await service.findMyNotifications(10, {
      isRead: 'false',
    } as any);

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 10, isRead: false },
      skip: 0,
      take: 10,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('markAsRead - happy path', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.markAsRead(10, 1);

    expect(result).toEqual({ count: 1 });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 1, userId: 10 },
      data: { isRead: true },
    });
  });

  it('markAllAsRead - happy path', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 3 });

    const result = await service.markAllAsRead(10);

    expect(result).toEqual({ count: 3 });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 10, isRead: false },
      data: { isRead: true },
    });
  });

  it('createNotification - happy path without targetUrl', async () => {
    prisma.notification.create.mockResolvedValue({
      id: 1,
      userId: 10,
      type: 'SYSTEM',
      title: 'Title',
      message: 'Message',
    });

    const data = {
      userId: 10,
      type: 'SYSTEM',
      title: 'Title',
      message: 'Message',
    };

    const result = await service.createNotification(data);

    expect(result.id).toBe(1);
    expect(prisma.notification.create).toHaveBeenCalledWith({ data });
  });

  it('createNotification - happy path with targetUrl', async () => {
    prisma.notification.create.mockResolvedValue({
      id: 1,
      userId: 10,
      type: 'BOOKING',
      title: 'Title',
      message: 'Message',
      targetUrl: '/bookings/1',
    });

    const data = {
      userId: 10,
      type: 'BOOKING',
      title: 'Title',
      message: 'Message',
      targetUrl: '/bookings/1',
    };

    const result = await service.createNotification(data);

    expect(result.targetUrl).toBe('/bookings/1');
    expect(prisma.notification.create).toHaveBeenCalledWith({ data });
  });
});
