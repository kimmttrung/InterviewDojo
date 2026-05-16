import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApprovalStatus } from '@/shared/types/enum';

export interface AuthUser {
  id: number;
  email?: string;
  role?: string;
  approvalStatus?: ApprovalStatus;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (payload: {
    accessToken: string;
    refreshToken: string;
    user?: AuthUser | null; // ← user là optional
  }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: ({ accessToken, refreshToken, user }) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          // // Chỉ cập nhật user nếu được truyền (kể cả null)
          // ...(user !== undefined ? { user } : {}),
          user: user ?? null,
        }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
