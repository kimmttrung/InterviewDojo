import { api } from '../../../../shared/lib/api';
import { Slot, SlotStatus } from '../types';
import { API_ENDPOINT } from '../../../../shared/lib/endpoints';

export const scheduleService = {
  getSlots: async (mentorId: number) => {
    const response = await api.get(API_ENDPOINT.SLOTS.GET_ALL, {
      params: { mentorId },
    });
    return response.data?.data || response.data;
  },

  createSlot: async (data: Omit<Slot, 'id'>) => {
    const payload = {
      startTime: data.startTime.toISOString(),
      endTime: data.endTime.toISOString(),
      status: SlotStatus.AVAILABLE,
    };

    const response = await api.post(API_ENDPOINT.SLOTS.CREATE, payload);
    return response.data?.data || response.data;
  },

  updateSlot: async (id: number, data: Partial<Slot>) => {
    const payload = {
      ...data,
      ...(data.startTime && { startTime: data.startTime.toISOString() }),
      ...(data.endTime && { endTime: data.endTime.toISOString() }),
    };

    const response = await api.patch(API_ENDPOINT.SLOTS.UPDATE(id), payload);
    return response.data?.data || response.data;
  },

  deleteSlot: async (id: number) => {
    await api.delete(API_ENDPOINT.SLOTS.DELETE(id));
  },
};
