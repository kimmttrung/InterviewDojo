import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { CommentItem } from './interfaces/comment.interface';
import { PaginatedResponse } from '@/common/interfaces/pagination.interface';
import { Messages } from '@/common/constants/messages.constant';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller() // Không khai báo path gốc để xử lý 2 route khác nhau
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // ========================================================
  // ROUTE CHO QUESTION (Lấy danh sách & Thêm mới)
  // Path: /api/questions/:questionId/comments
  // ========================================================

  @Get('questions/:questionId/comments')
  @ResponseMessage(Messages.COMMENT.FETCHED)
  async findAll(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Query() query: QueryCommentDto,
  ): Promise<PaginatedResponse<CommentItem>> {
    return this.commentService.findAllByQuestionId(questionId, query);
  }

  @Post('questions/:questionId/comments')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(Messages.COMMENT.CREATED)
  async create(
    @CurrentUser() user: any, // JWT Payload
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentItem> {
    return this.commentService.create(Number(user.sub), questionId, dto);
  }

  // ========================================================
  // ROUTE CHO COMMENT CỤ THỂ (Sửa & Xóa)
  // Path: /api/comments/:id
  // ========================================================

  @Put('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(Messages.COMMENT.UPDATED)
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) commentId: number,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentItem> {
    return this.commentService.update(Number(user.sub), commentId, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(Messages.COMMENT.DELETED)
  async remove(
    @CurrentUser() user: any, // Payload cần chứa role
    @Param('id', ParseIntPipe) commentId: number,
  ): Promise<void> {
    await this.commentService.softDelete(
      Number(user.sub),
      user.role as Role,
      commentId,
    );
  }
}
