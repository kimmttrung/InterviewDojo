import { Module } from '@nestjs/common';
import { TargetRoleService } from './target-role.service';
import { TargetRoleController } from './target-role.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TargetRoleController],
  providers: [TargetRoleService],
})
export class TargetRoleModule {}
