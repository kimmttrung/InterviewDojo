import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const prisma = {
    company: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $executeRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(CompaniesService);
    jest.clearAllMocks();
  });

  it('create - happy path', async () => {
    prisma.company.create.mockResolvedValue({ id: 1, name: 'Google' });

    const result = await service.create({ name: 'Google' } as any);

    expect(result.name).toBe('Google');
    expect(prisma.company.create).toHaveBeenCalledWith({
      data: { name: 'Google' },
    });
  });

  it('findAll - happy path', async () => {
    prisma.company.findMany.mockResolvedValue([
      { id: 1, name: 'Google', _count: { questions: 2 } },
    ]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(prisma.company.findMany).toHaveBeenCalledWith({
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  });

  it('findOne - happy path', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 1, name: 'Google' });

    const result = await service.findOne(1);

    expect(result.id).toBe(1);
  });

  it('findOne - not found', async () => {
    prisma.company.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update - happy path', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 1, name: 'Old' });
    prisma.company.update.mockResolvedValue({ id: 1, name: 'New' });

    const result = await service.update(1, { name: 'New' } as any);

    expect(result.name).toBe('New');
  });

  it('update - not found', async () => {
    prisma.company.findUnique.mockResolvedValue(null);

    await expect(
      service.update(999, { name: 'New' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove - happy path', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 1, name: 'Google' });
    prisma.company.delete.mockResolvedValue({ id: 1, name: 'Google' });

    const result = await service.remove(1);

    expect(result.id).toBe(1);
    expect(prisma.company.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('remove - not found', async () => {
    prisma.company.findUnique.mockResolvedValue(null);

    await expect(service.remove(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('fixSequence - happy path', async () => {
    prisma.$executeRawUnsafe.mockResolvedValue(1);

    const result = await service.fixSequence();

    expect(result).toBe(1);
  });

  it('findAllIndustries - happy path', async () => {
    prisma.company.findMany.mockResolvedValue([
      { industry: 'AI' },
      { industry: 'Fintech' },
    ]);

    const result = await service.findAllIndustries();

    expect(result).toEqual(['AI', 'Fintech']);
    expect(prisma.company.findMany).toHaveBeenCalledWith({
      select: { industry: true },
      distinct: ['industry'],
      where: { industry: { not: null } },
      orderBy: { industry: 'asc' },
    });
  });
});
