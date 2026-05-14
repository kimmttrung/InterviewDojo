import { useState, useMemo } from 'react';
import { useAvailableSessions } from '../hooks/useAvailableSessions';
import { useAvailableDays } from '../hooks/useAvailableDays';
import { Calendar } from '@/shared/components/ui/calendar';
import { Button } from '@/shared/components/ui/button';
import { AvailableSession } from '../types';

interface CalendarSlotPickerProps {
  mentorId: number;
  planId: number;
  onSelectSession: (session: AvailableSession) => void;
}

export function CalendarSlotPicker({ mentorId, planId, onSelectSession }: CalendarSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSession, setSelectedSession] = useState<AvailableSession | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: availableDays = [] } = useAvailableDays(mentorId, planId, currentMonth);
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
  const { data: sessions = [] } = useAvailableSessions(mentorId, planId, dateStr);

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Chọn ngày</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={disabledDays}
          className="rounded-md border"
        />
      </div>

      {selectedDate && sessions.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Khung giờ khả dụng</h3>
          <div className="grid grid-cols-3 gap-2">
            {sessions.map((session: AvailableSession) => (
              <Button
                key={session.startTime}
                variant={selectedSession?.startTime === session.startTime ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSelectSession(session)}
                className="w-full"
              >
                {new Date(session.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && sessions.length === 0 && (
        <p className="text-sm text-gray-500">Không có khung giờ khả dụng cho ngày này.</p>
      )}
    </div>
  );
}
