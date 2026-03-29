import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { GetQuestionsDto } from './dto/get-questions.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: GetQuestionsDto) {
    const result = await this.questionsService.findAll(query);

    return {
      statusCode: HttpStatus.OK,
      message: 'Questions retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }
}
