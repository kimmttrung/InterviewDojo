import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id?: number;
    sub?: number;
    userId?: number;
    user_id?: number;
  };
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.userService.getMe(userId);
  }

  @Patch('me')
  async updateMe(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = this.getUserId(req);
    return this.userService.updateMe(userId, updateUserDto);
  }

  private getUserId(req: RequestWithUser): number {
    if (!req.user) {
      throw new UnauthorizedException('Không tìm thấy thông tin xác thực');
    }
    const id =
      req.user.id || req.user.sub || req.user.userId || req.user.user_id;
    if (!id) {
      throw new UnauthorizedException('Token không hợp lệ hoặc thiếu User ID');
    }
    return Number(id);
  }
}
