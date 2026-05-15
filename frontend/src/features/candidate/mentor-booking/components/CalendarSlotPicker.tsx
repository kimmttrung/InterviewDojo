// features/candidate/mentor-booking/components/CalendarSlotPicker.tsx
import { useState, useMemo } from 'react';
import { useAvailableSessions } from '../hooks/useAvailableSessions';
import { useAvailableDays } from '../hooks/useAvailableDays';
import { Calendar } from '@/shared/components/ui/calendar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Clock, CalendarDays } from 'lucide-react';
import type { AvailableSession } from '../types/mentor-detail.types';

interface CalendarSlotPickerProps {
  mentorId: number;
  planId: number;
  onSelectSession: (session: AvailableSession) => void;
}

export function CalendarSlotPicker({ mentorId, planId, onSelectSession }: CalendarSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSession, setSelectedSession] = useState<AvailableSession | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: availableDays = [], isLoading: daysLoading } = useAvailableDays(
    mentorId,
    planId,
    currentMonth,
  );
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
  const { data: sessions = [], isLoading: sessionsLoading } = useAvailableSessions(
    mentorId,
    planId,
    dateStr,
  );

  const disabledDays = useMemo(() => {
    return (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return !availableDays.includes(dateStr);
    };
  }, [availableDays]);

  const handleSelectSession = (session: AvailableSession) => {
    setSelectedSession(session);
    onSelectSession(session);
  };

  // Format giờ hiển thị đẹp hơn
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Format ngày hiển thị
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Cột trái: Calendar */}
      <Card className="p-4 border-0 shadow-none bg-transparent">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Chọn ngày</h3>
        </div>
        {daysLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={disabledDays}
            className="rounded-xl border shadow-sm"
            classNames={{
              selected: 'bg-indigo-600 text-white hover:bg-indigo-700',
              today: 'bg-indigo-50 text-indigo-700 font-bold',
              day: 'hover:bg-indigo-50 transition-colors',
              day_disabled: 'text-gray-300 line-through',
              nav_button: 'hover:bg-indigo-50 rounded-lg',
              head_cell: 'text-gray-500 font-medium text-xs',
              cell: 'p-1',
            }}
          />
        )}
      </Card>

      {/* Cột phải: Danh sách khung giờ */}
      <Card className="p-4 border-0 shadow-none bg-transparent">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">
            {selectedDate ? `Khung giờ - ${formatDate(selectedDate)}` : 'Chọn ngày trước'}
          </h3>
        </div>
        {!selectedDate ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
            Vui lòng chọn một ngày để xem khung giờ khả dụng
          </div>
        ) : sessionsLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
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
                {formatTime(session.startTime)}
              </Button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
