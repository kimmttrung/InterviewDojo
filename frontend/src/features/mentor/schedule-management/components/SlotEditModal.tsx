// src/features/mentor/schedule/components/SlotEditModal.tsx
import React, { useState } from 'react';
import { X, Trash2, Save, CalendarRange } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Slot, RecurrenceType } from '../types';

interface SlotEditModalProps {
  slot: Slot;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<Slot>) => void;
  onDelete: (id: number) => void;
}

// Format datetime-local (YYYY-MM-DDThh:mm)
const formatForInput = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// Format date (YYYY-MM-DD)
const formatDateForInput = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export default function SlotEditModal({ slot, onClose, onUpdate, onDelete }: SlotEditModalProps) {
  const [startTime, setStartTime] = useState(formatForInput(slot.startTime));
  const [endTime, setEndTime] = useState(formatForInput(slot.endTime));
  const [recurrence, setRecurrence] = useState<RecurrenceType>(slot.recurrentType || 'NONE');
  const [isActive, setIsActive] = useState(slot.isActive);

  // 🔥 Sửa lỗi: Khởi tạo giá trị từ slot nếu có
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>(
    slot.recurrentUntil ? formatDateForInput(new Date(slot.recurrentUntil)) : '',
  );

  const handleSave = () => {
    onUpdate(slot.id, {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      recurrentType: recurrence,
      // Đảm bảo có ngày end date nếu chọn lặp
      recurrentUntil:
        recurrence !== 'NONE' && recurrenceEndDate ? new Date(recurrenceEndDate) : null,
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

        <h2 className="text-xl font-bold mb-4">Chỉnh sửa Availability Window</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600">Trạng thái</label>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Bắt đầu</label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Kết thúc</label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 items-center gap-2">
                <CalendarRange size={16} /> Chế độ lặp lịch
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="NONE">Không lặp lại</option>
                <option value="WEEKLY">Lặp hàng tuần</option>
                <option value="MONTHLY">Lặp hàng tháng</option>
              </select>
            </div>

            {recurrence !== 'NONE' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-emerald-600 mb-1">
                  Kết thúc lặp vào ngày
                </label>
                <Input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  // Chặn không cho chọn ngày quá khứ so với thời điểm tạo
                  min={new Date().toISOString().split('T')[0]}
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
            <Trash2 size={16} /> Xóa
          </Button>
          <Button
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
          >
            <Save size={16} /> Lưu thay đổi
          </Button>
        </div>
      </Card>
    </div>
  );
}
