// features/bookmarks/types/bookmark.types.ts
export interface BookmarkedQuestion {
  id: number;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: string;
  categories: { id: number; name: string }[];
  bookmarkedAt: string;
}

export interface BookmarkFilters {
  page: number;
  search: string;
  difficulty?: string;
  categoryIds?: number[];
  startDate?: string;
  endDate?: string;
}
