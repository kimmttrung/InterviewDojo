// // useSessionEnded.ts
// import { useEffect, useState } from 'react';
// import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

// export const useSessionEnded = () => {
//   const call = useCall();
//   const { useCallCallingState } = useCallStateHooks();
//   const callingState = useCallCallingState(); // 'left' / 'ended' / 'ringing' / ...
//   const [isEnded, setIsEnded] = useState(false);

//   useEffect(() => {
//     if (!call) return;
//     if (callingState === 'left') {
//       setIsEnded(true);
//     }
//     const handleEnd = () => setIsEnded(true);
//     call.on('call.ended', handleEnd);
//     return () => call.off('call.ended', handleEnd);
//   }, [call, callingState]);

//   return isEnded;
// };

// hooks/useSessionEnded.ts
import { useEffect, useState } from 'react';
import { useSocketStore } from '@/stores/useSocketStore';

export function useSessionEnded() {
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  useEffect(() => {
    // Lấy socket hiện tại
    const attach = (socket: ReturnType<typeof useSocketStore.getState>['socket']) => {
      if (!socket) return () => {};

      const handleCallEnded = (data: { endedBy: string }) => {
        console.log('📵 Call ended by:', data.endedBy);
        setIsSessionEnded(true);
      };

      socket.on('call_ended', handleCallEnded);
      return () => socket.off('call_ended', handleCallEnded);
    };

    let cleanup = attach(useSocketStore.getState().socket);

    // Subscribe để bắt socket mới nếu thay đổi
    const unsubscribe = useSocketStore.subscribe((state, prevState) => {
      if (state.socket !== prevState.socket) {
        cleanup();
        cleanup = attach(state.socket);
      }
    });

    return () => {
      cleanup();
      unsubscribe();
    };
  }, []);

  return isSessionEnded;
}
