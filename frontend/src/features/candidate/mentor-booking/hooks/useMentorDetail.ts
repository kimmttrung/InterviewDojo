// hooks/useMentorDetail.ts
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import type { MentorDetail } from '../types/mentor-detail.types';

export const useMentorDetail = (mentorId: number) => {
  return useQuery<MentorDetail>({
    queryKey: ['mentor-detail', mentorId],
    queryFn: () => bookingService.getMentorDetail(mentorId),
    enabled: !!mentorId,
  });
};
