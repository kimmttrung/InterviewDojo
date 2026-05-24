import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Difficulty } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookmarkService } from './bookmark.service';

describe('BookmarkService', () => {
  let service: BookmarkService;

  const prisma = {
    userBookmark: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    question: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookmarkService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(BookmarkService);
    jest.clearAllMocks();
  });

  it('returns paginated bookmarks with combined question filters', async () => {
    const bookmarkedAt = new Date('2026-01-05T00:00:00.000Z');
    prisma.userBookmark.count.mockResolvedValue(1);
    prisma.userBookmark.findMany.mockResolvedValue([
      {
        createdAt: bookmarkedAt,
        question: {
          id: 11,
          title: 'Two Sum',
          slug: 'two-sum',
          difficulty: Difficulty.EASY,
          type: 'CODING',
          categories: [{ category: { id: 2, name: 'Array' } }],
        },
      },
    ]);

    const result = await service.getBookmarkedQuestions(7, {
      page: 2,
      limit: 5,
      difficulty: Difficulty.EASY,
      categoryIds: [2, 3],
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      search: 'sum',
    });

    const where = {
      userId: 7,
      question: {
        difficulty: Difficulty.EASY,
        title: { contains: 'sum', mode: 'insensitive' },
        categories: { some: { categoryId: { in: [2, 3] } } },
      },
      createdAt: {
        gte: new Date('2026-01-01'),
        lte: new Date('2026-01-31'),
      },
    };
    expect(prisma.userBookmark.count).toHaveBeenCalledWith({ where });
    expect(prisma.userBookmark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where, skip: 5, take: 5 }),
    );
    expect(result.items[0]).toEqual({
      id: 11,
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: Difficulty.EASY,
      type: 'CODING',
      categories: [{ id: 2, name: 'Array' }],
      bookmarkedAt,
    });
    expect(result.meta.totalPages).toBe(1);
  });

  it('creates a bookmark after checking the question and duplicate state', async () => {
    prisma.question.findUnique.mockResolvedValue({ id: 10 });
    prisma.userBookmark.findUnique.mockResolvedValue(null);
    prisma.userBookmark.create.mockResolvedValue({ userId: 7, questionId: 10 });

    await expect(service.bookmark(7, 10)).resolves.toEqual(
      expect.objectContaining({ success: true }),
    );
    expect(prisma.userBookmark.create).toHaveBeenCalledWith({
      data: { userId: 7, questionId: 10 },
    });
  });

  it('rejects bookmarking a missing question or an existing bookmark', async () => {
    prisma.question.findUnique.mockResolvedValueOnce(null);
    await expect(service.bookmark(7, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.question.findUnique.mockResolvedValueOnce({ id: 10 });
    prisma.userBookmark.findUnique.mockResolvedValueOnce({ questionId: 10 });
    await expect(service.bookmark(7, 10)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('removes an existing bookmark and rejects a missing one', async () => {
    prisma.userBookmark.findUnique.mockResolvedValueOnce({ questionId: 10 });
    await expect(service.unbookmark(7, 10)).resolves.toEqual(
      expect.objectContaining({ success: true }),
    );
    expect(prisma.userBookmark.delete).toHaveBeenCalledWith({
      where: { userId_questionId: { userId: 7, questionId: 10 } },
    });

    prisma.userBookmark.findUnique.mockResolvedValueOnce(null);
    await expect(service.unbookmark(7, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
