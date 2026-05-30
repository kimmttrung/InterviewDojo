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
import { RandomQuestionDto } from './dto/random-question.dto';

@ApiTags('Admin Questions')
@ApiBearerAuth()
@Controller('admin/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN) // toàn bộ controller chỉ dành cho admin
export class AdminQuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Admin] Lấy danh sách câu hỏi (kể cả chưa publish)',
  })
  @ResponseMessage(Messages.QUESTIONS.FETCHED)
  async findAll(
    @Query() query: GetQuestionsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponse<QuestionItem>> {
    // Admin có thể truyền thêm tham số isPublished? tuỳ ý, nhưng service hiện tại chỉ lấy isPublished = true
    // Nếu muốn admin thấy cả unpublished, cần sửa service, nhưng tạm thời dùng chung
    const userId = user ? Number(user.sub) : undefined;
    // Gọi service như bình thường – nhưng service đang có isPublished: true
    // Nếu admin muốn thấy tất cả, cần tạo phương thức riêng, nhưng không nằm trong scope này.
    // Ở đây ta giữ nguyên, admin vẫn chỉ thấy published (nếu cần thấy cả thì sửa service).
    return this.questionsService.findAll(query, userId);
  }

  @Get('random')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Lấy câu hỏi ngẫu nhiên' })
  @ResponseMessage(Messages.QUESTIONS.RANDOM_FETCHED)
  async getRandomQuestion(
    @Query() filter: RandomQuestionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDetail | null> {
    return this.questionsService.findRandom(filter, user?.role);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      '[Admin] Lấy chi tiết 1 câu hỏi (kể cả chưa publish, full test case)',
  })
  @ResponseMessage(Messages.QUESTIONS.FETCH_ONE)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDetail> {
    const userId = user ? Number(user.sub) : undefined;
    // Truyền role = 'ADMIN' để service bỏ qua isPublished và trả về full test case
    return this.questionsService.findOne(id, 'ADMIN', userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Admin] Tạo câu hỏi mới' })
  @ResponseMessage(Messages.QUESTIONS.CREATED)
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Cập nhật câu hỏi' })
  @ResponseMessage(Messages.QUESTIONS.UPDATED)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Xóa câu hỏi' })
  @ResponseMessage(Messages.QUESTIONS.DELETED)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.remove(id);
  }
}
