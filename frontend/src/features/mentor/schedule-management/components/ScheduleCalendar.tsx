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
    return events.map((slot) => {
      // Chỉ phân biệt active hay không, không còn status BLOCKED/BOOKED riêng
      const bgColor = slot.isActive ? '#10b981' : '#6b7280'; // xanh nếu active, xám nếu không
      return {
        id: String(slot.id),
        title: slot.isActive ? 'Available' : 'Inactive',
        start: slot.startTime,
        end: slot.endTime,
        backgroundColor: bgColor,
        borderColor: bgColor,
        editable: slot.isActive, // chỉ cho phép kéo thả nếu slot đang active
        extendedProps: {
          originalSlot: slot,
        },
      };
    });
  }, [events]);

  const handleDateSelect = (selectInfo: any) => {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
    onSelectRange(selectInfo.start, selectInfo.end);
  };

  const handleEventClick = (clickInfo: any) => {
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
        editable={true}
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
