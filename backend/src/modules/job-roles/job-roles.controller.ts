// src/modules/job-roles/job-roles.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JobRolesService } from './job-roles.service';
import { CreateJobRoleDto } from './dto/create-job-role.dto';
import { UpdateJobRoleDto } from './dto/update-job-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';

@Controller('job-roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobRolesController {
  constructor(private readonly service: JobRolesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.MENTOR)
  @ResponseMessage(Messages.JOB_ROLE.FETCHED)
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.JOB_ROLE.CREATED)
  async create(@Body() dto: CreateJobRoleDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.JOB_ROLE.UPDATED)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobRoleDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.JOB_ROLE.DELETED)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
