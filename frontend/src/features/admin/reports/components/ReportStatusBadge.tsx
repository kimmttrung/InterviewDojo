import { Badge } from '@/shared/components/ui/badge';

const statusConfig = {
  PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
  RESOLVED: { label: 'Đã giải quyết', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-800' },
};

export const ReportStatusBadge = ({ status }: { status: keyof typeof statusConfig }) => {
  const cfg = statusConfig[status] || statusConfig.PENDING;
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
};
