import { useState, useEffect } from 'react';
import { categoryService } from '../services/category.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../shared/components/ui/table';
import { Button } from '../../../../shared/components/ui/button';
import { Input } from '../../../../shared/components/ui/input';
import { Textarea } from '../../../../shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../shared/components/ui/dialog';
import { Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '../../dashboard/components/AdminLayout';
import { Card } from '../../../../shared/components/ui/card';

export default function CategoriesPage() {
  // --- States ---
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // --- Fetch Data ---
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getAll();
      setCategories(res.data.data);
    } catch (error) {
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- Logic Xử lý Tách riêng ---

  // 1. Hàm khởi tạo cho Create
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  // 2. Hàm khởi tạo cho Update
  const handleOpenEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setIsDialogOpen(true);
  };

  // 3. API Create riêng biệt
  const processCreate = async () => {
    if (!formData.name.trim()) return toast.error('Tên danh mục là bắt buộc');

    try {
      setSubmitting(true);
      await categoryService.create(formData);
      toast.success('Tạo danh mục mới thành công');
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo mới');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. API Update riêng biệt
  const processUpdate = async () => {
    if (!editingCategory) return;
    if (!formData.name.trim()) return toast.error('Tên danh mục không được để trống');

    try {
      setSubmitting(true);
      await categoryService.update(editingCategory.id, formData);
      toast.success('Cập nhật thông tin thành công');
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. API Delete
  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        await categoryService.delete(id);
        toast.success('Xóa danh mục thành công');
        fetchCategories();
      } catch (error) {
        toast.error('Xóa thất bại');
      }
    }
  };

  // --- Filter ---
  const filteredCategories = categories.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm mới
          </Button>
        </div>

        {/* Search & Table */}
        <Card className="p-4">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm danh mục..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-md border text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Tên danh mục</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-right w-[120px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10">
                      <Loader2 className="animate-spin mx-auto w-6 h-6 text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length > 0 ? (
                  filteredCategories.map((cat: any) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {cat.description || <em className="text-xs">Chưa có mô tả</em>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(cat)}
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4 text-amber-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cat.id)}
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                      Không tìm thấy danh mục nào phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Dialog Add/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tên danh mục</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Frontend, Backend, System Design..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Mô tả (không bắt buộc)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả cho danh mục này..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>

              {editingCategory ? (
                <Button
                  type="button"
                  onClick={processUpdate}
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Lưu thay đổi
                </Button>
              ) : (
                <Button type="button" onClick={processCreate} disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Tạo danh mục
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
