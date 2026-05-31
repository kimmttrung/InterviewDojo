// src/shared/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Refresh queue ────────────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

/**
 * Thay vì window.location.href (hard reload, mất state),
 * dùng CustomEvent để React Router navigate mà không reload trang.
 * Login.tsx lắng nghe event này và hiện modal hoặc redirect.
 */
const forceLogout = (reason?: string) => {
  useAuthStore.getState().clearAuth();

  // Phát event — Login.tsx và App.tsx có thể lắng nghe
  window.dispatchEvent(
    new CustomEvent('auth:force-logout', {
      detail: { reason: reason ?? 'session_expired' },
    }),
  );
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const isAuthUrl = (url?: string) =>
  url?.includes(API_ENDPOINT.AUTH.LOGIN) ||
  url?.includes(API_ENDPOINT.AUTH.REGISTER) ||
  url?.includes(API_ENDPOINT.AUTH.REFRESH);

const isBanResponse = (data: Record<string, unknown> | undefined): boolean => {
  if (!data) return false;
  // Shape 1: AllExceptionsFilter → { data: { error: 'ACCOUNT_BANNED' } }
  if ((data['data'] as Record<string, unknown>)?.['error'] === 'ACCOUNT_BANNED') return true;
  // Shape 2: NestJS default → { message: { error: 'ACCOUNT_BANNED' } }
  if ((data['message'] as Record<string, unknown>)?.['error'] === 'ACCOUNT_BANNED') return true;
  // Shape 3: flat → { error: 'ACCOUNT_BANNED' }
  if (data['error'] === 'ACCOUNT_BANNED') return true;
  return false;
};

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;
    const responseData = error.response?.data as Record<string, unknown> | undefined;

    // ── 403 ACCOUNT_BANNED (chỉ non-auth endpoints) ───────────────────────────
    // Auth endpoints (login/register) tự handle ở component, không intercept ở đây
    if (status === 403 && !isAuthUrl(originalRequest?.url)) {
      if (isBanResponse(responseData)) {
        processQueue(error, null);
        forceLogout('banned');
        return Promise.reject(error);
      }
    }

    // ── 401: thử refresh ──────────────────────────────────────────────────────
    if (status === 401 && !originalRequest._retry && !isAuthUrl(originalRequest?.url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) {
        processQueue(error, null);
        forceLogout();
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await api.post(API_ENDPOINT.AUTH.REFRESH, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

        useAuthStore.getState().setAuth({ accessToken, refreshToken: newRefreshToken });
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        const refreshErr = refreshError as AxiosError;
        processQueue(refreshError, null);

        if (refreshErr.response?.status === 403) {
          forceLogout('banned');
        } else {
          forceLogout();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export { api };
