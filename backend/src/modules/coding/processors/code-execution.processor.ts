// src/modules/coding/processors/code-execution.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import { CodeEngineService } from '../../code-engine/code-engine.service';
import { SubmissionStatus } from '@prisma/client';

@Processor('code-execution', { concurrency: 2 })
export class CodeExecutionProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private codeEngine: CodeEngineService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    const { submissionId, languageId, sourceCode, testCases } = job.data;

    await this.prisma.codeSubmission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.RUNNING, judgedAt: new Date() },
    });

    let passed = 0;
    let totalExecutionTime = 0;
    let maxMemory = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      const result = await this.codeEngine.executeWithInput(
        sourceCode,
        languageId,
        tc.input,
      );

      // Compile error — dừng ngay
      if (result.compile_output?.trim()) {
        await this.prisma.codeSubmission.update({
          where: { id: submissionId },
          data: {
            status: SubmissionStatus.COMPILE_ERROR,
            errorMessage: result.compile_output,
            passedTestCases: 0,
          },
        });
        return;
      }

      // Runtime error — dừng ngay
      if (result.stderr?.trim()) {
        await this.prisma.codeSubmission.update({
          where: { id: submissionId },
          data: {
            status: SubmissionStatus.RUNTIME_ERROR,
            errorMessage: result.stderr,
            passedTestCases: passed,
          },
        });
        return;
      }

      const isAccepted =
        this.normalizeOutput(result.stdout || '') ===
        this.normalizeOutput(tc.expectedOutput || '');

      if (isAccepted) {
        passed++;
      } else {
        // Fail fast — dừng tại test case đầu sai
        await this.prisma.codeSubmission.update({
          where: { id: submissionId },
          data: {
            status: SubmissionStatus.WRONG_ANSWER,
            passedTestCases: passed,
            totalTestCases: testCases.length,
            executionTime: totalExecutionTime,
            memoryUsed: maxMemory,
            score: Math.round((passed / testCases.length) * 100),
          },
        });
        return;
      }

      totalExecutionTime += Math.round(parseFloat(result.time || '0') * 1000);
      maxMemory = Math.max(maxMemory, result.memory || 0);

      await job.updateProgress(Math.round(((i + 1) / testCases.length) * 90));
    }

    // Tất cả passed
    await this.prisma.codeSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.ACCEPTED,
        verdict: 'ACCEPTED',
        score: 100,
        passedTestCases: passed,
        totalTestCases: testCases.length,
        executionTime: totalExecutionTime,
        memoryUsed: maxMemory,
      },
    });
  }

  private normalizeOutput(output: string): string {
    return output.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  }
}