// features/auth/services/user.service.ts
import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

export const userService = {
  getMe: async () => {
    const res = await api.get(API_ENDPOINT.USER.GET_ME);
    console.log('1. user.service.ts ', res);
    return res.data.data; // user object
  },
  updateProfile: async (data: any) => {
    const res = await api.put(API_ENDPOINT.USER.UPDATE_ME, data);
    console.log('2. user.service.ts ', res);
    return res.data;
  },
  updateTargetRole: (data: { targetRoleId: number }) => {
    return api.patch(API_ENDPOINT.USER.UPDATE_TARGET_ROLE, data);
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(API_ENDPOINT.USER.AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data; // user đã cập nhật
  },
};
