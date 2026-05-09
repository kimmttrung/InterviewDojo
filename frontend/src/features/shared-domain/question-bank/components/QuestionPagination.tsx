import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '../types';
import { Button } from '../../../../shared/components/ui/button';

interface QuestionPaginationProps {
  meta: PaginationMeta | null;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function QuestionPagination({ meta, currentPage, onPageChange }: QuestionPaginationProps) {
  if (!meta || meta.totalPages <= 1) return null;

  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 pt-10 pb-20">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-lg"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {pages.map((p) => (
        <Button
          key={p}
          variant={currentPage === p ? 'default' : 'ghost'}
          onClick={() => onPageChange(p)}
          className={`rounded-lg w-10 h-10 ${currentPage === p ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-slate-600'}`}
        >
          {p}
        </Button>
      ))}

      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === meta.totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-lg"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
