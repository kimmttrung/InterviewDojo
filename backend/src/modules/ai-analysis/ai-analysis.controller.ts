import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiAnalysisService } from './ai-analysis.service';
import { AiAgentService } from './ai-agent.service';

export class AnalyzeSoloSessionDto {
  transcript: string;
  question?: string;
  revieweeId: number;
}

@ApiTags('AI Analysis')
@Controller('ai-analysis')
export class AiAnalysisController {
  constructor(
    private readonly aiAnalysisService: AiAnalysisService,
    private readonly aiAgentService: AiAgentService,
  ) {}

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Lấy thông tin Solo Session và Feedback' })
  async getBySessionId(@Param('sessionId', ParseIntPipe) sessionId: number) {
    const result = await this.aiAnalysisService.getSessionFeedback(sessionId);

    if (!result) {
      throw new NotFoundException('Không tìm thấy Mock Session này');
    }

    return result;
  }

  @Post('session/:sessionId/analyze')
  @ApiOperation({ summary: 'AI phân tích câu trả lời và lưu Feedback' })
  async analyzeSoloSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: AnalyzeSoloSessionDto,
  ) {
    const feedbackResult = await this.aiAgentService.generateFeedback({
      transcript: body.transcript,
      question: body.question,
    });

    const savedFeedback = await this.aiAnalysisService.saveSoloSessionFeedback({
      sessionId: sessionId,
      revieweeId: body.revieweeId,
      question: body.question,
      transcript: body.transcript,
      overallScore: feedbackResult.overallScore,
      strengths: feedbackResult.strengths,
      weaknesses: feedbackResult.weaknesses,
      suggestions: feedbackResult.suggestions,
    });

    return {
      message: 'Đã phân tích và lưu feedback AI thành công',
      feedback: savedFeedback,
    };
  }
}
