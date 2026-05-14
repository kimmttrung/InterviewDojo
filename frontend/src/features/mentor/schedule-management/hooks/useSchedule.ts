// src/features/mentor/schedule/hooks/useSchedule.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '../service/schedule.service';
import { Slot } from '../types';

export const useSchedule = (
  mentorId: number,
  mentorStatus: { isActive: boolean; isApproved: boolean },
) => {
  const queryClient = useQueryClient();
  const queryKey = ['slots', mentorId];

  const { data: slots = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: () => scheduleService.getSlots(mentorId),
    enabled: mentorStatus.isActive && mentorStatus.isApproved,
  });

  const setSlots = (updater: Slot[] | ((prev: Slot[]) => Slot[])) => {
    queryClient.setQueryData<Slot[]>(queryKey, (old = []) => {
      return typeof updater === 'function' ? updater(old) : updater;
    });
  };

  const createSlotMutation = useMutation({
    mutationFn: (newSlotData: Omit<Slot, 'id'>) => scheduleService.createSlot(newSlotData),
    onSuccess: (newSlot) => {
      queryClient.setQueryData<Slot[]>(queryKey, (old = []) => [...old, newSlot]);
    },
  });

  const handleCreateSlot = async (start: Date, end: Date) => {
    const isOverlap = slots.some(
      (s: Slot) => start < new Date(s.endTime) && end > new Date(s.startTime),
    );
    if (isOverlap) throw new Error('Slot bị trùng lặp!');

    return createSlotMutation.mutateAsync({
      mentorId,
      startTime: start,
      endTime: end,
      isActive: true,
    });
  };

  return {
    slots,
    loading,
    handleCreateSlot,
    setSlots,
  };
};
