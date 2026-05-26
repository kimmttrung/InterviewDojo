// features/mentor/bookings/pages/MentorBookings.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Eye, Loader2, User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { MentorLayout } from '../../dashboard/components/MentorLayout';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import ApprovalGuard from '@/shared/components/layout/ApprovalGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMentorProfile } from '../../profile-management/hooks/useMentorProfile';
import {
  useMentorBookings,
  useAcceptBooking,
  useRejectBooking,
  useBookingDetail,
} from '../hooks/useMentorBookings';
import { Booking } from '../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { bookingService } from '../services/booking.service';
import { UserAvatar } from '@/features/shared-domain/users/components/UserAvatar';

const getStatusUI = (status: Booking['status']) => {
  switch (status) {
    case 'PENDING_ACCEPTANCE':
      return {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: <Clock className="w-3 h-3 mr-1" />,
        actionable: true,
      };
    case 'ACCEPTED':
      return {
        label: 'Accepted',
        className: 'bg-green-100 text-green-700 border-green-300',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        actionable: false,
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'bg-red-100 text-red-700 border-red-300',
        icon: <XCircle className="w-3 h-3 mr-1" />,
        actionable: false,
      };
    case 'PENDING_PAYMENT':
      return {
        label: 'Waiting for payment',
        className: 'bg-blue-100 text-blue-700 border-blue-300',
        icon: <Clock className="w-3 h-3 mr-1" />,
        actionable: false,
      };
    default:
      return { label: status, className: '', icon: null, actionable: false };
  }
};

const formatDateTime = (dateStr: string) => {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi });
};

export default function MentorBookings() {
  const [searchParams] = useSearchParams();
  const { data: mentorProfile } = useMentorProfile();
  const mentorStatus = mentorProfile?.approvalStatus;

  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  useEffect(() => {
    const bookingId = Number(searchParams.get('bookingId'));
    if (Number.isInteger(bookingId) && bookingId > 0) {
      setSelectedBookingId(bookingId);
    }
  }, [searchParams]);

  const {
    data: selectedBooking,
    isLoading: isDetailLoading,
    refetch,
  } = useBookingDetail(selectedBookingId);

  const handleViewDetail = (booking: Booking) => {
    setSelectedBookingId(booking.id);
    // The query will automatically fetch because enabled becomes true
  };

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectBookingId, setRejectBookingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isFetching } = useMentorBookings({
    status: filterStatus,
    page: 1,
    limit: 50,
  });

  const acceptMutation = useAcceptBooking();
  const rejectMutation = useRejectBooking();

  const isMutating = acceptMutation.isPending || rejectMutation.isPending;

  const bookings = data?.items || [];

  const filteredBookings = bookings.filter((booking) =>
    booking.candidate.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAccept = (bookingId: number) => {
    acceptMutation.mutate(bookingId);
  };
  // Mở modal reason
  const handleRejectClick = (bookingId: number) => {
    setRejectBookingId(bookingId);
    setRejectReason('');
    setRejectModalOpen(true);
  };
  const handleReject = (bookingId: number, reason?: string) => {
    rejectMutation.mutate({ bookingId, reason });
  };

  if (isLoading) {
    return (
      <MentorLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        </div>
      </MentorLayout>
    );
  }

  return (
    <MentorLayout>
      <ApprovalGuard status={mentorStatus}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Manage all interview requests</p>
          </div>

          {/* Filters */}
          <Card className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-3 justify-between">
              <Input
                placeholder="Search candidate..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:w-64"
              />
              <div className="flex gap-2 flex-wrap">
                {['all', 'PENDING_ACCEPTANCE', 'ACCEPTED', 'REJECTED'].map((statusKey) => (
                  <Button
                    key={statusKey}
                    size="sm"
                    variant={
                      filterStatus === (statusKey === 'all' ? undefined : statusKey)
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() => setFilterStatus(statusKey === 'all' ? undefined : statusKey)}
                    className="capitalize"
                  >
                    {statusKey === 'all' ? 'All' : statusKey.toLowerCase().replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
            {isFetching && (
              <div className="text-right text-sm text-muted-foreground">
                <Loader2 className="inline w-4 h-4 animate-spin mr-1" /> Refreshing...
              </div>
            )}
          </Card>

          {/* Bookings list */}
          <Card className="p-6 space-y-4">
            {filteredBookings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No bookings found</div>
            )}
            {filteredBookings.map((booking) => {
              console.log('status booking', booking);
              const statusUI = getStatusUI(booking.status);
              console.log('status', statusUI);
              const canAction = statusUI.actionable;

              return (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border p-4 rounded-xl hover:shadow-md transition gap-4"
                >
                  {/* Left info */}
                  <div className="flex-1 flex items-start gap-3">
                    {/* Avatar */}
                    {/* {booking.candidate.avatarUrl ? (
                      <img
                        src={booking.candidate.avatarUrl}
                        alt={booking.candidate.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                    )} */}

                    <UserAvatar
                      userId={booking.candidate.id}
                      avatarUrl={booking.candidate.avatarUrl}
                      name={booking.candidate.name}
                      className="w-10 h-10"
                    />

                    {/* Thông tin */}
                    <div>
                      <p className="font-semibold">{booking.candidate.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.planDetails.title} • {formatDateTime(booking.startTime)} -{' '}
                        {formatDateTime(booking.endTime)}
                      </p>
                      <Badge
                        className={cn(
                          'mt-2 flex items-center w-fit border px-2 py-1 text-xs',
                          statusUI.className,
                        )}
                      >
                        {statusUI.icon}
                        {statusUI.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleViewDetail(booking)}
                      disabled={isDetailLoading && selectedBookingId === booking.id}
                    >
                      {isDetailLoading && selectedBookingId === booking.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    {canAction && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => handleAccept(booking.id)}
                          disabled={isMutating}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => handleRejectClick(booking.id)}
                          disabled={isMutating}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-background rounded-xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Booking Detail</h2>
                <button
                  onClick={() => setSelectedBookingId(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Candidate</p>
                  <p className="font-medium">{selectedBooking.candidate.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{selectedBooking.candidate.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p>{selectedBooking.planDetails.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p>{selectedBooking.planDetails.duration} minutes</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p>
                    {formatDateTime(selectedBooking.startTime)} →{' '}
                    {formatDateTime(selectedBooking.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-medium text-green-600">${selectedBooking.planDetails.price}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created At</p>
                  <p>{formatDateTime(selectedBooking.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="capitalize">
                    {selectedBooking.status.replace('_', ' ').toLowerCase()}
                  </p>
                </div>

                {/* Hiển thị câu trả lời */}
                {selectedBooking.answers && selectedBooking.answers.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">Câu trả lời của candidate:</p>
                    <div className="space-y-3 bg-muted/30 p-3 rounded-md max-h-60 overflow-y-auto">
                      {selectedBooking.answers.map((ans) => (
                        <div key={ans.questionId} className="border-b pb-2 last:border-0">
                          <p className="font-medium text-sm">{ans.questionText}</p>
                          {ans.answerText && (
                            <p className="text-sm whitespace-pre-wrap mt-1">{ans.answerText}</p>
                          )}
                          {ans.fileUrl && (
                            <a
                              href={ans.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 text-sm underline mt-1 inline-block"
                            >
                              📎 Xem file đính kèm
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBooking.status === 'REJECTED' && selectedBooking.rejectionReason && (
                  <div>
                    <p className="text-muted-foreground">Lý do từ chối</p>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                      {selectedBooking.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {getStatusUI(selectedBooking.status).actionable && (
                <div className="flex gap-2 mt-6">
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      handleAccept(selectedBooking.id);
                      setSelectedBookingId(null);
                    }}
                    disabled={acceptMutation.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => {
                      handleReject(selectedBooking.id);
                      setSelectedBookingId(null);
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-background rounded-xl w-full max-w-md p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">Lý do từ chối</h2>
              <textarea
                className="w-full border rounded p-2 mb-4"
                rows={3}
                placeholder="Nhập lý do từ chối (tuỳ chọn)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
                  Hủy
                </Button>
                <Button
                  className="bg-red-500 hover:bg-red-600"
                  onClick={() => {
                    if (rejectBookingId) {
                      handleReject(rejectBookingId, rejectReason);
                      setRejectModalOpen(false);
                    }
                  }}
                  disabled={rejectMutation.isPending}
                >
                  Xác nhận từ chối
                </Button>
              </div>
            </div>
          </div>
        )}
      </ApprovalGuard>
    </MentorLayout>
  );
}
