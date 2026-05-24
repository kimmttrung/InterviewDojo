import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { SessionItem, SessionTab } from '../types/session.types';
import { useSessionStore } from '../stores/useSessionStore';
import { SessionFeedbackModal } from './modals/SessionFeedbackModal';
dayjs.extend(relativeTime);

interface Props {
  session: SessionItem;
}

export const SessionCard = ({ session }: Props) => {
  const { openCancelModal, openProfileModal, openRejectModal } = useSessionStore();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isJoinable, setIsJoinable] = useState(false);

  useEffect(() => {
    if (session.status !== SessionTab.UPCOMING) return;

    const checkTime = () => {
      const now = dayjs();
      const start = dayjs(session.scheduledAt);
      const diffMinutes = start.diff(now, 'minute');

      const canJoin = diffMinutes <= 30 && diffMinutes >= -120;
      setIsJoinable(canJoin && !!session.meetingLink);

      if (diffMinutes > 0) {
        setTimeLeft(start.fromNow());
      } else {
        setTimeLeft('Đang diễn ra');
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [session.scheduledAt, session.status, session.meetingLink]);

  const getStatusColor = () => {
    switch (session.status) {
      case 'UPCOMING':
        return 'text-green-600 bg-green-100';
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
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => session.opponentId && openProfileModal(session.opponentId)}
        >
          <img
            src={session.opponentAvatar || '/default-avatar.png'}
            alt="avatar"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-bold hover:text-primary">{session.opponentName}</h3>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {session.type}
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

      <div className="bg-gray-50 p-3 rounded-md">
        <p className="font-medium">Plan: {session.coachingPlan || 'N/A'}</p>
        {session.candidateAnswers && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            Câu trả lời: {session.candidateAnswers}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="text-sm font-medium text-orange-600">
          {session.status === 'UPCOMING' && `Bắt đầu: ${timeLeft}`}
          {session.status === 'PENDING' && 'Đang chờ mentor xác nhận'}
        </div>
        <div className="flex gap-2">
          {session.status === 'UPCOMING' && (
            <>
              <button
                onClick={() => openCancelModal(session.id.toString())}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
              >
                Hủy lịch
              </button>
              <a
                href={isJoinable ? (session.meetingLink ?? undefined) : '#'}
                target={isJoinable ? '_blank' : '_self'}
                className={`px-4 py-2 rounded-md font-semibold ${
                  isJoinable
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {timeLeft === 'Đang diễn ra' ? 'In-progress (Join)' : 'Tham gia'}
              </a>
            </>
          )}

          {session.status === 'REJECTED' && (
            <button
              onClick={() => openRejectModal(session.rejectedReason)}
              className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10"
            >
              Xem lý do từ chối
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
                  Xem Record
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
