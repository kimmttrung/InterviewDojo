// features/bookmarks/stores/useBookmarkStore.ts
import { create } from 'zustand';
import { BookmarkFilters } from '../types/bookmark.types';

interface BookmarkState {
  filters: BookmarkFilters;
  setFilters: (filters: Partial<BookmarkFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: BookmarkFilters = {
  page: 1,
  search: '',
  difficulty: undefined,
  categoryIds: [],
  startDate: undefined,
  endDate: undefined,
};

export const useBookmarkStore = create<BookmarkState>((set) => ({
  filters: defaultFilters,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
