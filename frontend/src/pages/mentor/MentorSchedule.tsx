import { MentorLayout } from '../../../components/mentor/MentorLayout';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function MentorSchedule() {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [slots, setSlots] = useState<any>({});
  const [newSlot, setNewSlot] = useState('');

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [duration, setDuration] = useState(60);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);

  const generateSlots = (start: string, end: string, duration: number) => {
    const result: string[] = [];

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    let current = new Date();
    current.setHours(startH, startM, 0);

    const endTime = new Date();
    endTime.setHours(endH, endM, 0);

    while (current < endTime) {
      const next = new Date(current.getTime() + duration * 60000);

      if (next > endTime) break;

      result.push(`${current.toTimeString().slice(0, 5)} - ${next.toTimeString().slice(0, 5)}`);

      current = next;
    }

    return result;
  };

  const formatKey = (date: Date) => date.toISOString().split('T')[0];

  const handleAddSlot = () => {
    if (!newSlot) return;

    const key = formatKey(selectedDate);

    setSlots((prev: any) => ({
      ...prev,
      [key]: [...(prev[key] || []), newSlot],
    }));

    setNewSlot('');
  };

  const handleRemoveSlot = (slot: string) => {
    const key = formatKey(selectedDate);

    setSlots((prev: any) => ({
      ...prev,
      [key]: prev[key].filter((s: string) => s !== slot),
    }));
  };

  return (
    <MentorLayout>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: CALENDAR */}
        <Card className="p-4 space-y-4">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCurrentDate(new Date(year, month - 1))}
            >
              <ChevronLeft />
            </Button>

            <h2 className="font-semibold">
              {currentDate.toLocaleString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCurrentDate(new Date(year, month + 1))}
            >
              <ChevronRight />
            </Button>
          </div>

          {/* GRID DAYS */}
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const key = formatKey(date);
              const hasSlot = slots[key]?.length > 0;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`p-2 rounded-lg cursor-pointer transition
                    ${
                      selectedDate.toDateString() === date.toDateString()
                        ? 'bg-indigo-500 text-white'
                        : 'hover:bg-muted'
                    }
                  `}
                >
                  <div>{day}</div>

                  {hasSlot && <div className="text-[10px] text-green-500">●</div>}
                </div>
              );
            })}
          </div>
        </Card>

        {/* RIGHT: SLOT MANAGEMENT */}
        <div className="lg:col-span-2 space-y-6">
          {/* ADD SLOT */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Slots for {selectedDate.toDateString()}</h2>

            {/* TIME PICKER */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Start</p>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">End</p>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full border rounded px-2 py-2"
                >
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                  <option value={120}>120 min</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => {
                    const newSlots = generateSlots(startTime, endTime, duration);
                    const key = formatKey(selectedDate);

                    setSlots((prev: any) => ({
                      ...prev,
                      [key]: [...(prev[key] || []), ...newSlots],
                    }));
                  }}
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(slots[formatKey(selectedDate)] || []).map((slot: string, i: number) => (
                <div
                  key={i}
                  className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-sm flex items-center gap-2"
                >
                  {slot}

                  <button onClick={() => handleRemoveSlot(slot)} className="text-red-500 text-xs">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
}
