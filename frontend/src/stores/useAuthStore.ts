import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: number | null;
  isAuthenticated: boolean;
  setAuth: (payload: { accessToken: string; refreshToken: string; userId: number }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      isAuthenticated: false,
      setAuth: ({ accessToken, refreshToken, userId }) =>
        set({ accessToken, refreshToken, userId, isAuthenticated: true }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, userId: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
