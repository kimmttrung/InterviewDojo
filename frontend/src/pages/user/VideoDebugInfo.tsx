// src/components/interview/VideoDebugInfo.tsx
import { useEffect, useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

export function VideoDebugInfo() {
  const call = useCall();
  const { useLocalParticipant, useRemoteParticipants } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const [deviceStatus, setDeviceStatus] = useState({
    camera: false,
    microphone: false,
    cameraError: null as string | null,
    micError: null as string | null,
  });

  useEffect(() => {
    const checkDevices = async () => {
      try {
        // Kiểm tra camera
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === 'videoinput');
        const mics = devices.filter((device) => device.kind === 'audioinput');

        console.log('📹 Available cameras:', cameras);
        console.log('🎤 Available microphones:', mics);

        // Kiểm tra permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();

        setDeviceStatus({
          camera: videoTracks.length > 0 && videoTracks[0].enabled,
          microphone: audioTracks.length > 0 && audioTracks[0].enabled,
          cameraError: null,
          micError: null,
        });

        // Cleanup
        stream.getTracks().forEach((track) => track.stop());
      } catch (error: any) {
        console.error('❌ Device error:', error);
        setDeviceStatus((prev) => ({
          ...prev,
          cameraError: error.message,
          micError: error.message,
        }));
      }
    };

    checkDevices();
  }, []);

  return (
    <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded-lg z-50 space-y-1 font-mono">
      <div className="font-bold mb-1">🔍 Video Debug Info</div>
      <div>Call State: {call?.state?.callingState || 'Unknown'}</div>
      <div>Local Participant: {localParticipant?.userId || 'No'}</div>
      <div>Remote Participants: {remoteParticipants.length}</div>
      <div>
        📹 Camera: {deviceStatus.camera ? '✅' : '❌'}{' '}
        {deviceStatus.cameraError && `(${deviceStatus.cameraError})`}
      </div>
      <div>🎤 Mic: {deviceStatus.microphone ? '✅' : '❌'}</div>
      <div>Room ID: {call?.id}</div>
      <button
        onClick={() => console.log('Call details:', call)}
        className="bg-blue-500 px-2 py-0.5 rounded text-xs mt-1"
      >
        Log Call Details
      </button>
    </div>
  );
}
