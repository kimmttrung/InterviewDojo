import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../shared/components/ui/table';

import { Plus, Search, Edit2, Trash2, Eye, Code, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Hoặc thư viện thông báo bạn đang dùng
import { Button } from '../../../../shared/components/ui/button';
import { Input } from '../../../../shared/components/ui/input';
import { Badge } from '../../../../shared/components/ui/badge';
import { questionService } from '../../../shared-domain/question-bank/services/question.service';
import AdminLayout from '../../dashboard/components/AdminLayout';
import { Card } from '../../../../shared/components/ui/card';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1 });

  // 1. Hàm lấy dữ liệu từ API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await questionService.getAll({
        keyword: searchTerm,
        limit: 10,
        page: 1,
      });
      // res.data ở đây là mảng questions từ Backend của bạn
      setQuestions(res.data.data);
      setMeta(res.data.meta);
      console.log('check res question', res);
    } catch (error) {
      toast.error('Không thể tải danh sách câu hỏi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Gọi fetch khi component mount hoặc khi search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchQuestions();
    }, 500); // Debounce 500ms để tránh gọi API liên tục khi gõ phím

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // 3. Hàm xóa câu hỏi
  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      try {
        await questionService.delete(id);
        toast.success('Xóa thành công');
        fetchQuestions(); // Reload lại danh sách
      } catch (error) {
        toast.error('Xóa thất bại');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quản lý câu hỏi ({meta.total})</h1>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm mới
          </Button>
        </div>

        <Card className="p-4">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm câu hỏi..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Độ khó</TableHead>
                  <TableHead>Công ty</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : questions.length > 0 ? (
                  questions.map((q: any) => (
                    <TableRow key={q.id}>
                      <TableCell>#{q.id}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="font-medium truncate">{q.title}</div>
                        <div className="text-xs text-muted-foreground">{q.slug}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex w-fit items-center gap-1">
                          {q.typeQuestion === 'CODE' ? (
                            <Code className="w-3 h-3 text-blue-500" />
                          ) : (
                            <FileText className="w-3 h-3 text-green-500" />
                          )}
                          {q.typeQuestion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            q.difficulty === 'EASY'
                              ? 'bg-green-500'
                              : q.difficulty === 'MEDIUM'
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                          }
                        >
                          {q.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {q.companies?.map((c: string) => (
                            <span
                              key={c}
                              className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(q.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Không tìm thấy câu hỏi nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
