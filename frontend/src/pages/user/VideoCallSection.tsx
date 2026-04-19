import {
  CallControls,
  SpeakerLayout,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function VideoCallSection() {
  const navigate = useNavigate();
  const call = useCall();
  const { useCameraState, useMicrophoneState, useLocalParticipant } = useCallStateHooks();

  const localParticipant = useLocalParticipant();
  const { camera, error: cameraError, hasBrowserPermission: camPermission } = useCameraState();
  const { microphone, error: micError } = useMicrophoneState();

  const [isProcessing, setIsProcessing] = useState(false);

  // Hàm xử lý bật/tắt thiết bị mượt mà
  const toggleCamera = async () => {
    if (!call) return;
    setIsProcessing(true);
    try {
      await call.camera.toggle();
    } catch (err) {
      console.error('Camera toggle failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMic = async () => {
    if (!call) return;
    setIsProcessing(true);
    try {
      await call.microphone.toggle();
    } catch (err) {
      console.error('Mic toggle failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Nếu chưa có call instance, chỉ hiện loading nhẹ, không sập cả trang
  if (!call) return <div className="p-10 text-center text-white">Initializing Call...</div>;

  return (
    <div className="bg-slate-950 border-b border-slate-800 relative group overflow-hidden">
      {/* Container chính cho Video */}
      <div className="aspect-video w-full bg-slate-900 relative">
        {/* Layout hiển thị video (SpeakerLayout tự động xử lý người nói chính) */}
        <SpeakerLayout />

        {/* Overlay: Nếu Camera đang tắt hoặc không có quyền */}
        {!camera.enabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <span className="text-3xl">👤</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              {camPermission ? 'Camera is off' : 'Camera access denied'}
            </p>
            {!camPermission && (
              <p className="text-slate-500 text-xs mt-2 text-center px-4">
                Please check your browser settings to allow camera access
              </p>
            )}
          </div>
        )}

        {/* Hiển thị lỗi thiết bị dạng nhỏ (Toast style), không chặn UI */}
        {(cameraError || micError) && (
          <div className="absolute top-4 left-4 z-50 bg-red-500/90 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg">
            ⚠️ {cameraError ? `Camera: ${cameraError}` : `Mic: ${micError}`}
          </div>
        )}

        {/* Loading khi đang bật/tắt thiết bị */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Controls: Tùy biến lại thanh điều khiển */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Nút Mic */}
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all ${microphone.enabled ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'}`}
        >
          {microphone.enabled ? '🎤' : '🔇'}
        </button>

        {/* Nút Cam */}
        <button
          onClick={toggleCamera}
          className={`p-4 rounded-full transition-all ${camera.enabled ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'}`}
        >
          {camera.enabled ? '📹' : '🚫'}
        </button>

        {/* Nút thoát */}
        <button
          onClick={async () => {
            await call.leave();
            navigate('/practice/matching');
          }}
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all"
        >
          📞
        </button>
      </div>

      {/* Tên người dùng hiển thị ở góc video (Local) */}
      <div className="absolute bottom-4 left-4 z-20 bg-black/50 px-2 py-1 rounded text-[10px] text-white backdrop-blur-md">
        {localParticipant?.name} (You)
      </div>
    </div>
  );
}
