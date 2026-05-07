// src/modules/categories/categories.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard) // Áp dụng bảo mật JWT và kiểm tra Role
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('debug/fix-id') // Đường dẫn sẽ là api/v1/categories/debug/fix-id
  @Roles(Role.ADMIN) // Đảm bảo chỉ Admin mới chạy được lệnh này
  async fixId() {
    return await this.categoriesService.fixSequence();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách category' })
  @Roles(Role.CANDIDATE, Role.MENTOR, Role.ADMIN) // Tất cả các role đều có thể xem
  async findAll() {
    const data = await this.categoriesService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Categories retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết category' })
  @Roles(Role.CANDIDATE, Role.MENTOR, Role.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoriesService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category retrieved successfully',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo category mới' })
  @Roles(Role.ADMIN) // Chỉ Staff và Admin mới được tạo
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const data = await this.categoriesService.create(createCategoryDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Category created successfully',
      data,
    };
  }

  @Put(':id') // Dùng Put giống cấu trúc Questions của bạn
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật category' })
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const data = await this.categoriesService.update(id, updateCategoryDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa category' })
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category deleted successfully',
      data: null,
    };
  }
}
