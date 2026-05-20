import {
  SpeakerLayout,
  useCall,
  useCallStateHooks,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp } from 'lucide-react';

// 1. Tạo Component hiển thị khi tắt Cam (Avatar placeholder)
const CustomVideoPlaceholder = ({ participant }: { participant: StreamVideoParticipant }) => (
  <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-10">
    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 shadow-xl">
      <span className="text-xl text-white font-bold">
        {participant.name?.charAt(0).toUpperCase() || 'U'}
      </span>
    </div>
    <p className="text-slate-500 text-[10px] mt-3 font-medium">Camera Off</p>
  </div>
);

interface VideoCallSectionProps {
  onLeave?: () => void; // callback khi người dùng xác nhận rời phòng
}

export function VideoCallSection({ onLeave }: VideoCallSectionProps) {
  const call = useCall();
  const { useCameraState, useMicrophoneState, useLocalParticipant } = useCallStateHooks();

  const localParticipant = useLocalParticipant();
  const { camera } = useCameraState();
  const { microphone } = useMicrophoneState();

  const handleLeave = async () => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn rời khỏi cuộc phỏng vấn?');
    if (confirmed && call) {
      await call.leave(); // rời khỏi cuộc gọi Stream
      onLeave?.(); // 🔥 báo cho parent biết để hiện feedback
    }
  };

  if (!call) return <div className="p-10 text-center text-white">Initializing...</div>;

  return (
    <div className="bg-black relative group overflow-hidden w-full">
      {/* 2. Cấu hình SpeakerLayout để dùng Placeholder tùy chỉnh */}
      <SpeakerLayout VideoPlaceholder={CustomVideoPlaceholder} />

      {/* Control Bar (Giữ nguyên logic cũ của bạn nhưng làm đẹp hơn) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
        <button
          onClick={() => call.microphone.toggle()}
          className={`p-2.5 rounded-lg ${microphone.enabled ? 'text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500'}`}
        >
          {microphone.enabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        <button
          onClick={() => call.camera.toggle()}
          className={`p-2.5 rounded-lg ${camera.enabled ? 'text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500'}`}
        >
          {camera.enabled ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        <button
          onClick={() => call.screenShare.toggle()}
          className="p-3 rounded-xl hover:bg-slate-700 text-white transition-colors"
          title="Share Screen"
        >
          <MonitorUp size={20} />
        </button>

        <button
          onClick={handleLeave} // thay thế onClick cũ
          className="p-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white"
        >
          <PhoneOff size={18} />
        </button>
      </div>

      {/* Label tên người dùng ở góc */}
      <div className="absolute bottom-2 left-2 z-20 bg-black/40 px-2 py-0.5 rounded text-[10px] text-slate-300 backdrop-blur-sm border border-white/5">
        {localParticipant?.name} (You)
      </div>
    </div>
  );
}
