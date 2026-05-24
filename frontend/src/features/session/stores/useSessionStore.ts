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

  // --- 5. (Tùy chọn) Quản lý Modal Feedback đã nhận (Received Feedback) ---
  feedbackModalData: { isOpen: boolean; sessionId: number | null };
  openFeedbackModal: (sessionId: number) => void;
  closeFeedbackModal: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  // ==========================================
  // KHỞI TẠO GIÁ TRỊ VÀ LOGIC CHO TỪNG STATE
  // ==========================================

  // 1. Khởi tạo Filters
  filters: {
    // SỬA Ở ĐÂY: Chuyển tab mặc định thành UPCOMING để khi vừa vào trang
    // sẽ load ngay lịch sắp diễn ra thay vì tab ALL
    tab: SessionTab.UPCOMING,
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

  // 4. Khởi tạo Reject Modal
  rejectModalData: { isOpen: false, reason: null },
  openRejectModal: (reason) => set({ rejectModalData: { isOpen: true, reason } }),
  closeRejectModal: () => set({ rejectModalData: { isOpen: false, reason: null } }),

  // 5. Khởi tạo Feedback Modal
  feedbackModalData: { isOpen: false, sessionId: null },
  openFeedbackModal: (sessionId) => set({ feedbackModalData: { isOpen: true, sessionId } }),
  closeFeedbackModal: () => set({ feedbackModalData: { isOpen: false, sessionId: null } }),
}));
