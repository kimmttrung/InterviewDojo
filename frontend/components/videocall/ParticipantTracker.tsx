import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';

export const ParticipantTracker = () => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [hadRemote, setHadRemote] = useState(false);

  useEffect(() => {
    const hasRemoteNow = participants.some((p: any) => !p.isLocalParticipant);

    if (hasRemoteNow) {
      setHadRemote(true);
    } else if (hadRemote) {
      alert('Đối phương đã ngắt kết nối!');
      setHadRemote(false);
    }
  }, [participants, hadRemote]);

  return null;
};
