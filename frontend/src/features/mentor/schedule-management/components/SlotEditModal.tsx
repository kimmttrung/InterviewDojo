// src/features/mentor/schedule/components/SlotEditModal.tsx
import React, { useState } from 'react';
import { X, Trash2, Save, CalendarRange } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Slot, RecurrenceType } from '../types';
import {
  formatDateForInput,
  formatDateTimeForInput,
  getTodayICT,
  parseLocalDate,
} from '@/shared/utils/date';

interface SlotEditModalProps {
  slot: Slot;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<Slot>) => void;
  onDelete: (id: number) => void;
}

export default function SlotEditModal({ slot, onClose, onUpdate, onDelete }: SlotEditModalProps) {
  const [startTime, setStartTime] = useState(formatDateTimeForInput(slot.startTime));
  const [endTime, setEndTime] = useState(formatDateTimeForInput(slot.endTime));
  const [recurrence, setRecurrence] = useState<RecurrenceType>(slot.recurrentType || 'NONE');
  const [isActive, setIsActive] = useState(slot.isActive);

  // 🔥 Fix: Initialize state from slot if available
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>(
    slot.recurrentUntil ? formatDateForInput(slot.recurrentUntil) : '',
  );

  const handleSave = () => {
    onUpdate(slot.id, {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      recurrentType: recurrence,
      // Ensure recurrence end date is saved if a recurrence type is selected
      recurrentUntil:
        recurrence !== 'NONE' && recurrenceEndDate ? parseLocalDate(recurrenceEndDate) : null,
      isActive,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 relative bg-white shadow-xl rounded-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">Edit Availability Window</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600">Status</label>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Start Time</label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">End Time</label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                <CalendarRange size={16} /> Recurrence Mode
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="NONE">Do not repeat</option>
                <option value="WEEKLY">Repeat weekly</option>
                <option value="MONTHLY">Repeat monthly</option>
              </select>
            </div>

            {recurrence !== 'NONE' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-emerald-600 mb-1">
                  Repeat Until
                </label>
                <Input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  // Prevent selecting a past date relative to creation time
                  min={getTodayICT()}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-6 mt-2 border-t">
          <Button
            variant="destructive"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => {
              onDelete(slot.id);
            }}
          >
            <Trash2 size={16} /> Delete
          </Button>
          <Button
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
          >
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
