// features/bookmarks/services/bookmark.services.ts
import { api } from '@/shared/lib/api';
import { BookmarkFilters, BookmarkedQuestion } from '../types/bookmark.types';

interface PaginatedResponse {
  items: BookmarkedQuestion[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getBookmarkedQuestions = async (
  params: BookmarkFilters,
): Promise<PaginatedResponse> => {
  const response = await api.get('/users/me/bookmarks', { params });
  return response.data.data;
};

export const bookmarkQuestion = async (questionId: number) => {
  const response = await api.post(`/users/me/bookmarks/${questionId}`);
  return response.data;
};

export const unbookmarkQuestion = async (questionId: number) => {
  const response = await api.delete(`/users/me/bookmarks/${questionId}`);
  return response.data;
};
