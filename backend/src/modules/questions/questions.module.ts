import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminQuestionsController } from './admin-questions.controller';

@Module({
  imports: [PrismaModule],
  providers: [QuestionsService],
  controllers: [QuestionsController, AdminQuestionsController],
})
export class QuestionsModule {}
