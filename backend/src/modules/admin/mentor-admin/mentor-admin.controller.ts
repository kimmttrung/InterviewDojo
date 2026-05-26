import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MentorAdminService } from './mentor-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { GetMentorsAdminDto } from './dto/get-mentors-admin.dto';
import { RejectMentorDto } from './dto/reject-mentor.dto';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { Messages } from '../../../common/constants/messages.constant';

@Controller('admin/mentors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MentorAdminController {
  constructor(private readonly mentorAdminService: MentorAdminService) {}

  @Get()
  @ResponseMessage(Messages.ADMIN.MENTORS_FETCHED)
  async getAll(@Query() query: GetMentorsAdminDto) {
    return this.mentorAdminService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage(Messages.ADMIN.MENTOR_DETAIL_FETCHED)
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.mentorAdminService.findOne(id);
  }

  @Post(':id/approve')
  @ResponseMessage(Messages.ADMIN.MENTOR_APPROVED)
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
  ) {
    await this.mentorAdminService.approve(id, admin.sub);
    return { message: Messages.ADMIN.MENTOR_APPROVED };
  }

  @Post(':id/reject')
  @ResponseMessage(Messages.ADMIN.MENTOR_REJECTED)
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectMentorDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    await this.mentorAdminService.reject(id, dto.reason, admin.sub);
    return { message: Messages.ADMIN.MENTOR_REJECTED };
  }
}
