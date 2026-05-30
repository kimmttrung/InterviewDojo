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

export default function MeetingRoom() {
  const { client, call, isLoading, error } = useMeeting();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const sessionIdNum = roomId ? parseInt(roomId.split('-').pop() || '', 10) : NaN;

  const { data: user } = useCurrentUser();
  const { data: session, isLoading: sessionLoading } = useSessionDetail(sessionIdNum);

  // Xác định mode dựa vào user.id và session.mentorId / candidateId
  const getFeedbackMode = () => {
    if (!session || !user) return null;
    if (user.id === session.mentorId) return 'MENTOR_TO_CANDIDATE';
    if (user.id === session.candidateId) return 'CANDIDATE_TO_MENTOR';
    return null;
  };

  const mode = getFeedbackMode();

  const [showFeedback, setShowFeedback] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Kiểm tra xem đã gửi feedback chưa
  const { data: myFeedback, isLoading: feedbackLoading } = useMyFeedback(Number(sessionIdNum));
  const isSessionEnded = useSessionEnded(); // nếu có hook phát hiện call ended

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
          <VideoCallLayout onLeave={handleLeaveWithFeedback} />
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
