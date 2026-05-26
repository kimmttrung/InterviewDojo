import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { mentorAdminApi } from '../api/mentorApi';
import { queryKeys } from '@/shared/lib/queryKeys';
import { showToast } from '@/shared/lib/toast';

// GET LIST
export const useAdminMentors = (filters: any) => {
  const query = useQuery({
    queryKey: queryKeys.admin.mentors(filters),
    queryFn: () => mentorAdminApi.getAll(filters),
    staleTime: 1000 * 10,
  });

  useEffect(() => {
    if (query.error) {
      const err = query.error as any;

      showToast.error(err?.response?.data?.message || 'Lỗi khi tải danh sách mentor');
    }
  }, [query.error]);

  return query;
};

// GET DETAIL
export const useMentorDetail = (id: number) => {
  const query = useQuery({
    queryKey: queryKeys.admin.mentorDetail(id),
    queryFn: () => mentorAdminApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 10,
  });

  useEffect(() => {
    if (query.error) {
      const err = query.error as any;

      showToast.error(err?.response?.data?.message || 'Lỗi khi tải thông tin mentor');
    }
  }, [query.error]);

  return query;
};

// APPROVE
export const useApproveMentor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => mentorAdminApi.approve(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ['admin', 'mentors'],
      });

      await queryClient.cancelQueries({
        queryKey: queryKeys.admin.mentorDetail(id),
      });

      const previousMentorQueries = queryClient.getQueriesData({
        queryKey: ['admin', 'mentors'],
      });

      const previousDetail = queryClient.getQueryData(queryKeys.admin.mentorDetail(id));

      // optimistic update detail
      queryClient.setQueryData(queryKeys.admin.mentorDetail(id), (old: any) => {
        if (!old?.data?.data) return old;

        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              mentorProfile: {
                ...old.data.data.mentorProfile,
                approvalStatus: 'ACTIVE',
              },
            },
          },
        };
      });

      // remove from pending list
      queryClient.setQueriesData(
        {
          queryKey: ['admin', 'mentors'],
        },
        (old: any) => {
          if (!old?.data?.data?.items) return old;

          return {
            ...old,
            data: {
              ...old.data,
              data: {
                ...old.data.data,
                items: old.data.data.items.filter((mentor: any) => mentor.id !== id),
              },
            },
          };
        },
      );

      return {
        previousMentorQueries,
        previousDetail,
      };
    },

    onSuccess: () => {
      showToast.success('Duyệt mentor thành công');
    },

    onError: (err: any, id, context) => {
      context?.previousMentorQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });

      queryClient.setQueryData(queryKeys.admin.mentorDetail(id), context?.previousDetail);

      showToast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    },

    onSettled: (_, __, id) => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'mentors'],
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.mentorDetail(id),
      });
    },
  });
};

// REJECT
export const useRejectMentor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      mentorAdminApi.reject(id, reason),

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({
        queryKey: ['admin', 'mentors'],
      });

      await queryClient.cancelQueries({
        queryKey: queryKeys.admin.mentorDetail(id),
      });

      const previousMentorQueries = queryClient.getQueriesData({
        queryKey: ['admin', 'mentors'],
      });

      const previousDetail = queryClient.getQueryData(queryKeys.admin.mentorDetail(id));

      // optimistic update detail
      queryClient.setQueryData(queryKeys.admin.mentorDetail(id), (old: any) => {
        if (!old?.data?.data) return old;

        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              mentorProfile: {
                ...old.data.data.mentorProfile,
                approvalStatus: 'REJECTED',
              },
            },
          },
        };
      });

      // remove from pending list
      queryClient.setQueriesData(
        {
          queryKey: ['admin', 'mentors'],
        },
        (old: any) => {
          if (!old?.data?.data?.items) return old;

          return {
            ...old,
            data: {
              ...old.data,
              data: {
                ...old.data.data,
                items: old.data.data.items.filter((mentor: any) => mentor.id !== id),
              },
            },
          };
        },
      );

      return {
        previousMentorQueries,
        previousDetail,
      };
    },

    onSuccess: () => {
      showToast.success('Đã từ chối mentor');
    },

    onError: (err: any, variables, context) => {
      context?.previousMentorQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });

      queryClient.setQueryData(queryKeys.admin.mentorDetail(variables.id), context?.previousDetail);

      showToast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    },

    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'mentors'],
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.mentorDetail(variables.id),
      });
    },
  });
};
