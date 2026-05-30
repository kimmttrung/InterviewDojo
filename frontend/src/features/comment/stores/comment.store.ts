import { create } from 'zustand';

interface CommentUIState {
  replyingToId: number | null;
  editingId: number | null;
  setReplyingTo: (id: number | null) => void;
  setEditingId: (id: number | null) => void;
}

export const useCommentUIStore = create<CommentUIState>((set) => ({
  replyingToId: null,
  editingId: null,
  setReplyingTo: (id) => set({ replyingToId: id, editingId: null }),
  setEditingId: (id) => set({ editingId: id, replyingToId: null }),
}));
