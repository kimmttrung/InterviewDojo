import { Module } from '@nestjs/common';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [StatisticsModule],
})
export class AdminModule {}
