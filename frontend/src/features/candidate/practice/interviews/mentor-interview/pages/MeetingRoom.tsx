import { useNavigate, useParams } from 'react-router-dom';
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';
import { useMeeting } from '../hooks/useMeeting';
import { VideoCallLayout } from '../components/VideoCallLayout';
import { useEffect, useState } from 'react';
import { useMyFeedback } from '@/features/shared-domain/feedback/hooks/useFeedback';
import { useSessionEnded } from '../../peer-interview/hooks/useSessionEnded';
import { FeedbackModal } from '@/features/shared-domain/feedback/components/FeedbackModal';
import { FeedbackForm } from '@/features/shared-domain/feedback/components/FeedbackForm';

export default function MeetingRoom() {
  const { client, call, isLoading, error } = useMeeting();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const sessionIdNum = roomId ? Number(roomId) : NaN;

  console.log('sessionIdNum', sessionIdNum);

  const [showFeedback, setShowFeedback] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Kiểm tra xem đã gửi feedback chưa
  const { data: myFeedback, isLoading: feedbackLoading } = useMyFeedback(Number(sessionIdNum));
  const isSessionEnded = useSessionEnded(); // nếu có hook phát hiện call ended

  // Khi người dùng bấm nút rời phòng (sẽ được truyền xuống VideoCallLayout)
  const handleLeaveWithFeedback = () => {
    if (window.confirm('Bạn có chắc muốn kết thúc buổi phỏng vấn?')) {
      setIsLeaving(true);
      setShowFeedback(true);
    }
  };

  // Tự động hiện feedback nếu session kết thúc do đối phương rời
  useEffect(() => {
    if (isSessionEnded && !feedbackLoading && !myFeedback && !isLeaving) {
      setShowFeedback(true);
    }
  }, [isSessionEnded, feedbackLoading, myFeedback, isLeaving]);

  const handleFeedbackSuccess = () => {
    setShowFeedback(false);
    navigate('/sessions'); // hoặc route mong muốn
  };

  const handleFeedbackSkip = () => {
    setShowFeedback(false);
    navigate('/sessions');
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
          <VideoCallLayout
            onLeave={handleLeaveWithFeedback} // thay vì navigate trực tiếp
          />
        </StreamCall>
      </StreamVideo>

      <FeedbackModal open={showFeedback} onClose={handleFeedbackSkip}>
        <FeedbackForm
          mode="MENTOR_TO_CANDIDATE" // hoặc "MENTOR_INTERVIEW" - tuỳ backend của bạn
          sessionId={Number(sessionIdNum)}
          onSuccess={handleFeedbackSuccess}
          onCancel={handleFeedbackSkip}
        />
      </FeedbackModal>
    </>
  );
}
