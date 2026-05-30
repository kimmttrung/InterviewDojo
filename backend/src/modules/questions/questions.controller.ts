// backend/src/modules/questions/questions.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';
import { QuestionItem } from './interfaces/question-item.interface';
import { QuestionDetail } from './interfaces/question-detail.interface';
import { PaginatedResponse } from '@/common/interfaces/pagination.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RandomQuestionDto } from './dto/random-question.dto';

@ApiTags('Questions')
@ApiBearerAuth()
@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi' })
  @ResponseMessage(Messages.QUESTIONS.FETCHED)
  @Roles(Role.CANDIDATE, Role.MENTOR)
  async findAll(
    @Query() query: GetQuestionsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponse<QuestionItem>> {
    const userId = user ? Number(user.sub) : undefined;
    return this.questionsService.findAll(query, userId);
  }

  @Get('random')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy câu hỏi ngẫu nhiên theo bộ lọc' })
  @ResponseMessage(Messages.QUESTIONS.RANDOM_FETCHED)
  @Roles(Role.CANDIDATE, Role.MENTOR)
  async getRandomQuestion(
    @Query() filter: RandomQuestionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDetail | null> {
    return this.questionsService.findRandom(filter, user?.role);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết 1 câu hỏi' })
  @ResponseMessage(Messages.QUESTIONS.FETCH_ONE)
  @Roles(Role.CANDIDATE, Role.MENTOR)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDetail> {
    const userId = user ? Number(user.sub) : undefined;
    return this.questionsService.findOne(id, user?.role, userId);
  }
}
