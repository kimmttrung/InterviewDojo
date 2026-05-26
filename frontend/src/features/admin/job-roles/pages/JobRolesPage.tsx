// features/admin/job-roles/pages/JobRolesPage.tsx
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Plus, Search, Edit2, Trash2, Loader2, Briefcase } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import {
  useJobRoles,
  useCreateJobRole,
  useUpdateJobRole,
  useDeleteJobRole,
} from '../hooks/useJobRoles';

export default function JobRolesPage() {
  const { data: roles = [], isLoading } = useJobRoles();
  const createMutation = useCreateJobRole();
  const updateMutation = useUpdateJobRole();
  const deleteMutation = useDeleteJobRole();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (role: any) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredRoles = roles.filter((r: any) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý vai trò công việc</h1>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" /> Thêm vai trò
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm vai trò..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Tên vai trò</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right w-[120px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <Loader2 className="animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredRoles.length > 0 ? (
              filteredRoles.map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground">{role.description || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(role)}>
                        <Edit2 className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Không tìm thấy vai trò nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Cập nhật vai trò' : 'Thêm vai trò mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Tên vai trò</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Backend Developer..."
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Mô tả</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả vai trò..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {editingRole ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
