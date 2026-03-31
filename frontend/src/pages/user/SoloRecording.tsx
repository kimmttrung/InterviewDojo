import { useEffect, useRef, useState } from 'react';

export default function SoloRecording() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await startCamera();
    }

    chunksRef.current = [];
    setSeconds(0);

    const stream = streamRef.current!;
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm',
    });

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    };

    recorder.start(1000);
    setIsRecording(true);

    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const uploadRecording = async () => {
    if (!user) {
      alert('Bạn cần đăng nhập');
      return;
    }

    if (chunksRef.current.length === 0) {
      alert('Chưa có video để upload');
      return;
    }

    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const file = new File([blob], `solo-recording-${Date.now()}.webm`, {
      type: 'video/webm',
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', String(user.id));
    formData.append('duration', String(seconds));

    try {
      setIsUploading(true);

      const res = await fetch('http://localhost:3000/api/v1/solo-recordings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload thất bại');
      }

      const data = await res.json();
      console.log('Upload success:', data);
      alert('Lưu video thành công!');
    } catch (error) {
      console.error(error);
      alert('Không thể upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (total: number) => {
    const mm = String(Math.floor(total / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Solo Recording</h1>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full rounded-xl border bg-black"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={startCamera}
          className="px-4 py-2 rounded bg-gray-200"
        >
          Mở Camera/Mic
        </button>

        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 rounded bg-red-600 text-white"
          >
            Record
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 rounded bg-slate-800 text-white"
          >
            Stop
          </button>
        )}

        <span className="font-medium">Thời gian: {formatTime(seconds)}</span>
      </div>

      {previewUrl && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Xem lại video</h2>
          <video
            src={previewUrl}
            controls
            className="w-full rounded-xl border"
          />

          <button
            onClick={uploadRecording}
            disabled={isUploading}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {isUploading ? 'Đang upload...' : 'Lưu lên Cloud'}
          </button>
        </div>
      )}
    </div>
  );
}