// src/features/mentor/schedule/pages/MentorSchedulePage.tsx
import React, { useState } from 'react';
import { MentorLayout } from '../../dashboard/components/MentorLayout';
import ScheduleCalendar from '../components/ScheduleCalendar';
import SlotEditModal from '../components/SlotEditModal';
import { Slot } from '../types';
import ApprovalGuard from '@/shared/components/layout/ApprovalGuard';
import { ApprovalStatus } from '@/shared/types/enum';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMentorProfile } from '../../profile-management/hooks/useMentorProfile';
// 🔥 1. Import hook useSchedule bạn vừa tạo
import { useSchedule } from '../hooks/useSchedule';

export default function MentorSchedulePage() {
  const { user } = useAuthStore();
  const mentorId = user?.id;

  const { data: mentorProfile } = useMentorProfile();
  const mentorStatus = mentorProfile?.approvalStatus || ApprovalStatus.PENDING;

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // 🔥 2. Gọi hook useSchedule thay vì tự viết useQuery/useMutation dài dòng
  const {
    slots,
    loading: isLoading,
    createSlot,
    updateSlot,
    deleteSlot,
  } = useSchedule(mentorId, mentorStatus === ApprovalStatus.ACTIVE);

  // ==========================================
  // 3. HANDLERS TRUYỀN VÀO CALENDAR & MODAL
  // ==========================================
  const handleSelectRange = (start: Date, end: Date) => {
    // Gọi hàm createSlot từ hook
    createSlot({
      mentorId: mentorId!,
      startTime: start,
      endTime: end,
      isActive: true,
    });
  };

  const handleEventChange = (updatedSlot: Slot) => {
    // Khi kéo thả/kéo dài giờ trên lịch
    updateSlot({
      id: updatedSlot.id,
      data: {
        startTime: updatedSlot.startTime,
        endTime: updatedSlot.endTime,
      },
    });
  };

  const handleModalUpdate = (id: number, data: Partial<Slot>) => {
    updateSlot({ id, data });
  };

  const handleModalDelete = (id: number) => {
    deleteSlot(id);
    setSelectedSlot(null); // Đóng modal sau khi xóa
  };

  return (
    <MentorLayout>
      <div className="p-6 relative">
        <ApprovalGuard status={mentorStatus}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          )}

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
