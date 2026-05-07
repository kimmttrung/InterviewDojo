import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  StopCircle,
  RefreshCcw,
  Loader2,
  Brain,
  Maximize,
  Minimize,
  Subtitles,
  MessageSquare,
  MessageSquareOff,
  Pause,
  Play,
} from 'lucide-react';
import { soloRecordingService } from '../services/solo-recording.service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Layout } from '../../../../../../shared/components/layout/Layout';
import { Card } from '../../../../../../shared/components/ui/card';
import { Button } from '../../../../../../shared/components/ui/button';

const MOCK_QUESTIONS = [
  'Giới thiệu về bản thân bạn.',
  'Điểm yếu và mạnh của bạn là gì?',
  'Tại sao bạn muốn làm việc tại công ty này?',
  'Mô tả một thách thức kỹ thuật khó khăn mà bạn đã đối mặt.',
  'Trong 5 năm tới, bạn sẽ phát triển như thế nào?',
];

export default function SoloRecording() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'setup' | 'recording' | 'preview' | 'analysis'>('setup');

  // Refs & Media
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  // State
  const [selectedQuestion, setSelectedQuestion] = useState(MOCK_QUESTIONS[0]);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // State live
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isInterim, setIsInterim] = useState('');

  // Toggle States
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  //AUTO-SCROLL TRANSCRIPT
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [liveTranscript, isInterim]);

  //FULLSCREEN CỦA TRÌNH DUYỆT
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // StopStream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Toggle Camera Logic
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOn(videoTrack.enabled);
      }
    }
  };

  // Toggle Mic Logic
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // Toggle Fullscreen Logic
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await videoContainerRef.current?.requestFullscreen().catch((err) => console.error(err));
    } else {
      await document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  // Toggle Pause/Resume Recording & Speech Recognition
  const togglePauseResume = useCallback(() => {
    if (step !== 'recording' || !mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state === 'recording') {
      // TẠM DỪNG
      mediaRecorderRef.current.pause();
      recognitionRef.current?.stop();
      clearInterval((window as any).recordingTimer);
      setIsPaused(true);
      toast.warning('Đã tạm dừng ghi hình', { description: 'Nhấn Space để tiếp tục' });
    } else if (mediaRecorderRef.current.state === 'paused') {
      // TIẾP TỤC
      mediaRecorderRef.current.resume();

      recognitionRef.current?.start();

      const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
      (window as any).recordingTimer = timer;
      setIsPaused(false);
      toast.success('Đã tiếp tục ghi hình', { description: 'Hệ thống đang thu âm...' });
    }
  }, [step]);

  // Start Recording
  const startRecording = () => {
    chunksRef.current = [];
    setSeconds(0);
    setLiveTranscript('');
    setIsInterim('');
    setIsPaused(false);
    const recorder = new MediaRecorder(streamRef.current!, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setPreviewUrl(URL.createObjectURL(blob));
    };

    recorder.start(1000);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    (window as any).recordingTimer = timer;

    recognitionRef.current?.start();
  };

  // Stop stream
  useEffect(() => {
    return () => stopStream();
  }, []);

  // Start stream
  useEffect(() => {
    if (step === 'recording' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      startRecording();
    }
  }, [step]);

  // Live stream speech
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'vi-VN'; // Đặt ngôn ngữ tiếng Việt

      recognition.onresult = (event: any) => {
        if (isPaused) return;
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + ' ';
          } else {
            interimChunk += event.results[i][0].transcript;
          }
        }
        if (finalChunk) {
          setLiveTranscript((prev) => prev + finalChunk);
        }
        setIsInterim(interimChunk);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        if (step === 'recording' && !isPaused) {
          try {
            recognition.start();
          } catch (e) {
            throw new Error('Speech recognition failed to restart: ' + e);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [step, isPaused]);

  // Space pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chặn cuộn trang khi bấm Space lúc đang record
      if (e.code === 'Space' && step === 'recording') {
        e.preventDefault();
        togglePauseResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, togglePauseResume]);

  // Try Again
  const handleTryAgain = () => {
    //stopStream();
    recognitionRef.current?.abort();

    setLiveTranscript('');
    setIsInterim('');
    setStep('setup');
    setSeconds(0);
    setPreviewUrl(null);
    chunksRef.current = [];
  };

  //  Start Interview
  const handleStartInterview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setIsCamOn(true);
      setIsMicOn(true);

      // Đổi sang màn hình recording -> Tự động kích hoạt useEffect số 2 để đếm giờ
      setStep('recording');
    } catch (err) {
      alert('Không thể truy cập Camera/Mic. Vui lòng kiểm tra quyền trên trình duyệt.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearInterval((window as any).recordingTimer);

    recognitionRef.current?.abort();

    stopStream();
    setStep('preview');
  };

  // Hàm tách audio từ video blob một cách đúng chuẩn (sử dụng Web Audio API)
  const extractAudioFromVideoBlob = async (videoBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;

          // Decode video blob thành AudioBuffer (chỉ lấy phần audio)
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Tạo OfflineAudioContext để render lại audio
          const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate,
          );

          const source = offlineContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(offlineContext.destination);
          source.start(0);

          const renderedBuffer = await offlineContext.startRendering();

          // Convert AudioBuffer thành WAV (dễ upload và Azure Speech xử lý tốt)
          const wavBlob = audioBufferToWav(renderedBuffer);
          resolve(wavBlob);
        } catch (err) {
          console.error('Extract audio failed:', err);
          // Fallback: thử gửi video blob với type audio/webm
          resolve(new Blob([videoBlob], { type: 'audio/webm' }));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(videoBlob);
    });
  };

  // Helper: Convert AudioBuffer → WAV Blob (rất cần cho Azure Speech)
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = buffer.length * blockAlign;
    const bufferSize = 44 + dataSize; // WAV header 44 bytes

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt subchunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data subchunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // ==========================================
  // HÀM CHÍNH: ĐIỀU PHỐI LUỒNG CHẠY
  // Ver 5: Chạy ngầm upload video, song song với AI analysis
  const handleUploadAndAnalyze = async () => {
    if (!user) return alert('Please log in to continue');
    const finalTranscriptText = (liveTranscript + ' ' + isInterim).trim();
    if (!finalTranscriptText) {
      return alert('Không nhận diện được giọng nói của bạn. Vui lòng thử thu âm lại!');
    }
    setIsUploading(true);

    try {
      // 1. Chuẩn bị file
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      const videoFile = new File([videoBlob], 'video.webm', { type: 'video/webm' });

      console.log('Bắt đầu tách audio từ video...');
      const audioBlob = await extractAudioFromVideoBlob(videoBlob);
      const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

      // 2. CHUẨN BỊ FORM DATA CHO CẢ HAI
      const analyzePayload = {
        userId: Number(user.id),
        duration: seconds,
        question: selectedQuestion,
        transcript: finalTranscriptText,
      };

      const videoFormData = new FormData();
      videoFormData.append('file', videoFile, 'video.webm');

      console.log('🚀 Bắn TEXT (JSON) và Video (FormData) đi cùng lúc...');
      const audioPromise = soloRecordingService.uploadAudioAndAnalyze(analyzePayload);
      const videoPromise = soloRecordingService.uploadVideo(videoFormData);

      // 4. CHỈ CHỜ AUDIO & AI PHÂN TÍCH (Ưu tiên UX - Trả kết quả ngay)
      const analyzeRes = await audioPromise;
      let analysisData = analyzeRes?.data || analyzeRes;
      if (analysisData?.data) analysisData = analysisData.data;
      if (analysisData?.data) analysisData = analysisData.data;

      // Bắt chính xác ID của bản ghi để tý nữa gắn Video vào
      const currentRecordingId = analysisData?.sessionId || analysisData?.id;

      console.log('✅ Dữ liệu bóc được:', analysisData);
      console.log('✅ ID Bản ghi hiện tại:', currentRecordingId);
      console.log('✅ Phân tích AI hoàn tất! ID Bản ghi hiện tại:', currentRecordingId);

      if (!currentRecordingId) {
        alert('Không lấy được ID bản ghi từ Backend! Hãy kiểm tra console log.');
        setIsUploading(false);
        return;
      }

      navigate(`/ai-analysis/${currentRecordingId}`);

      setIsUploading(false);

      // 5. XỬ LÝ VIDEO CHẠY NGẦM DƯỚI BACKGROUND
      videoPromise
        .then(async (videoRes: any) => {
          console.group('--- 🔍 DEBUG LUỒNG VIDEO NGẦM ---');
          console.log('1. Phản hồi gốc từ API Upload Video:', videoRes);

          // Bóc tách lớp dữ liệu (Quét mọi ngóc ngách của Axios)
          let vPayload = videoRes?.data || videoRes;
          if (vPayload?.data) vPayload = vPayload.data;
          if (vPayload?.data) vPayload = vPayload.data;

          // Lấy URL: Ưu tiên 'videoUrl' do Backend trả về, phòng hờ 'secure_url' của Cloudinary
          const finalVideoUrl = vPayload?.videoUrl || vPayload?.secure_url;
          const finalPublicId = vPayload?.publicId || vPayload?.public_id;

          console.log('2. URL bóc được:', finalVideoUrl);
          console.log('3. ID Bản ghi chuẩn bị ghép:', currentRecordingId);

          if (finalVideoUrl && finalPublicId && currentRecordingId) {
            console.log('4. 🚀 Đang bắn lệnh PATCH lên server để lưu Database...');

            // Gọi API PATCH cập nhật URL
            const patchRes = await soloRecordingService.updateVideoUrl(
              currentRecordingId,
              finalVideoUrl,
              finalPublicId,
            );

            console.log('5. 🎉 Server trả lời PATCH thành công:', patchRes?.data || 'OK');
          } else {
            console.warn('⚠️ THẤT BẠI: Thiếu URL Video hoặc Thiếu ID Bản ghi! Không thể cập nhật.');
          }
          console.groupEnd();
        })
        .catch((err) => {
          console.error('❌ Upload video ngầm bị lỗi:', err.response?.data || err);
        });
    } catch (err: any) {
      console.error('Lỗi nghiêm trọng trong luồng AI:', err.response?.data || err);
      // Hiển thị thông báo thân thiện nếu lỗi 422 (Không có tiếng)
      const errorMessage =
        err.response?.data?.message ||
        'Không thể thực hiện phân tích AI. Vui lòng kiểm tra lại mic.';
      alert(errorMessage);
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* STEP 1: SETUP */}
          {step === 'setup' && (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                  Solo AI Interview
                </h1>
                <p className="text-muted-foreground text-lg">
                  Practice your interview answers and receive AI-powered feedback.
                </p>
              </div>

              <Card className="p-8 max-w-2xl mx-auto space-y-6 shadow-xl border-t-4 border-t-indigo-600">
                <div className="text-left space-y-4">
                  <label className="font-bold text-sm uppercase tracking-wider text-slate-500">
                    Choose a Question
                  </label>
                  <select
                    className="w-full p-4 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                  >
                    {MOCK_QUESTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-dashed">
                    <Camera className="text-indigo-600" size={20} />
                    <span className="text-sm font-medium">Auto Camera On</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-dashed">
                    <Mic className="text-indigo-600" size={20} />
                    <span className="text-sm font-medium">HD Audio Recording</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                  onClick={handleStartInterview}
                >
                  Start Practice Session
                </Button>
              </Card>
            </div>
          )}

          {/* STEP 2: RECORDING */}
          {step === 'recording' && (
            <div
              className={`space-y-6 animate-in slide-in-from-bottom-4 duration-500 ${isFullscreen ? 'h-screen flex flex-col justify-center' : ''}`}
            >
              {/* Thanh Header: Ẩn đi khi đang Fullscreen */}
              {!isFullscreen && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                  <div className="flex items-center gap-4">
                    {isPaused ? (
                      <div className="h-3 w-3 bg-amber-500 rounded-full" />
                    ) : (
                      <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                    <span className="font-bold text-lg text-slate-700">
                      {isPaused ? 'Paused' : 'Recording Live...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full hidden sm:block">
                      Press SPACE to Pause
                    </span>
                    <div
                      className={`text-2xl font-mono font-bold ${isPaused ? 'text-amber-500' : 'text-indigo-600'}`}
                    >
                      {Math.floor(seconds / 60)
                        .toString()
                        .padStart(2, '0')}
                      :{(seconds % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              )}

              {/* KHUNG VIDEO CHÍNH */}
              <div
                ref={videoContainerRef}
                className={`relative group bg-black rounded-3xl overflow-hidden ${isFullscreen ? 'w-full h-full border-0 rounded-none' : 'aspect-video border-4 border-white shadow-2xl'}`}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover transition-opacity ${!isCamOn ? 'opacity-0' : 'opacity-100'}`}
                />

                {!isCamOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white">
                    <div className="bg-slate-800 p-6 rounded-full mb-4">
                      <CameraOff size={48} className="text-slate-500" />
                    </div>
                    <p className="text-lg font-medium">Camera is turned off</p>
                  </div>
                )}

                {/* Màn hình mờ khi Paused */}
                {isPaused && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in fade-in">
                    <div className="bg-amber-500/20 p-6 rounded-full mb-4">
                      <Pause size={48} className="text-amber-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Đã tạm dừng</h2>
                    <p className="text-amber-200 text-lg font-medium">
                      Nhấn phím SPACE để tiếp tục
                    </p>
                  </div>
                )}

                {/* Subtitle STT (Có thể ẩn/hiện và cuộn) */}
                {showTranscript && (
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-4/5 max-w-3xl pointer-events-none z-0">
                    <div className="bg-black/70 backdrop-blur-md p-5 rounded-xl border border-white/10 text-white shadow-lg flex flex-col h-[140px]">
                      <p className="text-xs uppercase tracking-widest text-indigo-300 mb-2 font-bold shrink-0">
                        Live Transcript
                      </p>
                      <div
                        ref={transcriptScrollRef}
                        className="flex-1 overflow-y-auto pr-2 scroll-smooth pointer-events-auto"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(255,255,255,0.2) transparent',
                        }}
                      >
                        <p className="text-lg leading-relaxed font-medium">
                          {liveTranscript}
                          <span className="text-indigo-200 italic"> {isInterim}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Câu hỏi (Có thể ẩn/hiện) */}
                {showQuestion && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-12 pointer-events-none z-0">
                    <div className="bg-indigo-600/95 backdrop-blur-md py-3 px-6 rounded-full border border-white/20 text-center text-white shadow-xl inline-block max-w-full truncate">
                      <span className="text-sm font-bold uppercase tracking-wider opacity-80 mr-2">
                        Q:
                      </span>
                      <span className="font-medium text-lg">"{selectedQuestion}"</span>
                    </div>
                  </div>
                )}

                {/* CỤM NÚT BẤM (Floating Controls) */}
                <div
                  className={`absolute right-6 flex flex-col gap-3 z-20 transition-all ${isFullscreen ? 'top-1/2 -translate-y-1/2' : 'top-6'}`}
                >
                  {isFullscreen && (
                    <div
                      className={`bg-black/60 backdrop-blur-md rounded-full py-3 px-4 text-center border border-white/20 mb-2 ${isPaused ? 'text-amber-500' : 'text-white'}`}
                    >
                      <div className="text-sm font-bold">
                        {Math.floor(seconds / 60)
                          .toString()
                          .padStart(2, '0')}
                        :{(seconds % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleCamera}
                    className={`rounded-full h-12 w-12 border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 ${isCamOn ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-red-500 border-red-400 text-white hover:bg-red-600'}`}
                  >
                    {isCamOn ? <Camera size={20} /> : <CameraOff size={20} />}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMic}
                    className={`rounded-full h-12 w-12 border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 ${isMicOn ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-red-500 border-red-400 text-white hover:bg-red-600'}`}
                  >
                    {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                  </Button>

                  <div className="w-12 border-t border-white/20 my-1" />

                  {/* Tạm dừng */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePauseResume}
                    className={`rounded-full h-12 w-12 border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 ${isPaused ? 'bg-amber-500 border-amber-400 text-white' : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'}`}
                  >
                    {isPaused ? <Play size={20} className="ml-1" /> : <Pause size={20} />}
                  </Button>

                  {/* Ẩn/hiện chữ */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className={`rounded-full h-12 w-12 border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 ${showTranscript ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-600 text-white'}`}
                  >
                    <Subtitles size={20} />
                  </Button>

                  {/* Ẩn/hiện câu hỏi */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowQuestion(!showQuestion)}
                    className={`rounded-full h-12 w-12 border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 ${showQuestion ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-600 text-white'}`}
                  >
                    {showQuestion ? <MessageSquare size={20} /> : <MessageSquareOff size={20} />}
                  </Button>

                  {/* Phóng to */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="rounded-full h-12 w-12 border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </Button>

                  {/* Nút Kết thúc dời vào trong khi Fullscreen */}
                  {isFullscreen && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={handleStopRecording}
                      className="rounded-full h-14 w-14 shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:scale-110 mt-4 bg-red-500 hover:bg-red-600"
                    >
                      <StopCircle size={28} />
                    </Button>
                  )}
                </div>
              </div>

              {!isFullscreen && (
                <div className="flex justify-center pt-4">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-20 w-20 rounded-full shadow-2xl p-0 hover:scale-110 transition-transform bg-red-500 hover:bg-red-600"
                    onClick={handleStopRecording}
                  >
                    <StopCircle size={40} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === 'preview' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Session Completed!</h2>
                <p className="text-muted-foreground">Review your performance before AI analysis.</p>
              </div>

              <video
                src={previewUrl!}
                controls
                className="w-full aspect-video rounded-2xl shadow-2xl border-2 border-white bg-black"
              />

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-14 text-lg" onClick={handleTryAgain}>
                  <RefreshCcw className="mr-2" size={20} /> Try Again
                </Button>
                <Button
                  className="h-14 text-lg bg-indigo-600 hover:bg-indigo-700"
                  disabled={isUploading}
                  onClick={handleUploadAndAnalyze}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" /> Analyzing Results...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2" /> Get AI Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Custom Zap Icon
function Zap({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
    </svg>
  );
}
