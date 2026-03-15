import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.services';
import { User } from './entities/user.entity';
import { UserSkill } from './entities/user-skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSkill])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
