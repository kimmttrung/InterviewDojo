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
import { Eye, Edit, Trash2 } from 'lucide-react';

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

export const QuestionTable = ({ questions, onDelete, isLoading }: QuestionTableProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!questions.length) {
    return <div className="text-center py-8 text-muted-foreground">Không có câu hỏi nào.</div>;
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Độ khó</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((q) => (
            <TableRow key={q.id}>
              <TableCell>{q.id}</TableCell>
              <TableCell className="font-medium">{q.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{q.questionType}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    q.difficulty === 'HARD'
                      ? 'destructive'
                      : q.difficulty === 'MEDIUM'
                        ? 'default'
                        : 'secondary'
                  }
                >
                  {q.difficulty}
                </Badge>
              </TableCell>
              <TableCell>
                {q.isPublished ? (
                  <Badge variant="default">Đã xuất bản</Badge>
                ) : (
                  <Badge variant="secondary">Nháp</Badge>
                )}
              </TableCell>
              <TableCell className="max-w-xs truncate">{q.categories?.join(', ') || '—'}</TableCell>
              <TableCell>{formatICTDateTime(q.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/questions/${q.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(q.id)}>
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
