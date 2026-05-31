import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  GetQuestionsParams,
  RandomQuestionParams,
  PaginatedResponse,
  QuestionDetail,
} from '../types/question.types';
import { questionService } from '../services/question.service';

const unwrap = <T>(res: { success: boolean; data: T; message: string }): T => res.data;

// ========== Queries ==========
export const useQuestions = (params: GetQuestionsParams) => {
  return useQuery({
    queryKey: ['questions', params],
    queryFn: async () => {
      const res = await questionService.getAll(params);
      return unwrap<PaginatedResponse>(res);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useQuestionDetail = (id: string) => {
  return useQuery({
    queryKey: ['question', id],
    queryFn: async () => {
      const res = await questionService.getById(id);
      return unwrap<QuestionDetail>(res);
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useRandomQuestion = (params: RandomQuestionParams) => {
  return useQuery({
    queryKey: ['randomQuestion', params],
    queryFn: async () => {
      const res = await questionService.getRandom(params);
      return res.data;
    },
    enabled: false,
    staleTime: 0,
  });
};

// ========== Mutations ==========
export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await questionService.create(data);
      return unwrap<QuestionDetail>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await questionService.update(id, data);
      return unwrap<QuestionDetail>(res);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['question', id] });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await questionService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};
