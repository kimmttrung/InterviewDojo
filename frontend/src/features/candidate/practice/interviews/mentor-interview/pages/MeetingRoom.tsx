import { useNavigate } from 'react-router-dom';
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';
import { useMeeting } from '../hooks/useMeeting';
import { VideoCallLayout } from '../components/VideoCallLayout';

export default function MeetingRoom() {
  const { client, call, isLoading, error } = useMeeting();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-white">Đang kết nối phòng họp...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 flex flex-col items-center justify-center h-screen">
        <p>Lỗi: {error.message}</p>
        <button
          onClick={() => navigate('/sessions')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!client || !call) return null;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <VideoCallLayout onLeave={() => navigate('/sessions')} />
      </StreamCall>
    </StreamVideo>
  );
}
