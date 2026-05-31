import { Module } from '@nestjs/common';
import { MentorAdminController } from './mentor-admin.controller';
import { MentorAdminService } from './mentor-admin.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MentorAdminController],
  providers: [MentorAdminService],
})
export class MentorAdminModule {}
