import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateTargetRoleDto } from './dto/update-target-role.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateMentorProfileDto } from './dto/create-mentor-profile.dto';
import { Post } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    console.log('User ID nhận được:', user.sub);
    return this.userService.getMe(Number(user.sub));
  }

  //Thieu bang history interview/answered question
  @ApiBearerAuth()
  @Get('stats')
  async getStats(@CurrentUser() user: JwtPayload) {
    return this.userService.getStats(Number(user.sub));
  }

  @ApiBearerAuth()
  @Put('me') // Đổi từ PATCH sang PUT
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    updateUserDto: UpdateUserDto,
  ) {
    // Log để debug dữ liệu nhận được
    console.log('Dữ liệu PUT nhận được:', updateUserDto);

    return this.userService.updateMe(Number(user.sub), updateUserDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin-test')
  adminTest() {
    return {
      message: 'Chỉ admin mới vào được route này',
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @Patch('target-role')
  async updateTargetRole(
    @CurrentUser() user: JwtPayload,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdateTargetRoleDto,
  ) {
    return this.userService.updateTargetRole(Number(user.sub), dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MENTOR)
  @Post('mentor-profile')
  async createMentorProfile(
    @CurrentUser() user: JwtPayload,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreateMentorProfileDto,
  ) {
    return this.userService.createMentorProfile(Number(user.sub), dto);
  }
}
