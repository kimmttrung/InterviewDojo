// src/hooks/use-question-filters.ts
import { useState, useEffect } from 'react';
import { useDebounce } from './use-debounce';
import { questionService } from '../features/shared-domain/question-bank/services/question.service';

export function useQuestionFilters(initialType?: string) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [difficulty, setDifficulty] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>(initialType);
  const [page, setPage] = useState(1);
  const debouncedKeyword = useDebounce(keyword, 500);

  const load = async () => {
    setLoading(true);
    const res = await questionService.getAll({
      page,
      keyword: debouncedKeyword,
      difficulty,
      type,
      limit: 10,
    });
    setQuestions(res.data?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [page, debouncedKeyword, difficulty, type]);

  return { questions, loading, setKeyword, setDifficulty, setType, setPage, page };
}
