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
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { GetQuestionsDto } from './dto/get-questions.dto';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi' })
  async findAll(@Query() query: GetQuestionsDto) {
    const result = await this.questionsService.findAll(query);

    return {
      statusCode: HttpStatus.OK,
      message: 'Questions retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new question' })
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    const data = await this.questionsService.create(createQuestionDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Question created successfully',
      data,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update question' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    const data = await this.questionsService.update(id, updateQuestionDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Question updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete question' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.questionsService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Question deleted successfully',
      data: null,
    };
  }
}
