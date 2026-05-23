import { useEffect, useState } from 'react';
import { useCall, useCallStateHooks, SpeakerLayout } from '@stream-io/video-react-sdk';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp } from 'lucide-react';

interface VideoCallLayoutProps {
  onLeave: () => void;
}

export function VideoCallLayout({ onLeave }: VideoCallLayoutProps) {
  const call = useCall();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { microphone } = useMicrophoneState();
  const { camera } = useCameraState();
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (call) {
      call.microphone.enable().catch(() => {});
      call.camera.enable().catch(() => {});

      const handleScreenShareStarted = () => setIsSharing(true);
      const handleScreenShareStopped = () => setIsSharing(false);
      call.on('call.screen_share_started', handleScreenShareStarted);
      call.on('call.screen_share_stopped', handleScreenShareStopped);
      return () => {
        call.off('call.screen_share_started', handleScreenShareStarted);
        call.off('call.screen_share_stopped', handleScreenShareStopped);
      };
    }
  }, [call]);

  if (!call) {
    return <div className="text-white">Đang tải cuộc gọi...</div>;
  }

  const handleShare = async () => {
    try {
      await call.screenShare.toggle();
    } catch (err) {
      console.error('Share screen error:', err);
      alert('Không thể chia sẻ màn hình. Vui lòng cho phép quyền truy cập.');
    }
  };

  // Xử lý rời phòng: tắt camera, mic, rời gọi
  const handleLeave = async () => {
    try {
      if (call) {
        await call.camera.disable();
        await call.microphone.disable();
        await call.leave();
      }
      onLeave();
    } catch (err) {
      console.error('Lỗi khi rời phòng:', err);
      onLeave(); // vẫn chuyển hướng
    }
  };

  return (
    <div className="relative h-screen w-full bg-black">
      <div className="absolute inset-0 z-0">
        <SpeakerLayout />
      </div>

      {isSharing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          🔴 Bạn đang chia sẻ màn hình
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 p-2 bg-gray-900/80 backdrop-blur-md rounded-full border border-white/20 shadow-lg z-30">
        <button
          onClick={() => call.microphone.toggle()}
          className={`p-3 rounded-full transition-all ${
            microphone.enabled
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-500/80 hover:bg-red-600 text-white'
          }`}
        >
          {microphone.enabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button
          onClick={() => call.camera.toggle()}
          className={`p-3 rounded-full transition-all ${
            camera.enabled
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-500/80 hover:bg-red-600 text-white'
          }`}
        >
          {camera.enabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button
          onClick={handleShare}
          className={`p-3 rounded-full transition-all ${
            isSharing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
          } text-white`}
          title="Chia sẻ màn hình"
        >
          <MonitorUp size={20} />
        </button>
        <button
          onClick={handleLeave}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
