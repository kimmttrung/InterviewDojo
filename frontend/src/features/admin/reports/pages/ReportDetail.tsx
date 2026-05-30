import { useParams, useNavigate } from 'react-router-dom';
import { useReportDetail, useUpdateReportStatus } from '../hooks/useReports';
import { ReportStatusBadge } from '../components/ReportStatusBadge';
import { EvidenceGallery } from '../components/EvidenceGallery';
import { UpdateStatusDialog } from '../components/UpdateStatusDialog';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatICTDateTime } from '@/shared/utils/date';
import { ArrowLeft, Trash2, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/shared/lib/api';
import { showToast } from '@/shared/lib/toast';
import { useQueryClient } from '@tanstack/react-query';

const REPORT_TYPE_LABEL: Record<string, string> = {
  HARASSMENT: 'Quấy rối',
  SCAM: 'Lừa đảo',
  FAKE_PROFILE: 'Hồ sơ giả',
  NO_SHOW: 'Vắng mặt',
  CHEATING: 'Gian lận',
  PAYMENT_OUTSIDE: 'Thanh toán ngoài',
  ROOM_CREATION_FAILED: 'Tạo phòng thất bại',
  PAYMENT_ERROR: 'Lỗi thanh toán',
  MATCHING_ERROR: 'Lỗi ghép đôi',
  OTHER_SYSTEM: 'Lỗi hệ thống khác',
  WRONG_ANSWER: 'Đáp án sai',
  INAPPROPRIATE_CONTENT: 'Nội dung không phù hợp',
  DUPLICATE: 'Trùng lặp',
  OTHER_QUESTION: 'Khác',
  SPAM: 'Spam/Quảng cáo',
  HATE_SPEECH: 'Ngôn từ thù ghét',
  HARASSMENT_COMMENT: 'Công kích cá nhân',
};

export const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: report, isLoading } = useReportDetail(Number(id));
  const updateMutation = useUpdateReportStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const queryClient = useQueryClient();
  if (isLoading) return <div>Đang tải...</div>;
  if (!report) return <div>Không tìm thấy report</div>;

  const handleUpdate = (data: { status: 'RESOLVED' | 'REJECTED'; adminNote?: string }) => {
    updateMutation.mutate({ id: Number(id), data });
  };

  const handleDeleteComment = async () => {
    if (!report.targetCommentId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này khỏi hệ thống?')) return;

    try {
      setIsDeletingComment(true);
      await api.delete(`/comments/${report.targetCommentId}`);
      showToast.success('Đã xóa bình luận thành công!');

      // Tự động chuyển report này sang trạng thái Đã giải quyết
      handleUpdate({ status: 'RESOLVED', adminNote: 'Đã xóa bình luận vi phạm.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'reportDetail', Number(id)] });
    } catch (error) {
      showToast.error('Không thể xóa bình luận. Vui lòng kiểm tra quyền Admin.');
    } finally {
      setIsDeletingComment(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Button variant="outline" onClick={() => navigate('/admin/reports')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết báo cáo #{report.id}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <ReportStatusBadge status={report.status} />
            <span className="text-sm text-muted-foreground">
              {formatICTDateTime(report.createdAt)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <strong>Người báo cáo:</strong> {report.reporterName}
            </div>
            <div>
              <strong>Đối tượng:</strong>{' '}
              {report.targetUserName || report.snapshotQuestionTitle || report.targetType}
            </div>
            <div>
              <strong>Loại vi phạm:</strong> {REPORT_TYPE_LABEL[report.type] || report.type}
            </div>
            <div>
              <strong>Lý do:</strong> {report.reason}
            </div>
          </div>
          {/* KHU VỰC HIỂN THỊ NỘI DUNG COMMENT NẾU TARGET LÀ COMMENT */}
          {report.targetType === 'COMMENT' && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl">
              <strong className="text-rose-800 flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4" /> Nội dung bình luận bị báo cáo:
              </strong>
              <p className="text-slate-800 italic bg-white p-3 rounded border border-rose-100 shadow-sm">
                "{report.targetCommentContent}"
              </p>

              {report.status === 'PENDING' && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteComment}
                    disabled={isDeletingComment}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeletingComment ? 'Đang xóa...' : 'Xóa bình luận vi phạm'}
                  </Button>
                </div>
              )}
            </div>
          )}
          {report.evidenceUrls?.length > 0 && (
            <div>
              <strong>Bằng chứng:</strong>
              <EvidenceGallery urls={report.evidenceUrls} />
            </div>
          )}
          {report.adminNote && (
            <div className="bg-muted p-3 rounded-lg">
              <strong>Ghi chú xử lý:</strong>
              <p className="text-sm mt-1">{report.adminNote}</p>
            </div>
          )}
          {report.status === 'PENDING' && (
            <Button onClick={() => setDialogOpen(true)} className="mt-2">
              Xử lý report
            </Button>
          )}
        </CardContent>
      </Card>
      <UpdateStatusDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
};
