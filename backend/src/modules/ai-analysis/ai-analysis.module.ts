import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiAnalysisService } from './ai-analysis.service';
import { AiAnalysisController } from './ai-analysis.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AiAnalysisController],
  providers: [AiAnalysisService],
  exports: [AiAnalysisService],
})
export class AiAnalysisModule { }