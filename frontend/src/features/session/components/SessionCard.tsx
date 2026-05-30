import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { SessionItem, SessionTab } from '../types/session.types';
import { useSessionStore } from '../stores/useSessionStore';
import { SessionFeedbackModal } from './modals/SessionFeedbackModal';
import { UserAvatar } from '@/features/shared-domain/users/components/UserAvatar';
import { getMeetingLink } from '../services/session.services';
import { useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);

interface Props {
  session: SessionItem;
}

export const SessionCard = ({ session }: Props) => {
  const { openCancelModal, openRejectModal } = useSessionStore();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  // const [isJoinable, setIsJoinable] = useState(false);

  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const canJoin = (() => {
    const now = dayjs();
    const start = dayjs(session.scheduledAt);
    const diffMinutes = start.diff(now, 'minute');
    const duration = session.durationMinutes;
    return diffMinutes <= 15 && diffMinutes >= -duration;
  })();

  const handleJoin = async () => {
    if (!canJoin) return;
    setIsJoining(true);
    try {
      const meetingLink = await getMeetingLink(session.id);
      console.log('check meet', meetingLink);
      if (meetingLink) {
        navigate(`/${meetingLink}`);
      } else {
        alert('Không thể tạo phòng họp');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (session.status !== SessionTab.UPCOMING && session.status !== 'ONGOING') return;

    const checkTime = () => {
      const now = dayjs();
      const start = dayjs(session.scheduledAt);
      const diffMinutes = start.diff(now, 'minute');

      const duration = session.durationMinutes;

      if (diffMinutes > 0) {
        setTimeLeft(start.fromNow());
      } else if (diffMinutes <= 0 && diffMinutes >= -duration) {
        setTimeLeft('Đang diễn ra');
      } else {
        setTimeLeft('Đã kết thúc');
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [session.scheduledAt, session.status, session.meetingLink, session.durationMinutes]);

  const getStatusColor = () => {
    switch (session.status) {
      case 'UPCOMING':
        return 'text-green-600 bg-green-100';
      case 'ONGOING':
        return 'text-blue-700 bg-blue-100 animate-pulse border border-blue-200';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      case 'FINISHED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm flex flex-col gap-3 bg-white">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {session.type === 'SOLO' ? (
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
              AI
            </div>
          ) : (
            <UserAvatar
              userId={session.opponentId ?? 0}
              avatarUrl={session.opponentAvatar}
              name={session.opponentName ?? undefined}
              className="h-10 w-10"
            />
          )}
          <div>
            <h3 className={`font-bold ${session.type !== 'SOLO' ? 'hover:text-primary' : ''}`}>
              {session.type === 'SOLO' ? 'AI' : session.opponentName}
            </h3>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full inline-block mt-1">
              {session.type === 'MENTOR'
                ? 'Mentor Session'
                : session.type === 'P2P'
                  ? 'P2P Session'
                  : 'Solo Session'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getStatusColor()}`}>
            {session.status}
          </span>
          <p className="text-sm text-gray-500 mt-1">
            {session.scheduledAt
              ? dayjs(session.scheduledAt).format('HH:mm DD/MM/YYYY')
              : 'Chưa có lịch'}
          </p>
        </div>
      </div>

      {(session.type === 'MENTOR' || session.candidateAnswers) && (
        <div className="bg-gray-50 p-3 rounded-md">
          {session.type === 'MENTOR' && (
            <p className="font-medium">Plan: {session.coachingPlan || 'N/A'}</p>
          )}
          {session.candidateAnswers && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              Answers: {session.candidateAnswers}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <div className="text-sm font-medium text-orange-600">
          {session.status === 'UPCOMING' && `Bắt đầu: ${timeLeft}`}
          {session.status === 'ONGOING' && 'Cuộc phỏng vấn đang diễn ra'}
          {session.status === 'PENDING' && 'Đang chờ mentor xác nhận'}
        </div>
        <div className="flex gap-2">
          {/* 1. NÚT CANCEL: CHỈ HIỂN THỊ KHI UPCOMING */}
          {session.status === 'UPCOMING' && (
            <button
              onClick={() => openCancelModal(session.id.toString())}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
            >
              Cancel session
            </button>
          )}
          {/* 2. NÚT JOIN: HIỂN THỊ CẢ KHI UPCOMING LẪN ONGOING */}
          {(session.status === 'UPCOMING' || session.status === 'ONGOING') && (
            <button
              onClick={handleJoin}
              disabled={!canJoin || isJoining}
              className={`px-4 py-2 rounded-md font-semibold ${
                canJoin && !isJoining
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isJoining
                ? 'Đang tạo phòng...'
                : session.status === 'ONGOING' || timeLeft === 'Đang diễn ra'
                  ? 'Vào ngay'
                  : 'Join'}
            </button>
          )}

          {(session.status === 'REJECTED' || session.status === 'CANCELLED') && (
            <button
              onClick={() => openRejectModal(session.rejectedReason)}
              className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10"
            >
              Cancel reason
            </button>
          )}

          {session.status === 'FINISHED' && (
            <>
              {session.recordingUrl && (
                <a
                  href={session.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                >
                  Record session
                </a>
              )}
              <button
                onClick={() => setIsFeedbackModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Feedback
              </button>
              <SessionFeedbackModal
                open={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                sessionId={Number(session.id)}
                sessionType={session.type as 'MENTOR' | 'P2P' | 'SOLO'}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
