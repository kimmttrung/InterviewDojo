// features/meeting/hooks/useSessionDetail.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export interface SessionDetail {
  id: number;
  source: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  mentorId: number | null;
  candidateId: number | null;
  intervieweeId: number;
  meetingLink: string | null;
}

export const useSessionDetail = (sessionId: number) => {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data.data as SessionDetail;
    },
    enabled: !isNaN(sessionId) && sessionId > 0,
  });
};
