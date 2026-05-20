import {
  Difficulty,
  QuestionType,
} from '@/features/shared-domain/question-bank/types/question.types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QuestionsFilters {
  page: number;
  limit: number;
  keyword: string;
  difficulty: Difficulty | undefined;
  type: QuestionType | undefined;
  setPage: (page: number) => void;
  setKeyword: (keyword: string) => void;
  setDifficulty: (diff: Difficulty | undefined) => void;
  setType: (type: QuestionType | undefined) => void;
  resetFilters: () => void;
}

export const useQuestionsFilters = create<QuestionsFilters>()(
  persist(
    (set) => ({
      page: 1,
      limit: 10,
      keyword: '',
      difficulty: undefined,
      type: undefined,
      setPage: (page) => set({ page }),
      setKeyword: (keyword) => set({ keyword, page: 1 }),
      setDifficulty: (difficulty) => set({ difficulty, page: 1 }),
      setType: (type) => set({ type, page: 1 }),
      resetFilters: () => set({ page: 1, keyword: '', difficulty: undefined, type: undefined }),
    }),
    { name: 'questions-filters' },
  ),
);
