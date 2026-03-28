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
  // 1. Lấy roomId từ URL path (Văn sẽ truyền qua /interview/:roomId)
  const { roomId } = useParams<{ roomId: string }>();
  // 2. Lấy userId từ Query string hoặc LocalStorage
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);

  // Lấy thông tin user hiện tại từ localStorage (giống trong App.tsx của bạn)
  const userStore = localStorage.getItem('user');
  const currentUser = userStore ? JSON.parse(userStore) : null;
  const userId = currentUser?.id || searchParams.get('userId') || 'guest-user';

  useEffect(() => {
    if (!roomId || !userId) return;

    let _client: StreamVideoClient;
    let _call: any;

    const initVideoCall = async () => {
      try {
        // 1. Gọi Backend lấy token (Đảm bảo URL Backend của bạn đúng)
        const response = await fetch('http://localhost:3000/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const data = await response.json();
        const token = data.token;

        if (!token) throw new Error('Không lấy được Token từ Backend');

        // 2. Lấy API Key từ Vite Env (Ép kiểu any để né lỗi TS)
        const apiKey = (import.meta as any).env.VITE_STREAM_API_KEY;

        const user: User = { id: userId };

        _client = new StreamVideoClient({
          apiKey: apiKey || '',
          user,
          token,
        });

        _call = _client.call('default', roomId);

        // AC: Tự động kết nối khi vào room
        await _call.join({ create: true });

        setClient(_client);
        setCall(_call);
      } catch (error) {
        console.error('Lỗi kết nối Video:', error);
      }
    };

    initVideoCall();

    // Cleanup: Ngắt kết nối khi thoát trang
    return () => {
      if (_call) _call.leave().catch(console.error);
      if (_client) _client.disconnectUser().catch(console.error);
    };
  }, [roomId, userId]);

  // Giao diện chờ kết nối
  if (!client || !call) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
        <p className="text-lg font-medium">Đang thiết lập phòng phỏng vấn {roomId}...</p>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <div className="h-screen flex flex-col bg-black text-white font-sans">
          {/* Header hiển thị thông tin phòng */}
          <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-slate-900 shadow-md">
            <div className="flex items-center gap-3">
              <span className="font-bold text-blue-400">Interview Room:</span>
              <span className="bg-gray-800 px-3 py-1 rounded text-sm uppercase tracking-widest">
                {roomId}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              LIVE
            </div>
          </header>

          {/* Khu vực Video chính */}
          <main className="flex-1 relative flex items-center justify-center bg-slate-950">
            <SpeakerLayout />

            {/* AC: Hiển thị thông báo nếu đối phương ngắt kết nối */}
            <ParticipantTracker />
          </main>

          {/* Thanh điều khiển (AC: Bật/tắt Mic Cam) */}
          <footer className="p-6 flex justify-center bg-slate-900 border-t border-gray-800 shadow-2xl">
            <CallControls onLeave={() => navigate('/dashboard')} />
          </footer>
        </div>
      </StreamCall>
    </StreamVideo>
  );
}
