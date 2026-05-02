// src/components/videocall/ParticipantTracker.tsx
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';

export const ParticipantTracker = () => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [hadRemote, setHadRemote] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const hasRemoteNow = participants.some((p) => !p.isLocalParticipant);

    if (hasRemoteNow) {
      setHadRemote(true);
      setShowWarning(false);
    } else if (hadRemote) {
      // Đối phương vừa thoát
      setShowWarning(true);
      setHadRemote(false);
    }
  }, [participants, hadRemote]);

  if (!showWarning) return null;

  return (
    <div className="absolute top-20 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg animate-bounce z-50">
      ⚠️ Đối phương đã rời khỏi phòng!
    </div>
  );
};
