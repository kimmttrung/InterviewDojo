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
  const [isInitializing, setIsInitializing] = useState(false);
  const initializing = useRef(false);

  useEffect(() => {
    // Ngăn chặn chạy 2 lần trong Strict Mode và check điều kiện
    if (!roomId || !token || !userId || initializing.current) return;

    const apiKey = import.meta.env.VITE_STREAM_API_KEY;
    if (!apiKey) {
      setError('Missing API Key');
      return;
    }

    const initVideo = async () => {
      initializing.current = true;
      setIsInitializing(true);

      try {
        const _client = new StreamVideoClient({ apiKey });
        const user: User = {
          id: userId,
          name: currentUser?.name || userId,
          image: currentUser?.avatar || undefined,
        };

        await _client.connectUser(user, token);
        const _call = _client.call('default', roomId);

        // QUAN TRỌNG: Join với các thiết bị ở trạng thái TẮT mặc định
        // Điều này giúp tránh lỗi kẹt luồng nếu người dùng chưa cấp quyền
        await _call.join({ create: true });

        // Sau khi join thành công, chủ động tắt thiết bị nếu không muốn bật ngay
        // Việc này không gây lỗi 400 như cách trước
        await _call.camera.disable();
        await _call.microphone.disable();

        setClient(_client);
        setCall(_call);
        setError(null);
      } catch (err) {
        console.error('❌ Video connection error:', err);
        setError(err instanceof Error ? err.message : 'Connection failed');
        initializing.current = false;
      } finally {
        setIsInitializing(false);
      }
    };

    initVideo();

    return () => {
      // Cleanup đúng cách
      if (initializing.current) {
        const cleanup = async () => {
          if (call) await call.leave();
          if (client) await client.disconnectUser();
          initializing.current = false;
        };
        cleanup();
      }
    };
  }, [roomId, token, userId]); // Giảm dependency để tránh re-init thừa

  return { client, call, error, isInitializing };
}
