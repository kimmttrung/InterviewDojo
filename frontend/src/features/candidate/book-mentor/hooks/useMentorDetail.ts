import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBooking, getMentorAvailableSlots, getMentorDetail } from '../api/mentorApi';

export const useMentorDetail = (mentorId: number) => {
  return useQuery({
    queryKey: ['mentor-detail', mentorId],
    queryFn: () => getMentorDetail(mentorId),
    enabled: !!mentorId,
  });
};

export const useMentorAvailableSlots = (mentorId: number) => {
  return useQuery({
    queryKey: ['mentor-available-slots', mentorId],
    queryFn: () => getMentorAvailableSlots(mentorId),
    enabled: !!mentorId,
  });
};

export const useCreateBooking = (mentorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['mentor-available-slots', mentorId],
      });

      queryClient.invalidateQueries({
        queryKey: ['me'],
      });
    },
  });
};
