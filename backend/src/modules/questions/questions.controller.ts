import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
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
import { RandomQuestionDto } from './dto/andom-question.dto';

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
  @Roles(Role.CANDIDATE, Role.MENTOR, Role.ADMIN)
  async findAll(
    @Query() query: GetQuestionsDto,
  ): Promise<PaginatedResponse<QuestionItem>> {
    return this.questionsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết 1 câu hỏi' })
  @ResponseMessage(Messages.QUESTIONS.FETCH_ONE)
  @Roles(Role.CANDIDATE, Role.MENTOR, Role.ADMIN)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDetail> {
    return this.questionsService.findOne(id, user?.role);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo câu hỏi mới' })
  @ResponseMessage(Messages.QUESTIONS.CREATED)
  @Roles(Role.ADMIN)
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật câu hỏi' })
  @ResponseMessage(Messages.QUESTIONS.UPDATED)
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa câu hỏi' })
  @ResponseMessage(Messages.QUESTIONS.DELETED)
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.remove(id);
  }

  @Get('random')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy câu hỏi ngẫu nhiên theo bộ lọc' })
  @ResponseMessage(Messages.QUESTIONS.RANDOM_FETCHED)
  @Roles(Role.CANDIDATE, Role.MENTOR, Role.ADMIN)
  async getRandomQuestion(
    @Query() filter: RandomQuestionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDetail> {
    return this.questionsService.findRandom(filter, user?.role);
  }
}
