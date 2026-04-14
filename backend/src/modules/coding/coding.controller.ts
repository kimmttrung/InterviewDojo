import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { CodingService } from './coding.service';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';

@ApiTags('Coding')
@ApiBearerAuth()
@Controller('coding')
@UseGuards(JwtAuthGuard)
export class CodingController {
  constructor(private readonly codingService: CodingService) {}

  @Post('submit')
  @ResponseMessage(Messages.CODING.SUBMIT_SUCCESS)
  async submitCode(@CurrentUser() user: any, @Body() dto: SubmitCodeDto) {
    return this.codingService.submitCode(
      user.sub,
      dto.codingQuestionId,
      dto.languageId,
      dto.sourceCode,
    );
  }

  @Get('submission/:id')
  @ResponseMessage(Messages.CODING.SUBMISSION_FETCHED)
  async getSubmission(@Param('id') id: string) {
    return this.codingService.getSubmissionById(+id);
  }

  @Get('question/:slug')
  @ResponseMessage(Messages.CODING.QUESTION_FETCHED)
  async getCodingQuestion(@Param('slug') slug: string) {
    return this.codingService.getCodingQuestionBySlug(slug);
  }

  // ==================== ADMIN ROUTES ====================
  @Post('admin/question')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.CODING.QUESTION_CREATED)
  async createCodingQuestion(@Body() dto: CreateCodingQuestionDto) {
    return this.codingService.createCodingQuestion(dto);
  }

  @Post('admin/question/:id/testcase')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.CODING.TESTCASE_ADDED)
  async addTestCase(@Param('id') id: string, @Body() dto: CreateTestCaseDto) {
    return this.codingService.addTestCase(+id, dto);
  }
}