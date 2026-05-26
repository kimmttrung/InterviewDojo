// src/features/admin/questions/pages/QuestionList.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminQuestions, useDeleteQuestion } from '../hooks/useAdminQuestions';
import { QuestionFilterBar } from '../components/QuestionFilterBar';
import { QuestionTable } from '../components/QuestionTable';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

export const QuestionList = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const navigate = useNavigate();

  const { data, isLoading } = useAdminQuestions({
    page,
    limit: 10,
    keyword: debouncedSearch,
    type: typeFilter || undefined,
    difficulty: difficultyFilter || undefined,
  });
  const deleteMutation = useDeleteQuestion();

  const questions = data?.items || [];
  const totalPages = data?.meta?.totalPages || 1;

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý câu hỏi</h1>
          <p className="text-muted-foreground">Thêm, sửa, xóa câu hỏi luyện tập</p>
        </div>
        <Button onClick={() => navigate('/admin/questions/new')}>
          <Plus className="h-4 w-4 mr-2" /> Thêm câu hỏi
        </Button>
      </div>

      <QuestionFilterBar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        difficultyFilter={difficultyFilter}
        onDifficultyFilterChange={setDifficultyFilter}
      />

      <QuestionTable questions={questions} onDelete={setDeleteId} isLoading={isLoading} />

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p>Bạn có chắc muốn xóa câu hỏi này? Hành động không thể hoàn tác.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
