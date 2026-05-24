import { Test } from '@nestjs/testing';
import { SkillService } from './skill.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SkillService', () => {
  let service: SkillService;

  const prisma = {
    skill: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [SkillService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(SkillService);
    jest.clearAllMocks();
  });

  it('findAll - happy path', async () => {
    prisma.skill.findMany.mockResolvedValue([
      { id: 1, name: 'JavaScript' },
      { id: 2, name: 'NestJS' },
    ]);

    const result = await service.findAll();

    expect(result).toHaveLength(2);
    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('findAll - empty list', async () => {
    prisma.skill.findMany.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });

  it('findAll - throw db error', async () => {
    prisma.skill.findMany.mockRejectedValue(new Error('DB error'));

    await expect(service.findAll()).rejects.toThrow('DB error');
  });
});
