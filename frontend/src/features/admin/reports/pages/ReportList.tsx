import { useState } from 'react';
import { useReports } from '../hooks/useReports';
import { ReportStatusBadge } from '../components/ReportStatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/shared/components/ui/table';
import { formatICTDateTime } from '@/shared/utils/date';
import { Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/use-debounce';

const REPORT_TYPE_LABEL: Record<string, string> = {
  HARASSMENT: 'Quấy rối',
  SCAM: 'Lừa đảo',
  FAKE_PROFILE: 'Hồ sơ giả',
  NO_SHOW: 'Vắng mặt',
  CHEATING: 'Gian lận',
  PAYMENT_OUTSIDE: 'Thanh toán ngoài',
  WRONG_ANSWER: 'Đáp án sai',
  INAPPROPRIATE_CONTENT: 'Nội dung không phù hợp',
  DUPLICATE: 'Trùng lặp',
  OTHER_QUESTION: 'Khác',
};

export const ReportList = () => {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const navigate = useNavigate();

  const { data: reports = [], isLoading } = useReports({
    page,
    limit: 10,
    status: status !== 'ALL' ? status : undefined,
  });

  const filtered = reports.filter(
    (r) =>
      r.reporterName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      r.targetUserName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      r.reason.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý báo cáo</h1>
        <p className="text-muted-foreground">Xem và xử lý báo cáo từ người dùng</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo người báo cáo, bị report, nội dung..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="PENDING">Chờ xử lý</TabsTrigger>
          <TabsTrigger value="RESOLVED">Đã giải quyết</TabsTrigger>
          <TabsTrigger value="REJECTED">Từ chối</TabsTrigger>
          <TabsTrigger value="ALL">Tất cả</TabsTrigger>
        </TabsList>
        <TabsContent value={status} className="mt-4">
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Người báo cáo</TableHead>
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.reporterName}</TableCell>
                      <TableCell>
                        {r.targetUserName || r.snapshotQuestionTitle || r.targetType}
                      </TableCell>
                      <TableCell className="text-xs">
                        {REPORT_TYPE_LABEL[r.type] || r.type}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{r.reason}</TableCell>
                      <TableCell>
                        <ReportStatusBadge status={r.status} />
                      </TableCell>
                      <TableCell>{formatICTDateTime(r.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/reports/${r.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
