import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CoachingCategoryService } from './coaching-category.service';

describe('CoachingCategoryService', () => {
  let service: CoachingCategoryService;

  const prisma = {
    coachingCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CoachingCategoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(CoachingCategoryService);
    jest.clearAllMocks();
  });

  it('lists categories sorted by name', async () => {
    prisma.coachingCategory.findMany.mockResolvedValue([{ id: 1 }]);

    await expect(service.findAll()).resolves.toEqual([{ id: 1 }]);
    expect(prisma.coachingCategory.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { plans: true },
        },
      },
    });
  });

  it('creates a category when its slug is available', async () => {
    const dto = { name: 'Backend', slug: 'backend' } as any;
    prisma.coachingCategory.findUnique.mockResolvedValue(null);
    prisma.coachingCategory.create.mockResolvedValue({ id: 1, ...dto });

    await expect(service.create(dto)).resolves.toEqual({ id: 1, ...dto });
    expect(prisma.coachingCategory.create).toHaveBeenCalledWith({ data: dto });
  });

  it('rejects duplicate slugs', async () => {
    prisma.coachingCategory.findUnique.mockResolvedValue({ id: 1 });

    await expect(
      service.create({ slug: 'backend' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates and deletes existing categories', async () => {
    prisma.coachingCategory.findUnique.mockResolvedValue({ id: 1 });
    prisma.coachingCategory.update.mockResolvedValue({ id: 1, name: 'API' });
    prisma.coachingCategory.delete.mockResolvedValue({ id: 1 });

    await expect(service.update(1, { name: 'API' } as any)).resolves.toEqual({
      id: 1,
      name: 'API',
    });
    await expect(service.remove(1)).resolves.toEqual({ id: 1 });
  });

  it('rejects updating or deleting a missing category', async () => {
    prisma.coachingCategory.findUnique.mockResolvedValue(null);

    await expect(service.update(99, {} as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
