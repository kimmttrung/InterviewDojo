import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'; // Import plugin relativeTime
import { SessionItem, SessionTab } from '../types/session.types';
import { useSessionStore } from '../stores/useSessionStore';

// Cài đặt plugin cho dayjs
dayjs.extend(relativeTime);

interface Props {
  session: SessionItem;
}

export const SessionCard = ({ session }: Props) => {
  const { openCancelModal, openProfileModal } = useSessionStore();
  const [timeLeft, setTimeLeft] = useState('');
  const [isJoinable, setIsJoinable] = useState(false);

  // Logic đếm ngược & bật nút Join
  useEffect(() => {
    if (session.status !== SessionTab.UPCOMING) return;

    const checkTime = () => {
      const now = dayjs();
      const start = dayjs(session.scheduledAt);
      const diffMinutes = start.diff(now, 'minute');

      setIsJoinable(diffMinutes <= 30 && diffMinutes >= -120);

      if (diffMinutes > 0) {
        setTimeLeft(start.fromNow());
      } else {
        setTimeLeft('Đang diễn ra');
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // 1 phút check 1 lần
    return () => clearInterval(interval);
  }, [session.scheduledAt, session.status]);

  return (
    <div className="border rounded-lg p-4 shadow-sm flex flex-col gap-3 bg-white">
      {/* Header Card */}
      <div className="flex justify-between items-center">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => openProfileModal(session.opponent.id)}
        >
          <img
            src={session.opponent.avatarUrl || '/default-avatar.png'}
            alt="avatar"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-bold hover:text-primary">{session.opponent.name}</h3>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {session.type}
            </span>
          </div>
        </div>
        <div className="text-right">
          {/* Badge trạng thái */}
          <span
            className={`text-sm font-semibold ${session.status === 'UPCOMING' ? 'text-green-600' : 'text-gray-500'}`}
          >
            {session.status}
          </span>
          <p className="text-sm text-gray-500">
            {dayjs(session.scheduledAt).format('HH:mm DD/MM/YYYY')}
          </p>
        </div>
      </div>

      {/* Body Card */}
      <div className="bg-gray-50 p-3 rounded-md">
        <p className="font-medium">Plan: {session.coachingPlanName || 'N/A'}</p>
        {session.candidateAnswers && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            Lưu ý: {session.candidateAnswers}
          </p>
        )}
      </div>

      {/* Footer / Actions */}
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
                className="px-4 py-2 border text-red-600 border-red-600 rounded-md hover:bg-red-50"
              >
                Hủy lịch
              </button>
              <a
                href={isJoinable ? (session.meetingLink ?? undefined) : '#'} // Fix: Chuyển null thành undefined
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
            <button className="text-primary underline">Xem lý do từ chối</button>
          )}

          {session.status === 'FINISHED' && (
            <>
              {/* Fix lỗi thuộc tính bị thiếu bằng ép kiểu an toàn hoặc bạn hãy cập nhật type SessionItem */}
              {(session as SessionItem & { recordingUrl?: string }).recordingUrl && (
                <button className="text-blue-600 underline">Xem Record</button>
              )}
              <button className="px-4 py-2 bg-green-600 text-white rounded-md">Feedback</button>
              <button className="text-red-600 text-sm underline">Report</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
