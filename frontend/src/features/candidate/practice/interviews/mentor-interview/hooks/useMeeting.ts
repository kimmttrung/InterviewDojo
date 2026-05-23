// hooks/useMeeting.ts
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import { useCurrentUser } from '@/features/auth';
import { api } from '@/shared/lib/api';

export function useMeeting() {
  const { roomId } = useParams();
  const { data: user } = useCurrentUser();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !user) return;

    let mounted = true;

    const init = async () => {
      try {
        const response = await api.get(`/meeting/token/${roomId}`);
        const { token: streamToken, userId } = response.data.data;
        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        const client = new StreamVideoClient({
          apiKey,
          token: streamToken,
          user: { id: String(userId) },
        });
        const call = client.call('default', roomId);
        await call.join();
        if (mounted) {
          setClient(client);
          setCall(call);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.response?.data?.message || err.message);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (call) call.leave();
      if (client) client.disconnectUser();
    };
  }, [roomId, user]);

  return { client, call, error, isLoading };
}
