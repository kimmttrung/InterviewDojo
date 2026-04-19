import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SubmissionStatus } from '@prisma/client';
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
      where: { id: codingQuestionId },
      include: { testCases: true },
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
      testCases: question.testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      })),
    });

    return submission;
  }

  async getSubmissionById(id: number) {
    return this.prisma.codeSubmission.findUnique({
      where: { id },
      include: { codingQuestion: { select: { title: true, slug: true } } },
    });
  }

  async getCodingQuestionBySlug(slug: string, userId?: number) {
    return this.prisma.codingQuestion.findUnique({
      where: { slug },
      include: {
        testCases: {
          orderBy: { order: 'asc' },
        },
        submissions: userId
          ? {
              where: { userId },
              orderBy: { submittedAt: 'desc' },
              take: 5,
            }
          : false, // không lấy submissions nếu không có userId
      },
    });
  }

  private getLanguageName(id: string): string {
    const map: Record<string, string> = {
      '71': 'python',
      '54': 'cpp',
      '63': 'javascript',
    };
    return map[id] || 'unknown';
  }

  async createCodingQuestion(dto: CreateCodingQuestionDto) {
    return this.prisma.codingQuestion.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        difficulty: dto.difficulty,
        tags: dto.tags || [],
        constraints: dto.constraints,
        hints: dto.hints || [],
        timeLimit: dto.timeLimit || 2000,
        memoryLimit: dto.memoryLimit || 256000,
        isPublished: true,
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
    return this.prisma.codingQuestion.findMany({
      where: { isPublished: true }, // Chỉ lấy các câu hỏi đã public
      include: {
        testCases: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' }, // Sắp xếp mới nhất lên đầu
    });
  }
}
