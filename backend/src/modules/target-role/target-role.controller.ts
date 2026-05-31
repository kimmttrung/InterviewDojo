import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JobRoleService } from './target-role.service';
import { CreateTargetRoleDto } from './dto/create-target-role.dto';
import { UpdateTargetRoleDto } from './dto/update-target-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { CreateMultipleTargetRoleDto } from './dto/create-multiple-target-role.dto';

@Controller('target-roles')
export class TargetRoleController {
  constructor(private service: JobRoleService) {}

  @Roles(Role.ADMIN)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreateTargetRoleDto,
  ) {
    console.log('DTO nhận được:', dto); // 👈 thêm dòng này
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTargetRoleDto) {
    return this.service.update(Number(id), dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }

  @Post('bulk')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createMany(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreateMultipleTargetRoleDto,
  ) {
    return this.service.createMany(dto);
  }
}
