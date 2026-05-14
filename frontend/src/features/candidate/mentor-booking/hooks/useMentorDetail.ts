import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';

export const useMentorDetail = (mentorId: number) => {
  return useQuery({
    queryKey: ['mentor-detail', mentorId],
    queryFn: () => bookingService.getMentorDetail(mentorId),
    enabled: !!mentorId,
  });
};
