// src/features/mentor/schedule/components/ScheduleCalendar.tsx
import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/shared/components/ui/card';
import { Slot, SlotStatus } from '../types';

interface ScheduleCalendarProps {
  events: Slot[];
  onSelectRange: (start: Date, end: Date) => void;
  onEventClick: (slot: Slot) => void;
  onEventChange: (updatedSlot: Slot) => void; // Thêm prop để xử lý khi kéo thả/resize
}

export default function ScheduleCalendar({
  events,
  onSelectRange,
  onEventClick,
  onEventChange,
}: ScheduleCalendarProps) {
  const calendarEvents = useMemo(() => {
    return events.map((slot) => {
      let bgColor = '#10b981'; // AVAILABLE (Xanh)
      let title = 'Available';

      if (slot.status === SlotStatus.BLOCKED || slot.status === SlotStatus.BOOKED) {
        bgColor = '#6b7280'; // BLOCKED/BOOKED (Xám)
        // Nếu có booking, hiển thị tên Gói Dịch Vụ và tên Candidate
        if (slot.bookingInfo) {
          title = `${slot.bookingInfo.planName} - ${slot.bookingInfo.candidateName}`;
        } else {
          title = 'Blocked';
        }
      }

      return {
        id: String(slot.id),
        title: title,
        start: slot.startTime,
        end: slot.endTime,
        backgroundColor: bgColor,
        borderColor: bgColor,
        // Chỉ cho phép kéo thả/resize nếu Slot đang AVAILABLE
        editable: slot.status === SlotStatus.AVAILABLE,
        extendedProps: {
          originalSlot: slot,
        },
      };
    });
  }, [events]);

  // Kéo tạo Slot mới
  const handleDateSelect = (selectInfo: any) => {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
    onSelectRange(selectInfo.start, selectInfo.end);
  };

  // Click vào Slot để sửa/xóa
  const handleEventClick = (clickInfo: any) => {
    const slotData = clickInfo.event.extendedProps.originalSlot as Slot;
    onEventClick(slotData);
  };

  // Kéo thả di chuyển (Drag & Drop) hoặc kéo giãn thời gian (Resize) Slot
  const handleEventChange = (changeInfo: any) => {
    const slotData = changeInfo.event.extendedProps.originalSlot as Slot;
    const updatedSlot = {
      ...slotData,
      startTime: changeInfo.event.start,
      endTime: changeInfo.event.end,
    };
    onEventChange(updatedSlot);
  };

  // Custom giao diện hiển thị bên trong Slot
  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="p-1 overflow-hidden">
        <div className="font-semibold text-xs whitespace-normal line-clamp-2">
          {eventInfo.event.title}
        </div>
        <div className="text-[10px] opacity-80">{eventInfo.timeText}</div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-white shadow-lg w-full">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Quản lý lịch rảnh (Available Slots)</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium">Available (Kéo thả để tạo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-sm font-medium">Booked (Có người đặt)</span>
          </div>
        </div>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth',
        }}
        initialView="timeGridWeek"
        selectable={true} // Cho phép kéo để bôi đen vùng thời gian
        selectMirror={true}
        editable={true} // BẬT KÉO THẢ VÀ RESIZE
        eventDurationEditable={true} // Cho phép kéo dài/thu ngắn thời gian
        dayMaxEvents={true}
        weekends={true}
        events={calendarEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventChange} // Bắt sự kiện Drop
        eventResize={handleEventChange} // Bắt sự kiện Resize
        eventContent={renderEventContent} // Render custom text
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        height="80vh"
        eventOverlap={false}
        selectOverlap={false}
      />
    </Card>
  );
}
