import { useState, useEffect } from 'react';
import { companyService } from '../services/company.service';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../shared/components/ui/dialog';
import { Plus, Search, Edit2, Trash2, Loader2, Building2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '../../dashboard/components/AdminLayout';
import { Card } from '../../../../shared/components/ui/card';

export default function CompaniesPage() {
  // --- States ---
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', logoUrl: '' });
  const [submitting, setSubmitting] = useState(false);

  // --- Fetch Data ---
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await companyService.getAll();
      // res.data.data dựa trên cấu trúc backend của bạn
      setCompanies(res.data.data || []);
    } catch (error) {
      toast.error('Không thể tải danh sách công ty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // --- Logic Handlers ---

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setFormData({ name: '', logoUrl: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (company: any) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      logoUrl: company.logoUrl || '',
    });
    setIsDialogOpen(true);
  };

  const processCreate = async () => {
    if (!formData.name.trim()) return toast.error('Tên công ty là bắt buộc');

    try {
      setSubmitting(true);
      await companyService.create(formData);
      toast.success('Thêm công ty thành công');
      setIsDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo mới');
    } finally {
      setSubmitting(false);
    }
  };

  const processUpdate = async () => {
    if (!editingCompany) return;
    if (!formData.name.trim()) return toast.error('Tên công ty không được để trống');

    try {
      setSubmitting(true);
      await companyService.update(editingCompany.id, formData);
      toast.success('Cập nhật công ty thành công');
      setIsDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công ty này?')) {
      try {
        await companyService.delete(id);
        toast.success('Xóa công ty thành công');
        fetchCompanies();
      } catch (error) {
        toast.error('Xóa thất bại');
      }
    }
  };

  const filteredCompanies = companies.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quản lý công ty</h1>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm công ty
          </Button>
        </div>

        {/* Search & Table */}
        <Card className="p-4">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm công ty..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-md border text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Logo</TableHead>
                  <TableHead>Tên công ty</TableHead>
                  <TableHead>URL Logo</TableHead>
                  <TableHead className="text-right w-[120px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <Loader2 className="animate-spin mx-auto w-6 h-6 text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredCompanies.length > 0 ? (
                  filteredCompanies.map((comp: any) => (
                    <TableRow key={comp.id}>
                      <TableCell>
                        {comp.logoUrl ? (
                          <img
                            src={comp.logoUrl}
                            alt={comp.name}
                            className="w-8 h-8 rounded object-contain border bg-white"
                            onError={(e) => {
                              (e.target as any).src = 'https://placehold.co/100x100?text=No+Logo';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center border">
                            <Building2 className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{comp.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate">
                        {comp.logoUrl || <span className="text-xs italic">Chưa cập nhật</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(comp)}>
                            <Edit2 className="w-4 h-4 text-amber-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(comp.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      Không tìm thấy công ty nào.
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
              <DialogTitle>{editingCompany ? 'Cập nhật công ty' : 'Thêm công ty mới'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tên công ty</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Google, Facebook, FPT..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">URL Logo (Link ảnh)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-10"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Bạn có thể dùng link ảnh từ Google hoặc CDN.
                </p>
              </div>

              {/* Preview Logo */}
              {formData.logoUrl && (
                <div className="mt-2 p-2 border rounded-md flex items-center justify-center bg-slate-50">
                  <img
                    src={formData.logoUrl}
                    alt="Preview"
                    className="max-h-20 object-contain"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                onClick={editingCompany ? processUpdate : processCreate}
                disabled={submitting}
                className={editingCompany ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingCompany ? 'Lưu thay đổi' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
