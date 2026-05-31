import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { CommentItem } from './interfaces/comment.interface';
import { PaginatedResponse } from '../../common/interfaces/pagination.interface';
import { Messages } from '../../common/constants/messages.constant';
import { Role } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  // Lấy danh sách comment theo câu hỏi (kèm reply)
  async findAllByQuestionId(
    questionId: number,
    query: QueryCommentDto,
  ): Promise<PaginatedResponse<CommentItem>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Chỉ lấy comment gốc (parentId = null)
    const where = {
      questionId,
      parentId: null,
    };

    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          // Include danh sách trả lời lồng bên trong (sắp xếp tăng dần theo tgian)
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    // Format dữ liệu theo interface CommentItem (che giấu nội dung nếu đã bị xóa)
    const formattedItems = items.map((item) => ({
      id: item.id,
      content: item.isDeleted ? 'Bình luận này đã bị xóa.' : item.content,
      isEdited: item.isEdited,
      isDeleted: item.isDeleted,
      createdAt: item.createdAt,
      user: item.user,
      replies: item.replies.map((reply) => ({
        id: reply.id,
        content: reply.isDeleted ? 'Bình luận này đã bị xóa.' : reply.content,
        isEdited: reply.isEdited,
        isDeleted: reply.isDeleted,
        createdAt: reply.createdAt,
        user: reply.user,
      })),
    }));

    return {
      items: formattedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Tạo bình luận mới hoặc trả lời
  async create(
    userId: number,
    questionId: number,
    dto: CreateCommentDto,
  ): Promise<CommentItem> {
    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        userId,
        questionId,
        parentId: dto.parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return {
      id: comment.id,
      content: comment.content,
      isEdited: comment.isEdited,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      user: comment.user,
    };
  }

  // Sửa bình luận
  async update(
    userId: number,
    commentId: number,
    dto: UpdateCommentDto,
  ): Promise<CommentItem> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    if (!comment) {
      throw new NotFoundException(Messages.COMMENT.NOT_FOUND);
    }
    if (comment.isDeleted) {
      throw new ForbiddenException(Messages.COMMENT.NOT_FOUND); // Ẩn lỗi cố tình sửa cmt đã xóa
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException(Messages.COMMENT.FORBIDDEN);
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
        isEdited: true, // Cờ đánh dấu đã sửa
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return {
      id: updatedComment.id,
      content: updatedComment.content,
      isEdited: updatedComment.isEdited,
      isDeleted: updatedComment.isDeleted,
      createdAt: updatedComment.createdAt,
      user: updatedComment.user,
    };
  }

  // Xóa bình luận (Soft Delete)
  async softDelete(
    userId: number,
    userRole: Role,
    commentId: number,
  ): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(Messages.COMMENT.NOT_FOUND);
    }

    // Admin hoặc chủ nhân mới có quyền xóa
    if (comment.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(Messages.COMMENT.FORBIDDEN);
    }

    // Thực hiện Soft Delete
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
      },
    });
  }
}
