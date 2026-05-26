// src/modules/job-roles/job-roles.module.ts
import { Module } from '@nestjs/common';
import { JobRolesController } from './job-roles.controller';
import { JobRolesService } from './job-roles.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobRolesController],
  providers: [JobRolesService],
})
export class JobRolesModule {}
