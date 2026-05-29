// src/features/admin/users/pages/UserDetail.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userAdminApi } from '../api/userApi';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { formatICTDateTime } from '@/shared/utils/date';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Wallet,
  Briefcase,
  Linkedin,
  Github,
  User,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { AdjustBalanceModal } from '@/features/admin/wallet/components/AdjustBalanceModal';

function unwrapUser(response: any) {
  return response?.data?.data;
}

export const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adjustOpen, setAdjustOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => userAdminApi.getOne(Number(id)),
    enabled: !!id,
  });

  const user = unwrapUser(response);

  const handleAdjustSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] });
  };

  if (isLoading) return <div className="p-6">Đang tải...</div>;
  if (!user) return <div className="p-6">Không tìm thấy người dùng</div>;

  const getInitials = (name: string) =>
    name
      ?.split(' ')
      .map((w) => w[0])
      .slice(-2)
      .join('')
      .toUpperCase() || '?';

  const displayValue = (value: any, unit?: string) => {
    if (value === null || value === undefined || value === '') return '—';
    if (unit === 'credits') return `${value.toLocaleString()} credits`;
    if (unit === 'years') return `${value} năm`;
    return value;
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Button variant="outline" onClick={() => navigate('/admin/users')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết người dùng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.name || 'Chưa có tên'}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className="mt-1">
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t pt-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Ngày tạo:</span>
              <span>{formatICTDateTime(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Số dư ví:</span>
              <span>{displayValue(user.creditBalance, 'credits')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAdjustOpen(true)}
                className="ml-auto"
              >
                Điều chỉnh
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Kinh nghiệm:</span>
              <span>{displayValue(user.experienceYears, 'years')}</span>
            </div>
            <div className="flex items-center gap-2 col-span-full">
              <Linkedin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">LinkedIn:</span>
              {user.linkedInLink ? (
                <a
                  href={user.linkedInLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {user.linkedInLink}
                </a>
              ) : (
                <span className="text-muted-foreground">Chưa cập nhật</span>
              )}
            </div>
            <div className="flex items-center gap-2 col-span-full">
              <Github className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">GitHub:</span>
              {user.githubLink ? (
                <a
                  href={user.githubLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-700 hover:underline"
                >
                  {user.githubLink}
                </a>
              ) : (
                <span className="text-muted-foreground">Chưa cập nhật</span>
              )}
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Bio:</p>
                <p className="text-sm text-muted-foreground mt-1">{user.bio || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>

          {user.status === 'BANNED' && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Tài khoản bị khóa</p>
                  <p className="text-sm mt-1">
                    <strong>Lý do:</strong> {user.banReason || 'Không có lý do'}
                  </p>
                  {user.bannedUntil && (
                    <p className="text-sm mt-1">
                      <strong>Hết hạn:</strong> {formatICTDateTime(user.bannedUntil)}
                    </p>
                  )}
                  {!user.bannedUntil && (
                    <p className="text-sm mt-1 text-red-600 font-medium">Khóa vĩnh viễn</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AdjustBalanceModal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        userId={user.id}
        userName={user.name}
        currentBalance={user.creditBalance}
        onSuccess={handleAdjustSuccess}
      />
    </div>
  );
};
