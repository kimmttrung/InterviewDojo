import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UserAdminService } from './user-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { Role } from '@prisma/client';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { GetUsersAdminDto } from './dto/get-users-admin.dto';
import { BanUserDto } from './dto/ban-user.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserAdminController {
  constructor(private readonly userAdminService: UserAdminService) {}

  @Get()
  @ResponseMessage('Lấy danh sách người dùng thành công')
  async getAll(@Query() query: GetUsersAdminDto) {
    return this.userAdminService.findAll(query);
  }

  @Get('reported')
  @ResponseMessage('Lấy danh sách user bị báo cáo thành công')
  async getReportedUsers() {
    return this.userAdminService.getReportedUsers();
  }

  @Get(':id')
  @ResponseMessage('Lấy thông tin người dùng thành công')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userAdminService.findOne(id);
  }

  @Post(':id/ban')
  @ResponseMessage('Khóa người dùng thành công')
  async banUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BanUserDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.userAdminService.banUser(id, dto, admin.sub);
  }

  @Post(':id/unban')
  @ResponseMessage('Mở khóa người dùng thành công')
  async unbanUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.userAdminService.unbanUser(id, admin.sub);
  }
}
