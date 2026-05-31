// src/features/mentor/schedule/hooks/useSchedule.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '../services/schedule.service';
import { Slot } from '../types';
import { toast } from 'sonner';

export const useSchedule = (mentorId: number | undefined, isApproved: boolean) => {
  const queryClient = useQueryClient();
  const queryKey = ['slots', mentorId];

  // 1. Fetch dữ liệu - Tối ưu bằng staleTime để tránh refetch liên tục
  const { data: slots = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await scheduleService.getSlots();
      const slotArray = Array.isArray(response) ? response : response?.data || [];
      return slotArray.map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
      })) as Slot[];
    },
    enabled: !!mentorId && isApproved,
    staleTime: 5 * 60 * 1000, // Dữ liệu được coi là mới trong 5 phút, giảm render thừa
  });

  // 2. Mutation Tạo Slot - Optimistic Update
  const createMutation = useMutation({
    mutationFn: (newSlot: Omit<Slot, 'id'>) => scheduleService.createSlot(newSlot),
    // Bước này chạy ngay khi vừa bấm chuột/thả lịch
    onMutate: async (newSlot) => {
      await queryClient.cancelQueries({ queryKey }); // Hủy các fetch đang chạy để tránh xung đột
      const previousSlots = queryClient.getQueryData<Slot[]>(queryKey); // Lưu lại snapshot cũ

      // Cập nhật "ảo" vào cache ngay lập tức
      const optimisticSlot = { ...newSlot, id: Math.random() } as Slot;
      queryClient.setQueryData<Slot[]>(queryKey, (old = []) => [...old, optimisticSlot]);

      return { previousSlots }; // Trả về snapshot để dùng nếu lỗi
    },
    onError: (err, newSlot, context) => {
      queryClient.setQueryData(queryKey, context?.previousSlots); // Rollback nếu server lỗi
      toast.error('Không thể tạo lịch, vui lòng thử lại');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey }); // Luôn đồng bộ lại với Server sau khi xong
    },
  });

  // 3. Mutation Cập nhật (Kéo thả/Sửa Modal) - Optimistic Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Slot> }) =>
      scheduleService.updateSlot(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSlots = queryClient.getQueryData<Slot[]>(queryKey);

      queryClient.setQueryData<Slot[]>(queryKey, (old = []) =>
        old.map((s) => (s.id === id ? { ...s, ...data } : s)),
      );

      return { previousSlots };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousSlots);
      toast.error('Cập nhật thất bại');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 4. Mutation Xóa
  const deleteMutation = useMutation({
    mutationFn: (id: number) => scheduleService.deleteSlot(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSlots = queryClient.getQueryData<Slot[]>(queryKey);

      queryClient.setQueryData<Slot[]>(queryKey, (old = []) => old.filter((s) => s.id !== id));

      return { previousSlots };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(queryKey, context?.previousSlots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    slots,
    loading,
    createSlot: createMutation.mutate,
    updateSlot: updateMutation.mutate,
    deleteSlot: deleteMutation.mutate,
  };
};
