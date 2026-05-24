// src/features/reports/hooks/useReportQuestion.ts
import { useMutation } from '@tanstack/react-query';
import { reportUser } from '../api/report.api';
import { toast } from 'sonner';

export const useReportQuestion = () => {
  return useMutation({
    mutationFn: reportUser,
    onSuccess: () => {
      toast.success('Question reported. Admin will review it.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit report';
      toast.error(message);
    },
  });
};
