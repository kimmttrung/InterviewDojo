import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '../service/schedule.service';
import { Slot, SlotStatus } from '../types';

export const useSchedule = (
  mentorId: number,
  mentorStatus: { isActive: boolean; isApproved: boolean },
) => {
  const queryClient = useQueryClient();
  const queryKey = ['slots', mentorId];

  // 1. Thay thế useEffect và useState bằng useQuery
  const { data: slots = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: () => scheduleService.getSlots(mentorId),
    // enabled thay thế cho câu lệnh if(!mentorStatus...) ở code cũ.
    // Query sẽ KHÔNG tự động chạy nếu điều kiện này là false
    enabled: mentorStatus.isActive && mentorStatus.isApproved,
  });

  // 2. Tạo hàm setSlots tương thích với component cũ (MentorSchedulePage)
  // Thay vì setState, nó sẽ ghi trực tiếp vào Cache của TanStack Query
  const setSlots = (updater: Slot[] | ((prev: Slot[]) => Slot[])) => {
    queryClient.setQueryData<Slot[]>(queryKey, (old = []) => {
      return typeof updater === 'function' ? updater(old) : updater;
    });
  };

  // 3. Sử dụng useMutation cho việc tạo Slot (Best practice của TanStack)
  const createSlotMutation = useMutation({
    mutationFn: (newSlotData: Omit<Slot, 'id'>) => scheduleService.createSlot(newSlotData),
    onSuccess: (newSlot) => {
      // Tự động thêm slot mới vào cache khi API báo thành công
      queryClient.setQueryData<Slot[]>(queryKey, (old = []) => [...old, newSlot]);
    },
  });

  // 4. Hàm handleCreateSlot giữ nguyên chữ ký để UI dùng bình thường
  const handleCreateSlot = async (start: Date, end: Date) => {
    // Logic kiểm tra trùng lặp (Overlap check)
    const isOverlap = slots.some(
      (s: Slot) => start < new Date(s.endTime) && end > new Date(s.startTime),
    );

    if (isOverlap) throw new Error('Slot bị trùng lặp!');

    // Gọi API thông qua mutation, dùng mutateAsync để ném lỗi ra ngoài cho UI catch (toast)
    return createSlotMutation.mutateAsync({
      mentorId,
      startTime: start,
      endTime: end,
      status: SlotStatus.AVAILABLE,
    });
  };

  return {
    slots,
    loading,
    handleCreateSlot,
    setSlots, // Trả về setSlots để hỗ trợ các thao tác kéo thả/sửa/xóa ở giao diện
  };
};
