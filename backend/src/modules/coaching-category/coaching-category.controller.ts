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
import { CoachingCategoryService } from './coaching-category.service';
import { CreateCategoryDto } from './dto/create-coaching-category.dto';
import { UpdateCategoryDto } from './dto/update-coaching-category.dto';
import { Messages } from '../../common/constants/messages.constant';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('coaching-categories')
export class CoachingCategoryController {
  constructor(private readonly service: CoachingCategoryService) {}

  @Get()
  @ResponseMessage(Messages.COACHING_CATEGORY.FETCHED)
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.COACHING_CATEGORY.CREATED)
  async create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.COACHING_CATEGORY.UPDATED)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage(Messages.COACHING_CATEGORY.DELETED)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
