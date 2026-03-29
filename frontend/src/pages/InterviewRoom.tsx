// src/pages/InterviewRoom.tsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  SpeakerLayout,
  CallControls,
  User,
} from '@stream-io/video-react-sdk';
import { ParticipantTracker } from '../../components/videocall/ParticipantTracker';
import '@stream-io/video-react-sdk/dist/css/styles.css';

export default function InterviewRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);

  // 1. Lấy token trực tiếp từ URL (Văn truyền từ Socket sang)
  const tokenFromUrl = searchParams.get('token');
  const userStore = localStorage.getItem('user');
  const currentUser = userStore ? JSON.parse(userStore) : null;
  const userId = currentUser?.id?.toString() || searchParams.get('userId') || 'guest';

  useEffect(() => {
    // Nếu thiếu roomId hoặc token thì không thể kết nối
    if (!roomId || !userId || !tokenFromUrl) {
      console.error('Thiếu thông tin kết nối: roomId, userId hoặc token');
      return;
    }

    let _client: StreamVideoClient;
    let _call: any;

    const initVideoCall = async () => {
      try {
        const apiKey = (import.meta as any).env.VITE_STREAM_API_KEY;
        const user: User = { id: userId, name: currentUser?.name || userId };

        // 2. Sử dụng token có sẵn, không cần fetch lại Backend
        _client = new StreamVideoClient({
          apiKey,
          user,
          token: tokenFromUrl,
        });

        _call = _client.call('default', roomId);

        // Backend đã gọi getOrCreateCall nên ở đây chỉ cần join
        await _call.join();

        setClient(_client);
        setCall(_call);
      } catch (error) {
        console.error('Lỗi kết nối Stream Video:', error);
      }
    };

    initVideoCall();

    return () => {
      if (_call) _call.leave().catch(console.error);
      if (_client) _client.disconnectUser().catch(console.error);
    };
  }, [roomId, userId, tokenFromUrl]); // Theo dõi token từ URL

  if (!client || !call) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
        <p className="text-lg font-medium">Đang tham gia phòng phỏng vấn...</p>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <div className="h-screen flex flex-col bg-black text-white font-sans">
          <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-slate-900 shadow-md">
            <div className="flex items-center gap-3">
              <span className="font-bold text-blue-400">Phòng phỏng vấn:</span>
              <span className="bg-gray-800 px-3 py-1 rounded text-sm font-mono">{roomId}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              LIVE
            </div>
          </header>

          <main className="flex-1 relative flex items-center justify-center bg-slate-950">
            <SpeakerLayout />
            <ParticipantTracker />
          </main>

          <footer className="p-4 flex justify-center bg-slate-900 border-t border-gray-800">
            <CallControls onLeave={() => navigate('/dashboard')} />
          </footer>
        </div>
      </StreamCall>
    </StreamVideo>
  );
}
