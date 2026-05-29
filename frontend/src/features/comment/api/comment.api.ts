import { api } from '@/shared/lib/api';
import {
  CreateCommentPayload,
  UpdateCommentPayload,
  ReportCommentPayload,
  CommentItemType,
  PaginatedResponse,
  ApiResponse,
} from '../types/comment.types';

export const getCommentsByQuestionId = async (params: {
  questionId: number;
  page?: number;
  limit?: number;
}) => {
  const { questionId, page = 1, limit = 10 } = params;
  const { data } = await api.get<ApiResponse<PaginatedResponse<CommentItemType>>>(
    `/questions/${questionId}/comments`,
    { params: { page, limit } },
  );
  return data.data;
};

export const createComment = async (payload: CreateCommentPayload): Promise<CommentItemType> => {
  const { questionId, ...body } = payload;
  const { data } = await api.post<ApiResponse<CommentItemType>>(
    `/questions/${questionId}/comments`,
    body,
  );
  return data.data;
};

export const updateComment = async (payload: UpdateCommentPayload): Promise<CommentItemType> => {
  const { commentId, content } = payload;
  const { data } = await api.put<ApiResponse<CommentItemType>>(`/comments/${commentId}`, {
    content,
  });
  return data.data;
};

export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
};

export const reportComment = async (payload: ReportCommentPayload): Promise<void> => {
  await api.post(`/reports/comment`, payload);
};
