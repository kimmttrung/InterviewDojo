import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('candidate/:candidateId')
  @HttpCode(HttpStatus.OK)
  async getRecommendations(
    @Param('candidateId', ParseIntPipe) candidateId: number,
  ) {
    const recommendedMentors =
      await this.recommendationService.recommend(candidateId);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Gợi ý danh sách Mentor thành công',
      data: recommendedMentors,
    };
  }
}
