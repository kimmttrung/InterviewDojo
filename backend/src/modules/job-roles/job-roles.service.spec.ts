import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { JobRolesService } from './job-roles.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateJobRoleDto } from './dto/create-job-role.dto';
import { UpdateJobRoleDto } from './dto/update-job-role.dto';

describe('JobRolesService', () => {
  let service: JobRolesService;
  let prisma: PrismaService;

  const mockJobRole = {
    id: 1,
    name: 'Software Engineer',
    description: 'Backend Developer',
    _count: { questions: 5 },
  };

  const mockPrismaService = {
    jobRole: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobRolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<JobRolesService>(JobRolesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all job roles ordered by name', async () => {
      const mockRoles = [
        { ...mockJobRole, id: 1 },
        { ...mockJobRole, id: 2, name: 'Frontend Engineer' },
      ];
      mockPrismaService.jobRole.findMany.mockResolvedValue(mockRoles);

      const result = await service.findAll();

      expect(result).toEqual(mockRoles);
      expect(prisma.jobRole.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        include: { _count: { select: { questions: true } } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a job role by id', async () => {
      mockPrismaService.jobRole.findUnique.mockResolvedValue(mockJobRole);

      const result = await service.findOne(1);

      expect(result).toEqual(mockJobRole);
      expect(prisma.jobRole.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if job role does not exist', async () => {
      mockPrismaService.jobRole.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Job role not found');
    });
  });

  describe('create', () => {
    it('should create a new job role', async () => {
      const createDto: CreateJobRoleDto = {
        name: 'DevOps Engineer',
        description: 'DevOps',
      };
      mockPrismaService.jobRole.create.mockResolvedValue({
        id: 3,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toEqual({ id: 3, ...createDto });
      expect(prisma.jobRole.create).toHaveBeenCalledWith({ data: createDto });
    });
  });

  describe('update', () => {
    it('should update a job role', async () => {
      const updateDto: UpdateJobRoleDto = { name: 'Senior Software Engineer' };
      const updatedRole = { ...mockJobRole, ...updateDto };

      mockPrismaService.jobRole.findUnique.mockResolvedValue(mockJobRole);
      mockPrismaService.jobRole.update.mockResolvedValue(updatedRole);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedRole);
      expect(prisma.jobRole.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });

    it('should throw NotFoundException when updating non-existent job role', async () => {
      const updateDto: UpdateJobRoleDto = { name: 'Senior Software Engineer' };
      mockPrismaService.jobRole.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a job role with no constraints', async () => {
      const roleWithNoConstraints = {
        ...mockJobRole,
        experiences: [],
        candidates: [],
      };
      mockPrismaService.jobRole.findUnique.mockResolvedValue(
        roleWithNoConstraints,
      );
      mockPrismaService.jobRole.delete.mockResolvedValue(mockJobRole);

      const result = await service.remove(1);

      expect(result).toEqual(mockJobRole);
      expect(prisma.jobRole.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when removing non-existent job role', async () => {
      mockPrismaService.jobRole.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow('Job role not found');
    });

    it('should throw ConflictException if job role has experiences', async () => {
      const roleWithExperiences = {
        ...mockJobRole,
        experiences: [{ id: 1 }],
        candidates: [],
      };
      mockPrismaService.jobRole.findUnique.mockResolvedValue(
        roleWithExperiences,
      );

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      await expect(service.remove(1)).rejects.toThrow(
        'Cannot delete job role because it is used in some mentor experiences. Please remove those experiences first.',
      );
      expect(prisma.jobRole.delete).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if job role has candidates', async () => {
      const roleWithCandidates = {
        ...mockJobRole,
        experiences: [],
        candidates: [{ id: 1, name: 'User' }],
      };
      mockPrismaService.jobRole.findUnique.mockResolvedValue(
        roleWithCandidates,
      );

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      await expect(service.remove(1)).rejects.toThrow(
        'Cannot delete job role because some candidates have it as target role. Please update their target role first.',
      );
      expect(prisma.jobRole.delete).not.toHaveBeenCalled();
    });
  });
});
