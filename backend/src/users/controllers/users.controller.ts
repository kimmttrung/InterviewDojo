import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { Request } from 'express';
import type { UpdateUserDto } from '../dtos/update-user.dto';
import { UsersService } from '../services/users.services';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: Request & { user: { id: number } }) {
    const userId = req.user.id;
    return await this.usersService.getMe(userId);
  }

  @Patch('me')
  async updateMe(
    @Req() req: Request & { user: { id: number } },
    @Body() dto: UpdateUserDto,
  ) {
    const userId = req.user.id;
    return await this.usersService.updateMe(userId, dto);
  }
}
