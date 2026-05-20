// useSessionEnded.ts
import { useEffect, useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

export const useSessionEnded = () => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState(); // 'left' / 'ended' / 'ringing' / ...
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    if (!call) return;
    if (callingState === 'left') {
      setIsEnded(true);
    }
    const handleEnd = () => setIsEnded(true);
    call.on('call.ended', handleEnd);
    return () => call.off('call.ended', handleEnd);
  }, [call, callingState]);

  return isEnded;
};
