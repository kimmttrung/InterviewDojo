// src/features/mentor/schedule/components/ScheduleCalendar.tsx
import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/shared/components/ui/card';
import { Slot } from '../types';

interface ScheduleCalendarProps {
  events: Slot[];
  onSelectRange: (start: Date, end: Date) => void;
  onEventClick: (slot: Slot) => void;
  onEventChange: (updatedSlot: Slot) => void;
}

export default function ScheduleCalendar({
  events,
  onSelectRange,
  onEventClick,
  onEventChange,
}: ScheduleCalendarProps) {
  const calendarEvents = useMemo(() => {
    const allEvents: any[] = [];

    events.forEach((slot) => {
      const bgColor = slot.isActive ? '#10b981' : '#6b7280';

      const baseEvent = {
        title: slot.isActive ? 'Available' : 'Inactive',
        backgroundColor: bgColor,
        borderColor: bgColor,
        // 🔥 Mẹo: Tắt kéo thả nếu là lịch lặp để tránh làm sai lệch chuỗi ngày gốc
        editable: slot.isActive && (!slot.recurrentType || slot.recurrentType === 'NONE'),
        extendedProps: {
          originalSlot: slot, // Lưu lại data gốc để mở Modal
        },
      };

      // NẾU KHÔNG LẶP -> Push bình thường
      if (!slot.recurrentType || slot.recurrentType === 'NONE') {
        allEvents.push({
          ...baseEvent,
          id: String(slot.id),
          start: slot.startTime,
          end: slot.endTime,
        });
      }
      // NẾU LẶP -> Dùng vòng lặp để sinh ra các event tương lai
      else {
        const untilDate = slot.recurrentUntil ? new Date(slot.recurrentUntil) : null;
        const LIMIT = 52; // Safety net: Tối đa vẽ 52 lần (1 năm) để chống treo trình duyệt
        let count = 0;

        const currentStart = new Date(slot.startTime);
        const currentEnd = new Date(slot.endTime);

        while (count < LIMIT) {
          // Dừng nếu vượt quá ngày kết thúc lặp
          if (untilDate && currentStart > untilDate) break;

          allEvents.push({
            ...baseEvent,
            id: `${slot.id}_${count}`, // Tạo ID ảo để FullCalendar phân biệt các ô
            start: new Date(currentStart),
            end: new Date(currentEnd),
          });

          // Cộng dồn thời gian cho lần lặp tiếp theo
          if (slot.recurrentType === 'WEEKLY') {
            currentStart.setDate(currentStart.getDate() + 7);
            currentEnd.setDate(currentEnd.getDate() + 7);
          } else if (slot.recurrentType === 'MONTHLY') {
            currentStart.setMonth(currentStart.getMonth() + 1);
            currentEnd.setMonth(currentEnd.getMonth() + 1);
          }

          count++;
        }
      }
    });

    return allEvents;
  }, [events]);

  const handleDateSelect = (selectInfo: any) => {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
    onSelectRange(selectInfo.start, selectInfo.end);
  };

  const handleEventClick = (clickInfo: any) => {
    // Dù click vào sự kiện nhân bản nào, ta cũng lấy ra slot gốc
    const slotData = clickInfo.event.extendedProps.originalSlot as Slot;
    onEventClick(slotData);
  };

  const handleEventChange = (changeInfo: any) => {
    const slotData = changeInfo.event.extendedProps.originalSlot as Slot;
    const updatedSlot = {
      ...slotData,
      startTime: changeInfo.event.start,
      endTime: changeInfo.event.end,
    };
    onEventChange(updatedSlot);
  };

  const renderEventContent = (eventInfo: any) => {
    const isRecurring = eventInfo.event.extendedProps.originalSlot?.recurrentType !== 'NONE';
    return (
      <div className="p-1 overflow-hidden">
        <div className="font-semibold text-xs whitespace-normal line-clamp-2 flex items-center gap-1">
          {eventInfo.event.title}
          {isRecurring && <span title="Lịch lặp">🔄</span>} {/* Thêm icon cho dễ nhận biết */}
        </div>
        <div className="text-[10px] opacity-80">{eventInfo.timeText}</div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-white shadow-lg w-full">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Quản lý lịch rảnh</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-sm font-medium">Inactive</span>
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
        selectable={true}
        selectMirror={true}
        eventDurationEditable={true}
        dayMaxEvents={true}
        weekends={true}
        events={calendarEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventContent={renderEventContent}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        height="80vh"
        eventOverlap={false}
        selectOverlap={false}
      />
    </Card>
  );
}
