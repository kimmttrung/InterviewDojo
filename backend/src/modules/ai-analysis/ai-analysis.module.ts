import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiAnalysisService } from './ai-analysis.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [AiAnalysisService],
  exports: [AiAnalysisService],
})
export class AiAnalysisModule {}
