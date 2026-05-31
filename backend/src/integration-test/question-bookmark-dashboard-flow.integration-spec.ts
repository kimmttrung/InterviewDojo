import { Test, TestingModule } from '@nestjs/testing';
import { Difficulty, QuestionType } from '@prisma/client';
import { AiService } from '../modules/ai-summary/ai-summary.service';
import { BookmarkService } from '../modules/bookmark/bookmark.service';
import { DashboardService } from '../modules/candidate-dashboard/candidate-dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

describe('Question bookmark dashboard flow integration', () => {
  let bookmarkService: BookmarkService;
  let dashboardService: DashboardService;

  const question = {
    id: 11,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: Difficulty.EASY,
    type: QuestionType.CODING,
    categories: [
      { category: { id: 2, name: 'Array' } },
      { category: { id: 3, name: 'Algorithm' } },
    ],
  };

  let bookmarks: any[];

  beforeEach(async () => {
    bookmarks = [];

    const prisma = {
      question: {
        findUnique: jest.fn(async ({ where }) =>
          where.id === question.id ? question : null,
        ),
      },
      userBookmark: {
        findUnique: jest.fn(async ({ where }) =>
          bookmarks.find(
            (bookmark) =>
              bookmark.userId === where.userId_questionId.userId &&
              bookmark.questionId === where.userId_questionId.questionId,
          ),
        ),
        create: jest.fn(async ({ data }) => {
          const bookmark = {
            ...data,
            createdAt: new Date('2026-05-24T08:00:00.000Z'),
            question,
          };
          bookmarks.push(bookmark);
          return bookmark;
        }),
        delete: jest.fn(async ({ where }) => {
          const index = bookmarks.findIndex(
            (bookmark) =>
              bookmark.userId === where.userId_questionId.userId &&
              bookmark.questionId === where.userId_questionId.questionId,
          );
          return bookmarks.splice(index, 1)[0];
        }),
        count: jest.fn(async ({ where }) => {
          return bookmarks.filter(
            (bookmark) => bookmark.userId === where.userId,
          ).length;
        }),
        findMany: jest.fn(async ({ where }) =>
          bookmarks.filter((bookmark) => bookmark.userId === where.userId),
        ),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        BookmarkService,
        DashboardService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiService, useValue: {} },
      ],
    }).compile();

    bookmarkService = module.get(BookmarkService);
    dashboardService = module.get(DashboardService);
  });

  it('updates bookmarked questions and interested categories together', async () => {
    await expect(bookmarkService.bookmark(7, question.id)).resolves.toEqual({
      success: true,
      message: expect.any(String),
    });

    const savedQuestions = await bookmarkService.getBookmarkedQuestions(7, {});
    expect(savedQuestions.items).toEqual([
      expect.objectContaining({
        id: question.id,
        title: question.title,
        categories: [
          { id: 2, name: 'Array' },
          { id: 3, name: 'Algorithm' },
        ],
      }),
    ]);

    await expect(dashboardService.getInterestedCategories(7)).resolves.toEqual([
      { id: 2, name: 'Array', count: 1 },
      { id: 3, name: 'Algorithm', count: 1 },
    ]);

    await bookmarkService.unbookmark(7, question.id);

    await expect(
      bookmarkService.getBookmarkedQuestions(7, {}),
    ).resolves.toMatchObject({ items: [], meta: { total: 0 } });
    await expect(dashboardService.getInterestedCategories(7)).resolves.toEqual(
      [],
    );
  });
});
