import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AiModule } from '@/modules/ai-summary/ai-summary.module';
import { DashboardController } from './candidate-dashboard.controller';
import { DashboardService } from './candidate-dashboard.service';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class CandidateDashboardModule {}
