import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useQuestions } from '../hooks/useQuestions';
import { useQuestionsFilters } from '@/stores/questionFilters.store';

export function QuestionPagination() {
  const { page, limit, keyword, difficulty, type, setPage } = useQuestionsFilters();
  const { data } = useQuestions({ page, limit, keyword, difficulty, type });
  const totalPages = data?.meta.totalPages || 0;

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 pt-10 pb-20">
      <Button
        variant="outline"
        size="icon"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="rounded-lg"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {pages.map((p) => (
        <Button
          key={p}
          variant={page === p ? 'default' : 'ghost'}
          onClick={() => setPage(p)}
          className={`rounded-lg w-10 h-10 ${
            page === p ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-slate-600'
          }`}
        >
          {p}
        </Button>
      ))}

      <Button
        variant="outline"
        size="icon"
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        className="rounded-lg"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
