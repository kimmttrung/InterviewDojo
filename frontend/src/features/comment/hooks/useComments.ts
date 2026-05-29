import { useQuery } from '@tanstack/react-query';
import { getCommentsByQuestionId } from '../api/comment.api';
import { GetCommentsParams } from '../types/comment.types';

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (params: GetCommentsParams) => [...commentKeys.lists(), params] as const,
};

export const useComments = (params: GetCommentsParams) => {
  return useQuery({
    queryKey: commentKeys.list(params),
    queryFn: () => getCommentsByQuestionId(params),
    enabled: !!params.questionId, // Chỉ chạy khi có questionId
  });
};
