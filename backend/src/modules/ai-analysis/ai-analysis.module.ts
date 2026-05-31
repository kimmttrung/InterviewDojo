import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiAnalysisService } from './ai-analysis.service';
import { AiAnalysisController } from './ai-analysis.controller';
import { AiAgentService } from './ai-agent.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AiAnalysisController],
  providers: [AiAnalysisService, AiAgentService],
  exports: [AiAnalysisService, AiAgentService],
})
export class AiAnalysisModule {}
