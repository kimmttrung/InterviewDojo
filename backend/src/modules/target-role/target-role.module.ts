import { Module } from '@nestjs/common';
import { JobRoleService } from './target-role.service';
import { TargetRoleController } from './target-role.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TargetRoleController],
  providers: [JobRoleService],
})
export class TargetRoleModule {}
