import {
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Controller,
  Get,
  Post, // <-- thêm
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
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFileType } from '../../common/types/uploaded-file.type';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @Get('me')
  @ResponseMessage(Messages.USER.PROFILE_FETCHED)
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.userService.getMe(Number(user.sub));
  }

  @ApiBearerAuth()
  @Get('stats')
  @ResponseMessage(Messages.USER.PROFILE_FETCHED)
  async getStats(@CurrentUser() user: JwtPayload) {
    return this.userService.getStats(Number(user.sub));
  }

  @ApiBearerAuth()
  @Put('me')
  @ResponseMessage(Messages.USER.PROFILE_UPDATED)
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    updateUserDto: UpdateUserDto,
  ) {
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
  @ResponseMessage(Messages.USER.TARGET_ROLE_UPDATED)
  async updateTargetRole(
    @CurrentUser() user: JwtPayload,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdateTargetRoleDto,
  ) {
    return this.userService.updateTargetRole(Number(user.sub), dto);
  }

  // ========== THÊM TỪ DEVELOP ==========
  @Post('me/avatar')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage(Messages.USER.AVATAR_UPLOADED)
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5_000_000 }),
          new FileTypeValidator({ fileType: /^(image\/(jpeg|png|webp))$/i }),
        ],
      }),
    )
    file: UploadedFileType,
  ) {
    return this.userService.uploadAvatar(Number(user.sub), file);
  }
}
