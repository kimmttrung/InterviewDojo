export enum SessionTab {
  ALL = 'ALL',
  UPCOMING = 'UPCOMING',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  FINISHED = 'FINISHED',
}

export interface SessionFilters {
  tab: SessionTab;
  search: string;
  startDate: string | null;
  endDate: string | null;
  page: number;
}

// Chỉ giữ lại MỘT interface SessionItem (phiên bản mới nhất đã làm phẳng dữ liệu)
export interface SessionItem {
  id: string | number;
  type: string; // 'MENTOR', 'P2P', 'SOLO'
  status: string; // 'PENDING', 'UPCOMING', 'REJECTED', 'FINISHED'

  // Thông tin đối tác (đã được làm phẳng)
  opponentId?: number | null;
  opponentName: string | null;
  opponentAvatar: string | null;

  // Thông tin phiên học
  coachingPlan: string | null;
  scheduledAt: string | null;
  createdAt: string;
  meetingLink: string | null;
  recordingUrl: string | null;

  // Các trạng thái khác
  rejectedReason: string | null;
  hasFeedback: boolean;

  // Optional: nếu có dùng cho Solo/AI
  candidateAnswers?: string;
}

// Lưu ý: Đổi totalItems thành total để khớp với meta mà Backend đang trả về
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number; // Sửa thành total (hoặc thêm totalItems tùy BE của bạn)
    totalPages: number;
  };
}
