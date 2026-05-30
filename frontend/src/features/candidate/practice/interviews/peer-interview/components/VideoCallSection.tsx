import { useCurrentUser } from '@/features/auth';
import { useSocketStore } from '@/stores/useSocketStore';
import {
  useCall,
  useCallStateHooks,
  // ParticipantView,
  StreamVideoParticipant,
  SpeakerLayout,
} from '@stream-io/video-react-sdk';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  // ArrowUpRight,
  // ArrowUpLeft,
  // ArrowDownRight,
  // ArrowDownLeft,
  // ArrowRightLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// import { useState } from 'react';
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
  roomId: string;
}

export function VideoCallSection({ onLeave, roomId }: VideoCallSectionProps) {
  const call = useCall();
  const { useCameraState, useMicrophoneState, useLocalParticipant } = useCallStateHooks();

  const localParticipant = useLocalParticipant();
  // const remoteParticipants = useRemoteParticipants();
  // const remoteParticipant = remoteParticipants[0];

  const { camera } = useCameraState();
  const { microphone } = useMicrophoneState();
  const { emit, leaveRoom } = useSocketStore();
  const { data: currentUser } = useCurrentUser();
  const { toast } = useToast();

  // const [mainIsLocal, setMainIsLocal] = useState(true);
  // const [floatingPos, setFloatingPos] = useState<'tl' | 'tr' | 'bl' | 'br'>('tr');

  // // Xác định ai là Main, ai là Floating
  // const mainParticipant = mainIsLocal ? localParticipant : remoteParticipant;
  // const floatingParticipant = mainIsLocal ? remoteParticipant : localParticipant;

  const executeLeave = async () => {
    if (!call) return;
    try {
      await Promise.all([call.camera.disable(), call.microphone.disable()]);

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch(() => {});

      document.querySelectorAll('video, audio').forEach((el) => {
        const mediaEl = el as HTMLMediaElement;
        if (mediaEl.srcObject) {
          (mediaEl.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
          mediaEl.srcObject = null;
        }
      });

      emit('end_call', { roomId, userId: String(currentUser?.id) });
      leaveRoom(roomId);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await call.leave();
    } catch (err) {
      console.warn('leave failed:', err);
    } finally {
      onLeave?.();
    }
  };

  const handleLeave = () => {
    toast({
      title: 'Rời phòng phỏng vấn?',
      description: 'Bạn có chắc chắn muốn rời khỏi cuộc phỏng vấn này không?',
      // Nút hủy của shadcn thường được tích hợp sẵn (dấu X), ta chỉ cần render nút Xác nhận vào phần action
      action: (
        <button
          onClick={executeLeave}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
        >
          Rời phòng
        </button>
      ),
    });
  };

  if (!call) return <div className="p-10 text-center text-white">Initializing...</div>;
  // const getFloatingPositionClasses = () => {
  //   switch (floatingPos) {
  //     case 'tl':
  //       return 'top-4 left-4';
  //     case 'tr':
  //       return 'top-4 right-4';
  //     case 'bl':
  //       return 'bottom-24 left-4';
  //     case 'br':
  //       return 'bottom-24 right-4';
  //     default:
  //       return 'top-4 right-4';
  //   }
  // };

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
          onClick={handleLeave}
          className="p-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white"
        >
          <PhoneOff size={18} />
        </button>
      </div>

      {/* Label tên người dùng ở góc */}
      <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-md shadow-lg border border-white/10">
        <span className="text-sm font-medium text-white drop-shadow-sm">
          {localParticipant?.name} (You)
        </span>
      </div>
    </div>
  );
}
