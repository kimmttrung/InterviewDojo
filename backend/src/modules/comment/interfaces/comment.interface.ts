export interface CommentUser {
  id: number;
  name: string | null;
  avatarUrl: string | null;
}

export interface CommentItem {
  id: number;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  user: CommentUser;
  replies?: CommentItem[]; // Chỉ dành cho parent comment
}
