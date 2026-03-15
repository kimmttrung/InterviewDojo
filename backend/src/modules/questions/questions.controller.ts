import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { GetQuestionsFilterDto } from './dto/get-questions-filter.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async getQuestions(
    @Query(new ValidationPipe({ transform: true })) filterDto: GetQuestionsFilterDto,
  ) {
    return this.questionsService.findAll(filterDto);
  }
}