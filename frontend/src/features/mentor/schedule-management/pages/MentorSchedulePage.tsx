// src/features/mentor/schedule/pages/MentorSchedulePage.tsx
import React, { useState, useEffect } from 'react';
import { MentorLayout } from '../../dashboard/components/MentorLayout';
import ScheduleCalendar from '../components/ScheduleCalendar';
import SlotEditModal from '../components/SlotEditModal';
import { Slot } from '../types';
import { scheduleService } from '../services/schedule.service';
import { toast } from 'sonner';
import ApprovalGuard from '@/shared/components/layout/ApprovalGuard';
import { ApprovalStatus } from '@/shared/types/enum';
import { useAuthStore } from '@/stores/useAuthStore';

export default function MentorSchedulePage() {
  const { user } = useAuthStore();
  const mentorId = user?.id;
  const mentorStatus = user?.approvalStatus || ApprovalStatus.PENDING;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  useEffect(() => {
    if (!mentorId) return;
    const fetchSlots = async () => {
      try {
        const response = await scheduleService.getSlots(mentorId);
        const slotArray = Array.isArray(response) ? response : response?.data || [];
        // Map dữ liệu từ API sang Slot (đảm bảo startTime, endTime là Date)
        const mapped: Slot[] = slotArray.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        }));
        setSlots(mapped);
      } catch (error) {
        toast.error('Không thể tải lịch làm việc');
      }
    };
    fetchSlots();
  }, [mentorId]);

  const handleSelectRange = async (start: Date, end: Date) => {
    try {
      const newSlotData = {
        mentorId: mentorId as number,
        startTime: start,
        endTime: end,
        isActive: true,
      };
      const createdSlot = await scheduleService.createSlot(newSlotData);
      setSlots((prev) => [...prev, createdSlot]);
      toast.success('Đã mở lịch thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo lịch');
    }
  };

  const handleEventChange = async (updatedSlot: Slot) => {
    try {
      setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));
      await scheduleService.updateSlot(updatedSlot.id, {
        startTime: updatedSlot.startTime,
        endTime: updatedSlot.endTime,
      });
      toast.success('Đã cập nhật thời gian');
    } catch (error) {
      toast.error('Lỗi cập nhật');
      // rollback có thể thêm ở đây
    }
  };

  const handleModalUpdate = async (id: number, data: Partial<Slot>) => {
    try {
      const updated = await scheduleService.updateSlot(id, data);
      setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      toast.success('Đã cập nhật Slot');
    } catch (error) {
      toast.error('Lỗi cập nhật');
    }
  };

  const handleModalDelete = async (id: number) => {
    try {
      await scheduleService.deleteSlot(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
      toast.success('Đã xóa Slot');
    } catch (error) {
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
