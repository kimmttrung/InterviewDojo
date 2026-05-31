import { Module } from '@nestjs/common';
import { CoachingCategoryController } from './coaching-category.controller';
import { CoachingCategoryService } from './coaching-category.service';

@Module({
  controllers: [CoachingCategoryController],
  providers: [CoachingCategoryService],
})
export class CoachingCategoryModule {}
