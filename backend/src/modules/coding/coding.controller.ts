import { Controller, Post, Body, Req, Get, Param, UseGuards } from '@nestjs/common';
import { CodingService } from './coding.service';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('coding')
@UseGuards(JwtAuthGuard)
export class CodingController {
  constructor(private readonly codingService: CodingService) { }

  @Post('submit')
  async submitCode(@CurrentUser() user: any, @Body() dto: SubmitCodeDto) {
    const result = await this.codingService.submitCode(
      user.sub ,
      dto.codingQuestionId,
      dto.languageId,
      dto.sourceCode,
    );
    return {
      success: true,
      message: 'Submission đã được nhận và đang xử lý',
      submissionId: result.id,
    };
  }

  @Get('submission/:id')
  async getSubmission(@Param('id') id: string) {
    return this.codingService.getSubmissionById(+id);
  }

  @Get('question/:slug')
  async getCodingQuestion(@Param('slug') slug: string) {
    return this.codingService.getCodingQuestionBySlug(slug);
  }
}