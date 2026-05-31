// shared-domain/feedback/hooks/useFeedback.ts
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { FeedbackRequest, PartnerFeedbackResponse } from '../types/feedback.types';
import { feedbackApi } from '../services/feedback.service';

export const useSubmitFeedback = (sessionId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FeedbackRequest) => feedbackApi.submit(sessionId, data),
    onSuccess: () => {
      // Invalidate cả hai query để refresh
      queryClient.invalidateQueries({ queryKey: ['myFeedback', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['partnerFeedback', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['myReceivedFeedbacks'] });
    },
  });
};

export const useMyFeedback = (sessionId: number) => {
  return useQuery({
    queryKey: ['myFeedback', sessionId],
    queryFn: () => feedbackApi.getMyFeedback(sessionId).then((res) => res.data.data),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};

// dung chung cho p2p, mentor-to-candidate
export const usePartnerFeedback = (
  sessionId: number,
  options?: Omit<UseQueryOptions<PartnerFeedbackResponse | null>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: ['partnerFeedback', sessionId],
    queryFn: () => feedbackApi.getPartnerFeedback(sessionId).then((res) => res.data.data),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const usePendingFeedbacks = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['pendingFeedbacks', page, limit],
    queryFn: () => feedbackApi.getPendingList(page, limit).then((res) => res.data.data),
  });
};

export const useMyReceivedFeedbacks = () => {
  return useQuery({
    queryKey: ['myReceivedFeedbacks'],
    queryFn: () => feedbackApi.getMyReceivedFeedbacks().then((res) => res.data.data),
  });
};
