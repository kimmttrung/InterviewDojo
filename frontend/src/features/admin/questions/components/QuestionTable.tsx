// src/features/admin/questions/components/QuestionTable.tsx
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/shared/components/ui/table';
import { formatICTDateTime } from '@/shared/utils/date';
import { Edit, Trash2 } from 'lucide-react';

interface Question {
  id: number;
  title: string;
  questionType: string;
  difficulty: string;
  isPublished: boolean;
  categories: string[];
  createdAt: string;
}

interface QuestionTableProps {
  questions: Question[];
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

// Distinct, accessible color classes for each difficulty
const difficultyStyles: Record<string, string> = {
  EASY: 'bg-green-100 text-green-800 border border-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  HARD: 'bg-red-100 text-red-800 border border-red-300',
};

const typeStyles: Record<string, string> = {
  TECHNICAL: 'bg-blue-100 text-blue-800 border border-blue-200',
  SYSTEM_DESIGN: 'bg-purple-100 text-purple-800 border border-purple-200',
  BEHAVIORAL: 'bg-orange-100 text-orange-800 border border-orange-200',
  CODING: 'bg-teal-100 text-teal-800 border border-teal-200',
};

export const QuestionTable = ({ questions, onDelete, isLoading }: QuestionTableProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="text-center py-12 text-muted-foreground">Không có câu hỏi nào.</div>
      </div>
    );
  }

  return (
    // bg-card + explicit background so table never renders on transparent
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-14">ID</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead className="w-36">Loại</TableHead>
            <TableHead className="w-24">Độ khó</TableHead>
            <TableHead className="w-32">Trạng thái</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead className="w-36">Ngày tạo</TableHead>
            <TableHead className="text-right w-28">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((q) => (
            <TableRow key={q.id} className="bg-card hover:bg-muted/30 transition-colors">
              <TableCell className="text-muted-foreground text-sm">{q.id}</TableCell>
              <TableCell className="font-medium max-w-xs">
                <span className="line-clamp-2">{q.title}</span>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    typeStyles[q.questionType] ?? 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {q.questionType}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    difficultyStyles[q.difficulty] ??
                    'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {q.difficulty}
                </span>
              </TableCell>
              <TableCell>
                {q.isPublished ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Đã xuất bản
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                    Nháp
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                {q.categories?.join(', ') || '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatICTDateTime(q.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  {/* Eye → go to edit (no separate detail route exists) */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 bg-card"
                    onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={() => onDelete(q.id)}
                    title="Xóa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
