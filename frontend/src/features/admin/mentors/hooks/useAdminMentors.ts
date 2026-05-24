import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mentorAdminApi } from '../api/mentorApi';
import { queryKeys } from '@/shared/lib/queryKeys';
import { showToast } from '@/shared/lib/toast';

export const useAdminMentors = (filters: any) => {
  const query = useQuery({
    queryKey: queryKeys.admin.mentors(filters),
    queryFn: () => mentorAdminApi.getAll(filters),
  });

  useEffect(() => {
    if (query.error) {
      const err = query.error as any;
      showToast.error(err?.response?.data?.message || 'Lỗi khi tải danh sách mentor');
    }
  }, [query.error]);

  return query;
};

export const useMentorDetail = (id: number) => {
  const query = useQuery({
    queryKey: queryKeys.admin.mentorDetail(id),
    queryFn: () => mentorAdminApi.getById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (query.error) {
      const err = query.error as any;
      showToast.error(err?.response?.data?.message || 'Lỗi khi tải thông tin mentor');
    }
  }, [query.error]);

  return query;
};

export const useApproveMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mentorAdminApi.approve(id),
    onSuccess: (_, id) => {
      showToast.success('Duyệt mentor thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentors'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.mentorDetail(id) });
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi'),
  });
};

export const useRejectMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      mentorAdminApi.reject(id, reason),
    onSuccess: (_, { id }) => {
      showToast.success('Đã từ chối mentor');
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentors'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.mentorDetail(id) });
    },
    onError: (err: any) => showToast.error(err?.response?.data?.message || 'Lỗi'),
  });
};
