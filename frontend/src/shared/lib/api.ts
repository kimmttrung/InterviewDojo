import axios from 'axios';
import { useAuthStore } from '../../stores/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Xử lý refresh token hoặc logout nếu 401 (sẽ bổ sung sau)
    return Promise.reject(error);
  },
);

export { api };
