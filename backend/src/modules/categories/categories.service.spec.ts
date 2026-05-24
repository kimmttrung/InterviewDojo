import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  const prisma = {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $executeRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(CategoriesService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('create - happy path', async () => {
    prisma.category.create.mockResolvedValue({ id: 1, name: 'Backend' });

    const result = await service.create({ name: 'Backend' } as any);

    expect(result).toEqual({ id: 1, name: 'Backend' });
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: 'Backend' },
    });
  });

  it('create - throw db error', async () => {
    prisma.category.create.mockRejectedValue(new Error('DB error'));

    await expect(service.create({ name: 'Backend' } as any)).rejects.toThrow(
      'DB error',
    );
  });

  it('findAll - happy path', async () => {
    prisma.category.findMany.mockResolvedValue([{ id: 1, name: 'Backend' }]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(prisma.category.findMany).toHaveBeenCalled();
  });

  it('findAll - throw db error', async () => {
    prisma.category.findMany.mockRejectedValue(new Error('DB error'));

    await expect(service.findAll()).rejects.toThrow('DB error');
  });

  it('findOne - happy path', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 1, name: 'Backend' });

    const result = await service.findOne(1);

    expect(result.id).toBe(1);
    expect(prisma.category.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('findOne - not found', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update - happy path', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 1, name: 'Old' });
    prisma.category.update.mockResolvedValue({ id: 1, name: 'New' });

    const result = await service.update(1, { name: 'New' } as any);

    expect(result.name).toBe('New');
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'New' },
    });
  });

  it('update - not found', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(
      service.update(999, { name: 'New' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove - happy path', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 1, name: 'Backend' });
    prisma.category.delete.mockResolvedValue({ id: 1, name: 'Backend' });

    const result = await service.remove(1);

    expect(result.id).toBe(1);
    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('remove - not found', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(service.remove(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('fixSequence - happy path', async () => {
    prisma.$executeRawUnsafe.mockResolvedValue(1);

    const result = await service.fixSequence();

    expect(result).toEqual({
      message: 'Đã đồng bộ lại ID thành công!',
      result: 1,
    });
  });

  it('fixSequence - throw error', async () => {
    prisma.$executeRawUnsafe.mockRejectedValue(new Error('sequence error'));

    await expect(service.fixSequence()).rejects.toThrow('sequence error');
  });
});
