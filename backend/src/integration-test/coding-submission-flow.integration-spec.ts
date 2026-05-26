import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionStatus } from '@prisma/client';
import { CodeEngineService } from '../modules/code-engine/code-engine.service';
import { CodeExecutionProcessor } from '../modules/coding/processors/code-execution.processor';
import { CodingService } from '../modules/coding/coding.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Coding submission flow integration', () => {
  let codingService: CodingService;
  let processor: CodeExecutionProcessor;
  let codeEngine: { executeWithInput: jest.Mock };
  let queuedData: any;
  let submission: any;

  beforeEach(async () => {
    queuedData = undefined;
    submission = undefined;
    codeEngine = { executeWithInput: jest.fn() };

    const question = {
      questionId: 1,
      testCases: [
        {
          id: 1,
          input: '1',
          expectedOutput: 'one',
          isHidden: false,
          points: 1,
        },
        {
          id: 2,
          input: '2',
          expectedOutput: 'two',
          isHidden: true,
          points: 1,
        },
      ],
    };

    const prisma = {
      codingQuestion: {
        findUnique: jest.fn(async () => question),
      },
      codeSubmission: {
        create: jest.fn(async ({ data }) => {
          submission = { id: 50, ...data };
          return submission;
        }),
        update: jest.fn(async ({ data }) => {
          Object.assign(submission, data);
          return submission;
        }),
        findUnique: jest.fn(async () => submission),
      },
    };

    const queue = {
      add: jest.fn(async (_jobName, data) => {
        queuedData = data;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodingService,
        CodeExecutionProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken('code-execution'), useValue: queue },
        { provide: CodeEngineService, useValue: codeEngine },
      ],
    }).compile();

    codingService = module.get(CodingService);
    processor = module.get(CodeExecutionProcessor);
  });

  it('queues submitted code and exposes an accepted judged result', async () => {
    const pending = await codingService.submitCode(
      7,
      1,
      '71',
      'print(input())',
    );

    expect(pending.status).toBe(SubmissionStatus.PENDING);
    expect(queuedData).toMatchObject({
      submissionId: pending.id,
      languageId: 71,
      testCases: expect.any(Array),
    });

    codeEngine.executeWithInput
      .mockResolvedValueOnce({ stdout: 'one\n', time: '0.01', memory: 1024 })
      .mockResolvedValueOnce({ stdout: 'two', time: '0.02', memory: 2048 });

    const job = { data: queuedData, updateProgress: jest.fn() } as any;
    await processor.process(job);

    await expect(codingService.getSubmissionById(pending.id)).resolves.toEqual(
      expect.objectContaining({
        status: SubmissionStatus.ACCEPTED,
        verdict: 'ACCEPTED',
        passedTestCases: 2,
        totalTestCases: 2,
        score: 100,
        executionTime: 30,
        memoryUsed: 2048,
      }),
    );
    expect(job.updateProgress).toHaveBeenLastCalledWith(90);
  });

  it('stores a wrong-answer result when execution fails a test case', async () => {
    const pending = await codingService.submitCode(
      7,
      1,
      '63',
      'console.log(0)',
    );

    codeEngine.executeWithInput.mockResolvedValueOnce({
      stdout: 'zero',
      time: '0.01',
      memory: 512,
    });

    await processor.process({
      data: queuedData,
      updateProgress: jest.fn(),
    } as any);

    await expect(codingService.getSubmissionById(pending.id)).resolves.toEqual(
      expect.objectContaining({
        status: SubmissionStatus.WRONG_ANSWER,
        passedTestCases: 0,
        totalTestCases: 2,
        score: 0,
      }),
    );
  });
});
