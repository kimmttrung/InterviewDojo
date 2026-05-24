import { Test } from '@nestjs/testing';
import { JobRoleService } from './target-role.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('JobRoleService', () => {
  let service: JobRoleService;

  const prisma = {
    jobRole: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [JobRoleService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(JobRoleService);
    jest.clearAllMocks();
  });

  it('create - happy path with description', async () => {
    prisma.jobRole.create.mockResolvedValue({
      id: 1,
      name: 'Backend Developer',
      description: 'Backend role',
    });

    const result = await service.create({
      name: 'Backend Developer',
      description: 'Backend role',
    } as any);

    expect(result.id).toBe(1);
    expect(prisma.jobRole.create).toHaveBeenCalledWith({
      data: {
        name: 'Backend Developer',
        description: 'Backend role',
      },
    });
  });

  it('create - happy path without description', async () => {
    prisma.jobRole.create.mockResolvedValue({
      id: 1,
      name: 'Frontend Developer',
      description: null,
    });

    const result = await service.create({
      name: 'Frontend Developer',
    } as any);

    expect(result.description).toBeNull();
    expect(prisma.jobRole.create).toHaveBeenCalledWith({
      data: {
        name: 'Frontend Developer',
        description: null,
      },
    });
  });

  it('findAll - happy path', async () => {
    prisma.jobRole.findMany.mockResolvedValue([
      { id: 1, name: 'Backend Developer' },
    ]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(prisma.jobRole.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('update - happy path', async () => {
    prisma.jobRole.update.mockResolvedValue({
      id: 1,
      name: 'Senior Backend Developer',
    });

    const result = await service.update(1, {
      name: 'Senior Backend Developer',
    } as any);

    expect(result.name).toBe('Senior Backend Developer');
    expect(prisma.jobRole.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Senior Backend Developer' },
    });
  });

  it('delete - happy path', async () => {
    prisma.jobRole.delete.mockResolvedValue({
      id: 1,
      name: 'Backend Developer',
    });

    const result = await service.delete(1);

    expect(result.id).toBe(1);
    expect(prisma.jobRole.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('createMany - happy path with and without description', async () => {
    prisma.jobRole.createMany.mockResolvedValue({ count: 2 });

    const result = await service.createMany({
      roles: [
        { name: 'Backend Developer', description: 'Backend role' },
        { name: 'Frontend Developer' },
      ],
    });

    expect(result).toEqual({
      message: 'Tạo danh sách vị trí công việc (Job/Target Role) thành công',
    });

    expect(prisma.jobRole.createMany).toHaveBeenCalledWith({
      data: [
        { name: 'Backend Developer', description: 'Backend role' },
        { name: 'Frontend Developer', description: null },
      ],
      skipDuplicates: true,
    });
  });
});
