// src/features/admin/coaching-categories/pages/CoachingCategoryList.tsx
import { useState } from 'react';
import {
  useCoachingCategories,
  useCreateCoachingCategory,
  useUpdateCoachingCategory,
  useDeleteCoachingCategory,
} from '../hooks/useCoachingCategories';
import { CoachingCategoryForm } from '../components/CoachingCategoryForm';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/shared/components/ui/table';
import { formatICTDateTime } from '@/shared/utils/date';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { CoachingCategory, CreateCoachingCategoryDto } from '../types/coaching-category.types';

export const CoachingCategoryList = () => {
  const { data: categories = [], isLoading } = useCoachingCategories();
  const createMutation = useCreateCoachingCategory();
  const updateMutation = useUpdateCoachingCategory();
  const deleteMutation = useDeleteCoachingCategory();
  const [search, setSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<CoachingCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = categories.filter(
    (c: CoachingCategory) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = (data: CreateCoachingCategoryDto) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
        setEditingCategory(null);
      },
    });
  };

  const handleUpdate = (data: any) => {
    if (!editingCategory) return;
    updateMutation.mutate(
      {
        id: editingCategory.id,
        data: { slug: data.slug, name: data.name, description: data.description },
      },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingCategory(null);
        },
      },
    );
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  if (isLoading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý danh mục Coaching</h1>
          <p className="text-sm text-muted-foreground">Thêm, sửa, xóa danh mục cho gói coaching</p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Thêm danh mục
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên hoặc slug..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Số gói</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.id}</TableCell>
                  <TableCell className="font-mono text-xs">{cat.slug}</TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{cat.description || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cat._count?.plans ?? 0}</Badge>
                  </TableCell>
                  <TableCell>{cat.createdAt ? formatICTDateTime(cat.createdAt) : '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CoachingCategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingCategory={editingCategory}
        onSuccess={editingCategory ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p>
            Bạn có chắc muốn xóa danh mục này? Các gói coaching liên quan sẽ không bị xóa nhưng sẽ
            mất danh mục.
          </p>
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
