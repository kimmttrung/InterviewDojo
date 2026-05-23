// src/features/users/stores/userProfileModalStore.ts
import { create } from 'zustand';

interface UserProfileModalState {
  isOpen: boolean;
  userId: number | null;
  openModal: (userId: number) => void;
  closeModal: () => void;
}

export const useUserProfileModalStore = create<UserProfileModalState>((set) => ({
  isOpen: false,
  userId: null,
  openModal: (userId) => set({ isOpen: true, userId }),
  closeModal: () => set({ isOpen: false, userId: null }),
}));
