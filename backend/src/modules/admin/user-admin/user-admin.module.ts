import { Module } from '@nestjs/common';
import { UserAdminController } from './user-admin.controller';
import { UserAdminService } from './user-admin.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserAdminController],
  providers: [UserAdminService],
  exports: [UserAdminService], // dùng trong Auth guard (lazy unban)
})
export class UserAdminModule {}
