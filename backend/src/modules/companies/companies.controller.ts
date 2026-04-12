// src/modules/companies/companies.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
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

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles(Role.CANDIDATE, Role.MENTOR, Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách công ty' })
  async findAll() {
    const data = await this.companiesService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Companies retrieved successfully',
      data,
    };
  }

  @Post()
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Tạo công ty mới' })
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    const data = await this.companiesService.create(createCompanyDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Company created successfully',
      data,
    };
  }

  @Put(':id')
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật công ty' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    const data = await this.companiesService.update(id, updateCompanyDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Company updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Xóa công ty' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.companiesService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Company deleted successfully',
      data: null,
    };
  }

  @Get('debug/fix-id')
  @Roles(Role.ADMIN)
  async fixId() {
    await this.companiesService.fixSequence();
    return { message: 'Sequence synced!' };
  }
}
