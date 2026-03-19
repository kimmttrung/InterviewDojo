import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // BẮT BUỘC phải có để UserService dùng được Prisma
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Export nếu bạn muốn các Module khác (như Auth) dùng UserService
})
export class UserModule {}
