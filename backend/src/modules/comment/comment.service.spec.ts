import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentService } from './comment.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Role } from '@prisma/client';
import { Messages } from '@/common/constants/messages.constant';

describe('CommentService', () => {
  let service: CommentService;
  let prisma: PrismaService;

  const mockUser = {
    id: 1,
    name: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  };
  const mockComment = {
    id: 1,
    content: 'Great question!',
    isEdited: false,
    isDeleted: false,
    createdAt: new Date('2026-05-01'),
    userId: 1,
    questionId: 1,
    parentId: null,
    user: mockUser,
  };

  const mockPrismaService = {
    comment: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllByQuestionId', () => {
    it('should return paginated comments with replies', async () => {
      const mockReply = {
        ...mockComment,
        id: 2,
        parentId: 1,
        content: 'I agree!',
      };
      const comments = [
        { ...mockComment, replies: [mockReply] },
        { ...mockComment, id: 3, replies: [] },
      ];

      mockPrismaService.comment.findMany.mockResolvedValue(comments);
      mockPrismaService.comment.count.mockResolvedValue(2);

      const result = await service.findAllByQuestionId(1, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(2);
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { questionId: 1, parentId: null },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      });
    });

    it('should hide content of deleted comments', async () => {
      const deletedComment = { ...mockComment, isDeleted: true, replies: [] };
      mockPrismaService.comment.findMany.mockResolvedValue([deletedComment]);
      mockPrismaService.comment.count.mockResolvedValue(1);

      const result = await service.findAllByQuestionId(1, {
        page: 1,
        limit: 10,
      });

      expect(result.items[0].content).toBe('Bình luận này đã bị xóa.');
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(25);

      const result = await service.findAllByQuestionId(1, {
        page: 3,
        limit: 10,
      });

      expect(result.meta.totalPages).toBe(3);
      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a new comment', async () => {
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const result = await service.create(1, 1, { content: 'Great question!' });

      expect(result).toEqual({
        id: mockComment.id,
        content: mockComment.content,
        isEdited: mockComment.isEdited,
        isDeleted: mockComment.isDeleted,
        createdAt: mockComment.createdAt,
        user: mockUser,
      });
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Great question!',
          userId: 1,
          questionId: 1,
          parentId: null,
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });
    });

    it('should create a reply to a comment', async () => {
      const reply = { ...mockComment, id: 2, parentId: 1 };
      mockPrismaService.comment.create.mockResolvedValue(reply);

      const result = await service.create(1, 1, {
        content: 'I agree!',
        parentId: 1,
      });

      expect(result.id).toBe(2);
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'I agree!',
          userId: 1,
          questionId: 1,
          parentId: 1,
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });
    });
  });

  describe('update', () => {
    it('should update a comment by owner', async () => {
      const updatedComment = {
        ...mockComment,
        content: 'Updated content',
        isEdited: true,
      };
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.update.mockResolvedValue(updatedComment);

      const result = await service.update(1, 1, { content: 'Updated content' });

      expect(result.content).toBe('Updated content');
      expect(result.isEdited).toBe(true);
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          content: 'Updated content',
          isEdited: true,
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.update(1, 999, { content: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(1, 999, { content: 'Test' })).rejects.toThrow(
        Messages.COMMENT.NOT_FOUND,
      );
    });

    it('should throw ForbiddenException if comment is deleted', async () => {
      const deletedComment = { ...mockComment, isDeleted: true };
      mockPrismaService.comment.findUnique.mockResolvedValue(deletedComment);

      await expect(service.update(1, 1, { content: 'Test' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      await expect(service.update(2, 1, { content: 'Test' })).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update(2, 1, { content: 'Test' })).rejects.toThrow(
        Messages.COMMENT.FORBIDDEN,
      );
    });
  });

  describe('softDelete', () => {
    it('should delete comment by owner', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.update.mockResolvedValue({
        ...mockComment,
        isDeleted: true,
      });

      await service.softDelete(1, Role.CANDIDATE, 1);

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isDeleted: true },
      });
    });

    it('should delete comment by admin regardless of ownership', async () => {
      const anotherUserComment = { ...mockComment, userId: 2 };
      mockPrismaService.comment.findUnique.mockResolvedValue(
        anotherUserComment,
      );
      mockPrismaService.comment.update.mockResolvedValue({
        ...anotherUserComment,
        isDeleted: true,
      });

      await service.softDelete(1, Role.ADMIN, 1);

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isDeleted: true },
      });
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.softDelete(1, Role.CANDIDATE, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if non-owner non-admin tries to delete', async () => {
      const anotherUserComment = { ...mockComment, userId: 2 };
      mockPrismaService.comment.findUnique.mockResolvedValue(
        anotherUserComment,
      );

      await expect(service.softDelete(1, Role.CANDIDATE, 1)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.softDelete(1, Role.CANDIDATE, 1)).rejects.toThrow(
        Messages.COMMENT.FORBIDDEN,
      );
    });
  });
});
