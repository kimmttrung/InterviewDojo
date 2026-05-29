import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/shared/lib/toast';
import {
  adminMentorPayoutApi,
  MentorPayoutQuery,
  RejectMentorPayoutPayload,
} from '../api/adminMentorPayoutApi';

export const useAdminMentorPayouts = (params: MentorPayoutQuery) => {
  return useQuery({
    queryKey: ['admin', 'mentor-payouts', params],
    queryFn: () => adminMentorPayoutApi.getPayouts(params),
    staleTime: 30_000,
  });
};

export const useApproveMentorPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminMentorPayoutApi.approvePayout(id),
    onSuccess: () => {
      showToast.success('Da duyet thanh toan cho mentor');
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-statistics'] });
    },
    onError: (err: any) =>
      showToast.error(err?.response?.data?.message || 'Khong the duyet payout'),
  });
};

export const useRejectMentorPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RejectMentorPayoutPayload }) =>
      adminMentorPayoutApi.rejectPayout(id, payload),
    onSuccess: () => {
      showToast.success('Da tu choi payout va xu ly refund');
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-statistics'] });
    },
    onError: (err: any) =>
      showToast.error(err?.response?.data?.message || 'Khong the tu choi payout'),
  });
};

export const useRetrySessionPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) => adminMentorPayoutApi.retrySessionPayout(sessionId),
    onSuccess: () => {
      showToast.success('Da retry payout cho session');
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-statistics'] });
    },
    onError: (err: any) =>
      showToast.error(err?.response?.data?.message || 'Khong the retry payout'),
  });
};
