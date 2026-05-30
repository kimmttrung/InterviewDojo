import { useNavigate, useParams } from 'react-router-dom';
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';
import { useMeeting } from '../hooks/useMeeting';
import { VideoCallLayout } from '../components/VideoCallLayout';
import { useEffect, useState } from 'react';
import { useMyFeedback } from '@/features/shared-domain/feedback/hooks/useFeedback';
import { useSessionEnded } from '../../peer-interview/hooks/useSessionEnded';
import { FeedbackModal } from '@/features/shared-domain/feedback/components/FeedbackModal';
import { FeedbackForm } from '@/features/shared-domain/feedback/components/FeedbackForm';
import { useSessionDetail } from '@/features/session/hooks/useSessionDetail';
import { useCurrentUser } from '@/features/auth';
import { useToast } from '@/hooks/use-toast';
import { Timer } from 'lucide-react';

export default function MeetingRoom() {
  const { client, call, isLoading, error } = useMeeting();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const sessionIdNum = roomId ? parseInt(roomId.split('-').pop() || '', 10) : NaN;
  const { toast } = useToast();

  const { data: user } = useCurrentUser();
  const { data: session } = useSessionDetail(sessionIdNum);

  const getFeedbackMode = () => {
    if (!session || !user) return null;
    if (user.id === session.mentorId) return 'MENTOR_TO_CANDIDATE';
    if (user.id === session.candidateId) return 'CANDIDATE_TO_MENTOR';
    return null;
  };

  const mode = getFeedbackMode();

  const [showFeedback, setShowFeedback] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Các state cho đồng hồ đếm ngược
  const [timeLeftDisplay, setTimeLeftDisplay] = useState<string>('');
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  // Kiểm tra xem đã gửi feedback chưa
  const { data: myFeedback, isLoading: feedbackLoading } = useMyFeedback(Number(sessionIdNum));
  const isSessionEnded = useSessionEnded();

  // Khi người dùng bấm nút rời phòng (sẽ được truyền xuống VideoCallLayout)
  const handleLeaveWithFeedback = () => {
    setIsLeaving(true);
    setShowFeedback(true);
  };

  // Tự động hiện feedback nếu session kết thúc do đối phương rời
  useEffect(() => {
    if (isSessionEnded && !feedbackLoading && !myFeedback && !isLeaving) {
      setShowFeedback(true);
    }
  }, [isSessionEnded, feedbackLoading, myFeedback, isLeaving]);

  useEffect(() => {
    if (!session?.scheduledAt) return;

    const duration = session.durationMinutes;
    const start = new Date(session.scheduledAt).getTime();
    const end = start + duration * 60 * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = end - now;

      if (remaining <= 0) {
        clearInterval(interval);
        setIsTimeUp(true);
        setTimeLeftDisplay('00:00');
      } else {
        setIsWarning(remaining <= 300000);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeLeftDisplay(
          `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if ((isTimeUp || isSessionEnded) && !isLeaving) {
      setIsLeaving(true);
      toast({
        title: 'Đã hết giờ phỏng vấn!',
        description: 'Hệ thống đang đóng phòng và lưu kết quả...',
        variant: 'destructive',
      });

      if (call) {
        // Tắt cưỡng chế phần cứng
        call.camera.disable();
        call.microphone.disable();
        // Rời phòng Stream-io
        call.leave().then(() => {
          setShowFeedback(true);
        });
      } else {
        setShowFeedback(true);
      }
    }
  }, [isTimeUp, isSessionEnded, isLeaving, call, toast]);

  const handleFeedbackSuccess = () => {
    setShowFeedback(false);
    navigate('/');
  };

  const handleFeedbackSkip = () => {
    setShowFeedback(false);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-white">Đang kết nối phòng họp...</span>
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  // Kiểm tra hợp lệ
  if (isNaN(sessionIdNum)) {
    return <div>Invalid session ID</div>;
  }

  if (!client || !call) return <div>Loading...</div>;

  return (
    <>
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <div className="relative h-screen w-full bg-black">
            <VideoCallLayout onLeave={handleLeaveWithFeedback} />
            {timeLeftDisplay && (
              <div
                className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-lg font-mono text-xl font-bold shadow-2xl border backdrop-blur-md transition-all duration-500 ${
                  isWarning
                    ? 'bg-red-600/90 text-white border-red-400 animate-pulse'
                    : 'bg-slate-900/70 text-white border-slate-600'
                }`}
              >
                <Timer size={20} className={isWarning ? 'animate-bounce' : ''} />
                <span>{timeLeftDisplay}</span>
              </div>
            )}
          </div>
        </StreamCall>
      </StreamVideo>

      {mode && (
        <FeedbackModal open={showFeedback} onClose={handleFeedbackSkip}>
          <FeedbackForm
            mode={mode}
            sessionId={sessionIdNum}
            onSuccess={handleFeedbackSuccess}
            onCancel={handleFeedbackSkip}
          />
        </FeedbackModal>
      )}
    </>
  );
}
