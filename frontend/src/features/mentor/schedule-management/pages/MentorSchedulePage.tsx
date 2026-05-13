// src/features/mentor/schedule/pages/MentorSchedulePage.tsx
import React, { useState, useEffect } from 'react';
import { MentorLayout } from '../../dashboard/components/MentorLayout';
import ScheduleCalendar from '../components/ScheduleCalendar';
import SlotEditModal from '../components/SlotEditModal';
import { Slot, SlotStatus } from '../types';
import { scheduleService } from '../service/schedule.service';
import { toast } from 'sonner';
import ApprovalGuard from '@/shared/components/layout/ApprovalGuard';
import { ApprovalStatus } from '@/shared/types/enum';
import { useAuthStore } from '@/stores/useAuthStore';

export default function MentorSchedulePage() {
  // Giả lập lấy ID của Mentor đang đăng nhập (Thực tế lấy từ AuthStore/Context)
  // const mentorId = 1;
  const { user } = useAuthStore();
  const mentorId = user?.id;
  const mentorStatus = user?.approvalStatus || ApprovalStatus.PENDING;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // 1. Fetch dữ liệu từ API
  useEffect(() => {
    if (!mentorId) return;
    const fetchSlots = async () => {
      try {
        const response = await scheduleService.getSlots(mentorId);

        // Lấy đúng mảng. Nếu response là mảng luôn thì lấy response,
        // nếu bị bọc trong object thì lấy response.data
        const slotArray = Array.isArray(response) ? response : response?.data || [];

        setSlots(slotArray);
      } catch (error) {
        console.error('Fetch slots error:', error); // Fix lỗi unused var
        toast.error('Không thể tải lịch làm việc');
      }
    };
    fetchSlots();
  }, [mentorId]);

  // 2. Mentor dùng chuột Kéo bôi đen khoảng trống -> Tạo Slot mới
  const handleSelectRange = async (start: Date, end: Date) => {
    try {
      const newSlotData = {
        mentorId: mentorId as number,
        startTime: start,
        endTime: end,
        status: SlotStatus.AVAILABLE, // Fix lỗi TS2345 thiếu thuộc tính status
      };

      const createdSlot = await scheduleService.createSlot(newSlotData);
      setSlots((prev) => [...prev, createdSlot]);
      toast.success('Đã mở lịch thành công');
    } catch (error) {
      console.error('Create slot error:', error); // Fix lỗi unused var
      toast.error('Có lỗi xảy ra khi tạo lịch');
    }
  };

  // 3. Mentor kéo di chuyển Slot cũ hoặc kéo dài thời gian (Drag & Drop / Resize)
  const handleEventChange = async (updatedSlot: Slot) => {
    try {
      // Cập nhật giao diện ngay lập tức cho mượt
      setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));

      // Gọi API update ngầm
      await scheduleService.updateSlot(updatedSlot.id, {
        startTime: updatedSlot.startTime,
        endTime: updatedSlot.endTime,
      });
      toast.success('Đã cập nhật thời gian');
    } catch (error) {
      console.error('Update time error:', error); // Fix lỗi unused var
      toast.error('Lỗi cập nhật. Trả về vị trí cũ.');
      // Logic rollback state về cũ nếu API lỗi (Tùy chọn)
    }
  };

  // 4. Xử lý lưu từ Modal (nếu Mentor click vào Slot để set lặp lại/sửa giờ)
  const handleModalUpdate = async (id: number, data: Partial<Slot>) => {
    try {
      const updated = await scheduleService.updateSlot(id, data);
      setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      toast.success('Đã cập nhật Slot');
    } catch (error) {
      console.error('Update slot error:', error); // Fix lỗi unused var
      toast.error('Lỗi cập nhật');
    }
  };

  // 5. Xử lý xóa Slot
  const handleModalDelete = async (id: number) => {
    try {
      await scheduleService.deleteSlot(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
      toast.success('Đã xóa Slot');
    } catch (error) {
      console.error('Delete slot error:', error); // Fix lỗi unused var
      toast.error('Lỗi xóa Slot');
    }
  };

  return (
    <MentorLayout>
      <div className="p-6">
        <ApprovalGuard status={mentorStatus}>
          <ScheduleCalendar
            events={slots}
            onSelectRange={handleSelectRange}
            onEventClick={(slot) => setSelectedSlot(slot)}
            onEventChange={handleEventChange}
          />

          {selectedSlot && (
            <SlotEditModal
              slot={selectedSlot}
              onClose={() => setSelectedSlot(null)}
              onUpdate={handleModalUpdate}
              onDelete={handleModalDelete}
            />
          )}
        </ApprovalGuard>
      </div>
    </MentorLayout>
  );
}
