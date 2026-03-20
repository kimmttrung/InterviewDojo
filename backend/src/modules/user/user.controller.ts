// user.controller.ts
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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    console.log('User ID nhận được:', user.sub);
    return this.userService.getMe(Number(user.sub));
  }

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
}
