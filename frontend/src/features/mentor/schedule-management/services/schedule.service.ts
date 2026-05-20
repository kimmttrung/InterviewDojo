// src/features/mentor/schedule/services/schedule.service.ts
import { api } from '@/shared/lib/api';
import { Slot } from '../types';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const scheduleService = {
  // 🔥 Đã xóa tham số mentorId và params
  getSlots: async () => {
    const response = await api.get(API_ENDPOINT.SLOTS.GET_ALL);
    return response.data?.data || response.data;
  },

  createSlot: async (data: Omit<Slot, 'id'>) => {
    const payload = {
      startTime: data.startTime.toISOString(),
      endTime: data.endTime.toISOString(),
      isActive: true,
      recurrentType: data.recurrentType || 'NONE',
      recurrentUntil: data.recurrentUntil ? data.recurrentUntil.toISOString() : undefined,
    };
    const response = await api.post(API_ENDPOINT.SLOTS.CREATE, payload);
    return response.data?.data || response.data;
  },

  updateSlot: async (id: number, data: Partial<Slot>) => {
    const payload: any = {
      ...(data.startTime && { startTime: data.startTime.toISOString() }),
      ...(data.endTime && { endTime: data.endTime.toISOString() }),
      ...(data.recurrentType !== undefined && { recurrentType: data.recurrentType }),
      ...(data.recurrentUntil !== undefined && {
        recurrentUntil: data.recurrentUntil ? data.recurrentUntil.toISOString() : null,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };
    const response = await api.patch(API_ENDPOINT.SLOTS.UPDATE(id), payload);
    return response.data?.data || response.data;
  },

  deleteSlot: async (id: number) => {
    await api.delete(API_ENDPOINT.SLOTS.DELETE(id));
  },
};
