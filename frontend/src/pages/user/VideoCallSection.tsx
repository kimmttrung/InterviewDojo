// src/components/interview/VideoCallSection.tsx
import {
  CallControls,
  SpeakerLayout,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { VideoDebugInfo } from './VideoDebugInfo';

export function VideoCallSection() {
  const navigate = useNavigate();
  const call = useCall();
  const { useLocalParticipant, useRemoteParticipants, useCameraState, useMicrophoneState } =
    useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const {
    camera,
    hasBrowserPermission: cameraPermission,
    isCreatingStream: cameraCreating,
    error: cameraError,
  } = useCameraState();
  const { microphone, hasBrowserPermission: micPermission, error: micError } = useMicrophoneState();

  const [error, setError] = useState<string | null>(null);
  const [isEnablingDevices, setIsEnablingDevices] = useState(false);

  useEffect(() => {
    if (!call) {
      setError('No call instance');
      return;
    }

    console.log('📞 Call object:', call);
    console.log('📹 Camera state:', { camera, cameraPermission, cameraCreating, cameraError });
    console.log('🎤 Mic state:', { microphone, micPermission, micError });
    console.log('👥 Participants:', { local: localParticipant, remote: remoteParticipants });

    // Kiểm tra và bật devices nếu chưa bật
    const enableDevices = async () => {
      if (!call) return;

      setIsEnablingDevices(true);
      try {
        // Kiểm tra camera state
        if (!call.camera.state.enabled) {
          console.log('🎥 Enabling camera...');
          await call.camera.enable();
          console.log('✅ Camera enabled');
        }

        if (!call.microphone.state.enabled) {
          console.log('🎤 Enabling microphone...');
          await call.microphone.enable();
          console.log('✅ Microphone enabled');
        }
      } catch (err) {
        console.error('❌ Error enabling devices:', err);
        setError(err instanceof Error ? err.message : 'Failed to enable camera/mic');
      } finally {
        setIsEnablingDevices(false);
      }
    };

    enableDevices();
  }, [
    call,
    camera,
    cameraPermission,
    cameraCreating,
    cameraError,
    localParticipant,
    remoteParticipants,
    micError,
    micPermission,
    microphone,
  ]);

  // Retry function
  const handleRetry = async () => {
    setError(null);
    if (!call) return;

    try {
      console.log('🔄 Retrying to enable camera...');
      await call.camera.enable();
      await call.microphone.enable();
    } catch (err) {
      console.error('Retry failed:', err);
      setError(err instanceof Error ? err.message : 'Retry failed');
    }
  };

  // Request permissions manually
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      window.location.reload();
    } catch (err) {
      console.error('Permission denied:', err);
      setError('Camera/Microphone permission denied. Please allow access and reload.');
    }
  };

  if (cameraError || micError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-2">
        <p className="text-red-800 font-bold text-sm mb-2">⚠️ Device Error</p>
        <p className="text-red-600 text-xs mb-3">{cameraError || micError}</p>
        <button
          onClick={requestPermissions}
          className="bg-red-600 text-white px-3 py-1 rounded text-xs"
        >
          Request Permissions
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-2">
        <p className="text-red-800 font-bold text-sm mb-2">❌ Video Error</p>
        <p className="text-red-600 text-xs mb-3">{error}</p>
        <button
          onClick={handleRetry}
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs mr-2"
        >
          Retry
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-600 text-white px-3 py-1 rounded text-xs"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black border-b border-slate-200 relative group">
      {/* Video Debug Info */}

      {/* Loading indicator */}
      {isEnablingDevices && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Enabling camera...</p>
          </div>
        </div>
      )}

      {/* Video Container */}
      <div className="aspect-video w-full bg-slate-900 shadow-inner relative">
        {!cameraPermission && !cameraCreating && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95">
            <div className="text-white text-center p-4">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm mb-3 font-medium">Camera permission required</p>
              <p className="text-xs text-slate-400 mb-3">
                Please allow camera access to start video call
              </p>
              <button
                onClick={requestPermissions}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Enable Camera
              </button>
            </div>
          </div>
        )}

        {cameraCreating && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Video layout */}
        <SpeakerLayout />

        {/* Thông báo khi không có video */}
        {!camera?.enabled && !cameraCreating && cameraPermission && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Camera is off
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 stream-mini-controls">
        <CallControls onLeave={() => navigate('/dashboard')} />
      </div>
    </div>
  );
}
