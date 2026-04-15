import { useEffect, useState, useRef } from 'react';
import { StreamVideoClient, User, Call } from '@stream-io/video-react-sdk';

export function useVideoCall(
  roomId: string | undefined,
  token: string | null,
  userId: string,
  currentUser: any,
) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dùng ref để tránh việc khởi tạo lại nhiều lần do React Strict Mode
  const initializing = useRef(false);

  useEffect(() => {
    // Nếu không có thông tin hoặc đang khởi tạo/đã có client thì bỏ qua
    if (!roomId || !token || client || initializing.current) return;

    const apiKey = import.meta.env.VITE_STREAM_API_KEY;
    if (!apiKey) {
      setError('Missing API Key');
      return;
    }

    initializing.current = true;

    const _client = new StreamVideoClient({ apiKey });
    const user: User = {
      id: userId,
      name: currentUser?.name || userId,
      image: currentUser?.avatar || undefined,
    };

    const initVideo = async () => {
      try {
        // 1. Kết nối user
        await _client.connectUser(user, token);

        // 2. Tạo đối tượng call
        const _call = _client.call('default', roomId);

        // 3. Join call TRƯỚC khi set state để đảm bảo trạng thái "joined"
        await _call.join({ create: true });

        // 4. Bật thiết bị
        await _call.camera.enable();
        await _call.microphone.enable();

        setClient(_client);
        setCall(_call);
        console.log('✅ Joined room:', roomId);
      } catch (err) {
        console.error('❌ Video connection error:', err);
        setError(err instanceof Error ? err.message : 'Connection failed');
        initializing.current = false;
      }
    };

    initVideo();

    return () => {
      // Cleanup function
      const cleanup = async () => {
        if (call) await call.leave();
        if (_client) await _client.disconnectUser();
        setClient(null);
        setCall(null);
        initializing.current = false;
      };
      cleanup();
    };
    // KHÔNG đưa 'client' vào đây
  }, [roomId, token, userId, currentUser?.name, currentUser?.avatar]);

  return { client, call, error };
}
