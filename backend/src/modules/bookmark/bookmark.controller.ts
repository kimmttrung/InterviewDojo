// src/modules/bookmark/bookmark.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookmarkService } from './bookmark.service';
import { QueryBookmarkDto } from './dto/query-bookmark.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users/me/bookmarks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CANDIDATE)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Get()
  async getBookmarkedQuestions(
    @CurrentUser() user: any,
    @Query() query: QueryBookmarkDto,
  ) {
    return this.bookmarkService.getBookmarkedQuestions(Number(user.sub), query);
  }

  @Post(':questionId')
  async bookmark(
    @CurrentUser() user: any,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    return this.bookmarkService.bookmark(Number(user.sub), questionId);
  }

  @Delete(':questionId')
  async unbookmark(
    @CurrentUser() user: any,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    return this.bookmarkService.unbookmark(Number(user.sub), questionId);
  }
}
