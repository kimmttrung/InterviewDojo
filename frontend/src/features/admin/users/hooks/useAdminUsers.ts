// src/features/admin/users/hooks/useAdminUsers.ts
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAdminApi } from '../api/userApi';
import { queryKeys } from '@/shared/lib/queryKeys';
import { showToast } from '@/shared/lib/toast';
import { AdminUser, BanFormData } from '../types/user.types';

// ─── Helpers để unwrap double-axios-wrapper ───────────────────────────
function unwrapItems(response: any) {
  return response?.data?.data; // { items, meta }
}
function unwrapList(response: any) {
  return response?.data?.data ?? [];
}

// ─── Queries ─────────────────────────────────────────────────────────
export const useAdminUsers = (filters: {
  page: number;
  limit: number;
  role?: string;
  status?: string;
  search?: string;
}) => {
  const query = useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: () => userAdminApi.getAll(filters),
    staleTime: 0,
  });

  useEffect(() => {
    if (query.error) {
      const err = query.error as any;
      showToast.error(err?.response?.data?.message || 'Lỗi khi tải danh sách người dùng');
    }
  }, [query.error]);

  const payload = unwrapItems(query.data);
  return {
    ...query,
    items: (payload?.items ?? []) as AdminUser[],
    totalPages: (payload?.meta?.totalPages ?? 1) as number,
    total: (payload?.meta?.total ?? 0) as number,
  };
};

export const useReportedUsers = () => {
  const query = useQuery({
    queryKey: queryKeys.admin.reportedUsers,
    queryFn: () => userAdminApi.getReported(),
    staleTime: 0,
  });

  useEffect(() => {
    if (query.error) {
      const err = query.error as any;
      showToast.error(err?.response?.data?.message || 'Lỗi khi tải danh sách báo cáo');
    }
  }, [query.error]);

  return {
    ...query,
    items: unwrapList(query.data),
  };
};

// ─── Ban mutation (optimistic) ────────────────────────────────────────
export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BanFormData }) => userAdminApi.ban(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] });

      // Snapshot toàn bộ queries có prefix ['admin', 'users']
      const snapshots = queryClient.getQueriesData<any>({ queryKey: ['admin', 'users'] });

      // Optimistic: cập nhật status trong cache
      queryClient.setQueriesData<any>({ queryKey: ['admin', 'users'] }, (old: any) => {
        if (!old) return old;
        const payload = old?.data?.data;
        if (!payload?.items) return old;

        const bannedUntil =
          data.duration === 'TEMPORARY' && data.days
            ? new Date(Date.now() + data.days * 86_400_000).toISOString()
            : null;

        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...payload,
              items: payload.items.map((u: AdminUser) =>
                u.id === id ? { ...u, status: 'BANNED', banReason: data.reason, bannedUntil } : u,
              ),
            },
          },
        };
      });

      return { snapshots };
    },

    onSuccess: () => {
      showToast.success('Khóa người dùng thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'], refetchType: 'active' });
    },

    onError: (err: any, _vars, context) => {
      context?.snapshots?.forEach(([key, data]: [any, any]) => {
        queryClient.setQueryData(key, data);
      });
      showToast.error(err?.response?.data?.message || 'Lỗi khi khóa người dùng');
    },
  });
};

// ─── Unban mutation (optimistic) ──────────────────────────────────────
export const useUnbanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userAdminApi.unban(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] });

      const snapshots = queryClient.getQueriesData<any>({ queryKey: ['admin', 'users'] });

      queryClient.setQueriesData<any>({ queryKey: ['admin', 'users'] }, (old: any) => {
        if (!old) return old;
        const payload = old?.data?.data;
        if (!payload?.items) return old;

        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...payload,
              items: payload.items.map((u: AdminUser) =>
                u.id === id ? { ...u, status: 'ACTIVE', banReason: null, bannedUntil: null } : u,
              ),
            },
          },
        };
      });

      return { snapshots };
    },

    onSuccess: () => {
      showToast.success('Mở khóa người dùng thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'], refetchType: 'active' });
    },

    onError: (err: any, _vars, context) => {
      context?.snapshots?.forEach(([key, data]: [any, any]) => {
        queryClient.setQueryData(key, data);
      });
      showToast.error(err?.response?.data?.message || 'Lỗi khi mở khóa người dùng');
    },
  });
};
