// src/modules/companies/companies.controller.ts
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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles(Role.CANDIDATE, Role.MENTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách công ty' })
  @ResponseMessage(Messages.COMPANY.FETCHED)
  async findAll() {
    return this.companiesService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Tạo công ty mới' })
  @ResponseMessage(Messages.COMPANY.CREATED)
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật công ty' })
  @ResponseMessage(Messages.COMPANY.UPDATED)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa công ty' })
  @ResponseMessage(Messages.COMPANY.DELETED)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.companiesService.remove(id);
    return null; // Interceptor sẽ bọc thành { data: null }
  }

  @Get('debug/fix-id')
  @Roles(Role.ADMIN)
  async fixId() {
    await this.companiesService.fixSequence();
    return null;
  }
}
