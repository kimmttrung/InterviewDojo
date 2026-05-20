// features/candidate/mentor-booking/components/CalendarSlotPicker.tsx
import { useState, useMemo } from 'react';
import { useAvailableSessions } from '../hooks/useAvailableSessions';
import { useAvailableDays } from '../hooks/useAvailableDays';
import { Calendar } from '@/shared/components/ui/calendar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Clock, CalendarDays } from 'lucide-react';
import type { AvailableSession } from '../types/mentor-detail.types'; // import type session
import { formatDateForInput, formatICTTime, formatICTFullDate } from '@/shared/utils/date';

interface CalendarSlotPickerProps {
  mentorId: number;
  planId: number;
  onSelectSession: (session: AvailableSession) => void;
}

export function CalendarSlotPicker({ mentorId, planId, onSelectSession }: CalendarSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSession, setSelectedSession] = useState<AvailableSession | null>(null);

  const currentMonth = formatDateForInput(new Date()).slice(0, 7);
  const { data: availableDays = [] } = useAvailableDays(mentorId, planId, currentMonth);
  const dateStr = selectedDate ? formatDateForInput(selectedDate) : '';
  const { data: sessions = [] } = useAvailableSessions(mentorId, planId, dateStr);

  const disabledDays = useMemo(() => {
    return (date: Date) => {
      const dateStr = formatDateForInput(date);
      return !availableDays.includes(dateStr);
    };
  }, [availableDays]);

  const handleSelectSession = (session: AvailableSession) => {
    setSelectedSession(session);
    onSelectSession(session);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Calendar */}
      <Card className="p-4 border-0 shadow-none bg-transparent">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Chọn ngày</h3>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={disabledDays}
          className="rounded-xl border shadow-sm"
          classNames={{
            months: 'relative flex flex-wrap justify-center gap-8',
            month_caption: 'flex items-center font-medium text-lg h-9 px-2 text-gray-800',
            nav: 'absolute inset-x-0 flex justify-end items-center h-9 gap-2',
            button_next:
              'relative inline-flex items-center justify-center size-9 hover:bg-gray-100 rounded',
            button_previous:
              'relative inline-flex items-center justify-center size-9 hover:bg-gray-100 rounded',
            chevron: 'inline-block size-7 fill-gray-400',
            week: 'grid grid-cols-7',
            weekdays: 'grid grid-cols-7',
            weekday: 'size-9 flex items-center justify-center text-gray-500',
            // Ngày thường (khả dụng) – hiện con trỏ pointer
            day: 'inline-flex items-center justify-center rounded text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 size-9 font-normal aria-selected:opacity-100 cursor-pointer',
            // Ngày hôm nay
            today: 'bg-indigo-50 text-indigo-700 font-semibold',
            // Ngày được chọn
            selected:
              'bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white',
            // Ngày ngoài tháng (outside) – mờ, không tương tác
            outside: 'text-gray-400 opacity-50 cursor-default',
            // Ngày bị disabled – mờ, không tương tác
            disabled: 'text-gray-400 opacity-50 cursor-not-allowed',
            // Các class khác giữ nguyên
            range_middle:
              'aria-selected:bg-blue-50 aria-selected:text-gray-900 aria-selected:hover:bg-blue-200 rounded-none',
            hidden: 'invisible',
          }}
        />
      </Card>

      {/* Time slots */}
      <Card className="p-4 border-0 shadow-none bg-transparent">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">
            {selectedDate ? `Khung giờ - ${formatICTFullDate(selectedDate)}` : 'Chọn ngày trước'}
          </h3>
        </div>
        {!selectedDate ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
            Vui lòng chọn một ngày để xem khung giờ khả dụng
          </div>
        ) : sessions.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
            Không có khung giờ khả dụng cho ngày này
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
            {sessions.map((session) => (
              <Button
                key={session.startTime}
                variant={selectedSession?.startTime === session.startTime ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSelectSession(session)}
                className={`w-full py-3 text-sm font-medium transition-all ${
                  selectedSession?.startTime === session.startTime
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {formatICTTime(session.startTime)}
              </Button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
