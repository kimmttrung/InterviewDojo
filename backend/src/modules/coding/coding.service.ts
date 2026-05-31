import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SubmissionStatus, QuestionType, Difficulty } from '@prisma/client';
import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';

@Injectable()
export class CodingService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('code-execution') private executionQueue: Queue,
  ) {}

  async submitCode(
    userId: number,
    codingQuestionId: number,
    languageId: string,
    sourceCode: string,
  ) {
    const question = await this.prisma.codingQuestion.findUnique({
      where: { questionId: codingQuestionId },
      include: {
        testCases: {
          orderBy: { order: 'asc' }, // Sắp xếp testcase theo order để worker chấm điểm chuẩn xác
        },
      },
    });

    if (!question) throw new BadRequestException('Không tìm thấy câu hỏi');
    if (question.testCases.length === 0) {
      throw new BadRequestException('Câu hỏi chưa có test case');
    }

    const submission = await this.prisma.codeSubmission.create({
      data: {
        userId,
        codingQuestionId,
        languageId,
        language: this.getLanguageName(languageId),
        sourceCode,
        status: SubmissionStatus.PENDING,
        totalTestCases: question.testCases.length,
      },
    });

    await this.executionQueue.add('execute-code', {
      submissionId: submission.id,
      languageId: Number(languageId),
      sourceCode,
      // Gửi thêm thông tin testcase cho worker (ví dụ: worker có thể dùng points để tính tổng điểm)
      testCases: question.testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        points: tc.points,
      })),
    });

    return submission;
  }

  async getSubmissionById(id: number) {
    return this.prisma.codeSubmission.findUnique({
      where: { id },
      include: {
        codingQuestion: {
          include: {
            question: {
              select: { title: true, slug: true },
            },
          },
        },
      },
    });
  }

  async getCodingQuestionBySlug(slug: string, userId?: number) {
    const question = await this.prisma.question.findUnique({
      where: { slug, type: QuestionType.CODING },
      include: {
        codingQuestion: {
          include: {
            testCases: {
              orderBy: { order: 'asc' }, // Sắp xếp theo order đã được khôi phục
            },
            submissions: userId
              ? {
                  where: { userId },
                  orderBy: { submittedAt: 'desc' },
                  take: 5,
                }
              : false,
          },
        },
      },
    });

    if (!question || !question.codingQuestion) {
      throw new NotFoundException('Không tìm thấy câu hỏi coding với slug này');
    }

    return question;
  }

  private getLanguageName(id: string): string {
    const map: Record<string, string> = {
      '71': 'python',
      '54': 'cpp',
      '63': 'javascript',
    };
    return map[id] || id;
  }

  async createCodingQuestion(dto: CreateCodingQuestionDto) {
    return this.prisma.question.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        difficulty: dto.difficulty || Difficulty.MEDIUM,
        type: QuestionType.CODING,
        isPublished: true,
        codingQuestion: {
          create: {
            description: dto.description,
            constraints: dto.constraints,
            timeLimit: dto.timeLimit || 2000,
            memoryLimit: dto.memoryLimit || 256000,
          },
        },
      },
      include: {
        codingQuestion: true,
      },
    });
  }

  async addTestCase(codingQuestionId: number, dto: CreateTestCaseDto) {
    return this.prisma.testCase.create({
      data: {
        codingQuestionId,
        input: dto.input,
        expectedOutput: dto.expectedOutput,
        isSample: dto.isSample ?? false,
        isHidden: dto.isHidden ?? false,
        points: dto.points ?? 1,
        order: dto.order ?? 0,
        explanation: dto.explanation,
      },
    });
  }

  async getAllQuestions() {
    return this.prisma.question.findMany({
      where: {
        isPublished: true,
        type: QuestionType.CODING,
      },
      include: {
        codingQuestion: {
          include: {
            testCases: {
              orderBy: { order: 'asc' }, // Sắp xếp theo order đã được khôi phục
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
