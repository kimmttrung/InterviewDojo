export interface CommentUser {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface CommentItemType {
  id: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
  user: CommentUser;
  parentId?: number | null;
  replies?: CommentItemType[];
  likeCount?: number;
  isLiked?: boolean;
}

export interface GetCommentsParams {
  questionId: number;
  page?: number;
  limit?: number;
}

export interface CreateCommentPayload {
  questionId: number;
  content: string;
  parentId?: number | null;
}

export interface UpdateCommentPayload {
  commentId: number;
  content: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Thêm vào cuối file
export interface ReportCommentPayload {
  commentId: number;
  reason: string;
  evidenceUrls?: string[];
}
