// useVideoCall.ts
import { useEffect, useRef, useState } from 'react';
import { StreamVideoClient, User, Call } from '@stream-io/video-react-sdk';

export function useVideoCall(
  roomId: string | undefined,
  token: string | null,
  userId: string | number | undefined,
  currentUser: any,
) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    // Không init nếu thiếu dữ liệu
    if (!roomId || !token || !userId || initRef.current) return;

    const apiKey = import.meta.env.VITE_STREAM_API_KEY;
    if (!apiKey) {
      setError('Missing API Key');
      return;
    }

    const initVideo = async () => {
      initRef.current = true;
      setIsInitializing(true);

      try {
        const userIdStr = String(userId);
        // Debug token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 Video token payload:', payload);
          console.log('📌 user_id in token:', payload.user_id);
          if (payload.user_id !== userIdStr) {
            console.error('❌ Mismatch: token user_id=', payload.user_id, ' vs userId=', userIdStr);
            throw new Error(
              `Token user_id mismatch: expected ${userIdStr}, got ${payload.user_id}`,
            );
          }
        } catch (e) {
          console.log('error', e);
        }

        const client = new StreamVideoClient({ apiKey });
        const user: User = {
          id: userIdStr,
          name: currentUser?.name || userIdStr,
          image: currentUser?.avatar || undefined,
        };

        await client.connectUser(user, token);
        const call = client.call('default', roomId);
        await call.join({ create: true });

        await call.camera.disable();
        await call.microphone.disable();

        setClient(client);
        setCall(call);
        setError(null);
      } catch (err) {
        console.error('❌ Video connection error:', err);
        setError(err instanceof Error ? err.message : 'Connection failed');
        initRef.current = false;
      } finally {
        setIsInitializing(false);
      }
    };

    initVideo();

    return () => {
      if (initRef.current) {
        (async () => {
          if (call) await call.leave();
          if (client) await client.disconnectUser();
          initRef.current = false;
        })();
      }
    };
  }, [roomId, token, userId, currentUser]);

  return { client, call, error, isInitializing };
}
