// src/modules/categories/categories.controller.ts
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ResponseMessage(Messages.CATEGORY.FETCHED)
  @Roles(Role.CANDIDATE, Role.MENTOR, Role.ADMIN)
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ResponseMessage(Messages.CATEGORY.FETCH_ONE)
  @Roles(Role.CANDIDATE, Role.MENTOR, Role.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ResponseMessage(Messages.CATEGORY.CREATED)
  @Roles(Role.ADMIN)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Put(':id')
  @ResponseMessage(Messages.CATEGORY.UPDATED)
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ResponseMessage(Messages.CATEGORY.DELETED)
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }

  @Get('debug/fix-id')
  @Roles(Role.ADMIN)
  async fixId() {
    return this.categoriesService.fixSequence();
  }
}
