// src/features/admin/questions/hooks/useAdminQuestions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionAdminApi } from '../api/questionAdminApi';
import { queryKeys } from '@/shared/lib/queryKeys';
import { showToast } from '@/shared/lib/toast';
import { CreateQuestionPayload } from '../types/question.types';

export const useAdminQuestions = (filters: {
  page: number;
  limit: number;
  keyword?: string;
  type?: string;
  difficulty?: string;
}) => {
  return useQuery({
    queryKey: ['admin', 'questions', filters],
    queryFn: () => questionAdminApi.getAll(filters),
  });
};

export const useAdminQuestionDetail = (id: number) => {
  return useQuery({
    queryKey: ['admin', 'questions', id],
    queryFn: () => questionAdminApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuestionPayload) => questionAdminApi.create(data),
    onSuccess: () => {
      showToast.success('Tạo câu hỏi thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi tạo'),
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateQuestionPayload }) =>
      questionAdminApi.update(id, data),
    onSuccess: (_, { id }) => {
      showToast.success('Cập nhật câu hỏi thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions', id] });
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi cập nhật'),
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => questionAdminApi.delete(id),
    onSuccess: () => {
      showToast.success('Xóa câu hỏi thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi khi xóa'),
  });
};
