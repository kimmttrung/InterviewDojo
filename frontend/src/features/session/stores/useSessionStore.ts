import { create } from 'zustand';
import { SessionFilters, SessionTab } from '../types/session.types';

// Khai báo cấu trúc State cho toàn bộ Session
interface SessionState {
  // --- 1. Quản lý Filters (Tìm kiếm, Tabs, Ngày tháng, Phân trang) ---
  filters: SessionFilters;
  setFilters: (filters: Partial<SessionFilters>) => void;

  // --- 2. Quản lý Modal Huỷ lịch ---
  cancelModalData: { isOpen: boolean; sessionId: string | null };
  openCancelModal: (sessionId: string) => void;
  closeCancelModal: () => void;

  // --- 3. Quản lý Modal Xem hồ sơ (Profile) ---
  profileModalUserId: number | null;
  openProfileModal: (userId: number) => void;
  closeProfileModal: () => void;

  // --- 4. Quản lý Modal Xem lý do từ chối (Reject Reason) ---
  rejectModalData: { isOpen: boolean; reason: string | null };
  openRejectModal: (reason: string | null) => void;
  closeRejectModal: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  // ==========================================
  // KHỞI TẠO GIÁ TRỊ VÀ LOGIC CHO TỪNG STATE
  // ==========================================

  // 1. Khởi tạo Filters
  filters: {
    tab: SessionTab.ALL,
    search: '',
    startDate: null,
    endDate: null,
    page: 1,
  },
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
    })), // Tự động reset page về 1 mỗi khi đổi filter

  // 2. Khởi tạo Cancel Modal
  cancelModalData: { isOpen: false, sessionId: null },
  openCancelModal: (sessionId) => set({ cancelModalData: { isOpen: true, sessionId } }),
  closeCancelModal: () => set({ cancelModalData: { isOpen: false, sessionId: null } }),

  // 3. Khởi tạo Profile Modal
  profileModalUserId: null,
  openProfileModal: (userId) => set({ profileModalUserId: userId }),
  closeProfileModal: () => set({ profileModalUserId: null }),

  // 4. Khởi tạo Reject Modal (Fix lỗi cho RejectReasonModal.tsx)
  rejectModalData: { isOpen: false, reason: null },
  openRejectModal: (reason) => set({ rejectModalData: { isOpen: true, reason } }),
  closeRejectModal: () => set({ rejectModalData: { isOpen: false, reason: null } }),
}));
