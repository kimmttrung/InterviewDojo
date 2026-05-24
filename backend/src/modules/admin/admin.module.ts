// src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { StatisticsModule } from './statistics/statistics.module';
import { MentorAdminModule } from './mentor-admin/mentor-admin.module';
import { UserAdminModule } from './user-admin/user-admin.module';

@Module({
  imports: [StatisticsModule, MentorAdminModule, UserAdminModule],
})
export class AdminModule {}
