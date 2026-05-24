import { Test } from '@nestjs/testing';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CodeEngineService } from '../../code-engine/code-engine.service';
import { CodeExecutionProcessor } from './code-execution.processor';

describe('CodeExecutionProcessor', () => {
  let processor: CodeExecutionProcessor;
  const prisma = { codeSubmission: { update: jest.fn() } };
  const codeEngine = { executeWithInput: jest.fn() };
  const baseJob = {
    data: {
      submissionId: 5,
      languageId: 71,
      sourceCode: 'code',
      testCases: [
        { input: '1', expectedOutput: 'one' },
        { input: '2', expectedOutput: 'two' },
      ],
    },
    updateProgress: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CodeExecutionProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: CodeEngineService, useValue: codeEngine },
      ],
    }).compile();
    processor = moduleRef.get(CodeExecutionProcessor);
    jest.clearAllMocks();
  });

  it('marks a submission accepted after all normalized outputs match', async () => {
    codeEngine.executeWithInput
      .mockResolvedValueOnce({ stdout: ' one \n', time: '0.1', memory: 10 })
      .mockResolvedValueOnce({ stdout: 'two', time: '0.2', memory: 20 });

    await processor.process(baseJob as any);

    expect(prisma.codeSubmission.update).toHaveBeenLastCalledWith({
      where: { id: 5 },
      data: {
        status: SubmissionStatus.ACCEPTED,
        verdict: 'ACCEPTED',
        score: 100,
        passedTestCases: 2,
        totalTestCases: 2,
        executionTime: 300,
        memoryUsed: 20,
      },
    });
    expect(baseJob.updateProgress).toHaveBeenLastCalledWith(90);
  });

  it('stops on compile errors', async () => {
    codeEngine.executeWithInput.mockResolvedValue({
      compile_output: 'syntax error',
    });

    await processor.process(baseJob as any);

    expect(prisma.codeSubmission.update).toHaveBeenLastCalledWith({
      where: { id: 5 },
      data: {
        status: SubmissionStatus.COMPILE_ERROR,
        errorMessage: 'syntax error',
        passedTestCases: 0,
      },
    });
  });

  it('stops on runtime errors and wrong answers', async () => {
    codeEngine.executeWithInput.mockResolvedValueOnce({ stderr: 'boom' });
    await processor.process(baseJob as any);
    expect(prisma.codeSubmission.update).toHaveBeenLastCalledWith({
      where: { id: 5 },
      data: {
        status: SubmissionStatus.RUNTIME_ERROR,
        errorMessage: 'boom',
        passedTestCases: 0,
      },
    });

    jest.clearAllMocks();
    codeEngine.executeWithInput.mockResolvedValueOnce({
      stdout: 'wrong',
      time: '0',
      memory: 0,
    });
    await processor.process(baseJob as any);
    expect(prisma.codeSubmission.update).toHaveBeenLastCalledWith({
      where: { id: 5 },
      data: {
        status: SubmissionStatus.WRONG_ANSWER,
        passedTestCases: 0,
        totalTestCases: 2,
        executionTime: 0,
        memoryUsed: 0,
        score: 0,
      },
    });
  });
});
