import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Mic,
  StopCircle,
  Play,
  Save,
  RefreshCcw,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Layout } from '../../../components/Layout';

// Danh sách câu hỏi mẫu
const MOCK_QUESTIONS = [
  'Tell me about yourself',
  'What are your strengths and weaknesses?',
  'Why do you want to work at this company?',
  'Describe a difficult technical challenge you faced.',
  'Where do you see yourself in 5 years?',
];

export default function SoloRecording() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'setup' | 'recording' | 'preview' | 'analysis'>('setup');

  // Refs & Media
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // State
  const [selectedQuestion, setSelectedQuestion] = useState(MOCK_QUESTIONS[0]);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [recordingId, setRecordingId] = useState<number | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Dọn dẹp stream khi unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Không thể truy cập Camera/Mic');
    }
  };

  const handleStartInterview = async () => {
    setStep('recording');
    await initCamera();
    startRecording();
  };

  const startRecording = () => {
    chunksRef.current = [];
    setSeconds(0);
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
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval((window as any).recordingTimer);
    stopStream();
    setStep('preview');
  };

  const handleUploadAndAnalyze = async () => {
    if (!user) return alert('Vui lòng đăng nhập');
    setIsUploading(true);

    try {
      // 1. Upload Video lên Cloudinary & Save DB
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `solo-${Date.now()}.webm`, { type: 'video/webm' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', String(user.id));
      formData.append('duration', String(seconds));

      const uploadRes = await fetch('http://localhost:3000/api/v1/solo-recordings/upload', {
        method: 'POST',
        body: formData,
      });
      console.log('check res', uploadRes);
      const uploadData = await uploadRes.json();
      console.log('check upload', uploadData);

      // 2. Gọi API Analyze (Theo ảnh mẫu của bạn)
      const analyzeFormData = new FormData();
      analyzeFormData.append('file', file);
      analyzeFormData.append('question', selectedQuestion);

      const analyzeRes = await fetch(
        `http://localhost:3000/api/v1/solo-recordings/${uploadData.data.id}/analyze`,
        {
          method: 'POST',
          body: analyzeFormData,
        },
      );
      console.log('check ai', analyzeRes);
      const finalResult = await analyzeRes.json();

      setAnalysisResult(finalResult.data);
      setStep('analysis');
    } catch (err) {
      alert('Xử lý thất bại');
    } finally {
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
                <h1 className="text-4xl font-extrabold tracking-tight">Solo AI Interview</h1>
                <p className="text-muted-foreground text-lg">
                  Luyện tập trả lời phỏng vấn và nhận đánh giá từ AI
                </p>
              </div>

              <Card className="p-8 max-w-2xl mx-auto space-y-6 shadow-xl border-t-4 border-t-indigo-600">
                <div className="text-left space-y-4">
                  <label className="font-bold text-sm uppercase tracking-wider text-slate-500">
                    Chọn câu hỏi phỏng vấn
                  </label>
                  <select
                    className="w-full p-4 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    <Camera className="text-indigo-600" />
                    <span className="text-sm">Tự động bật Camera</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-dashed">
                    <Mic className="text-indigo-600" />
                    <span className="text-sm">Ghi âm chất lượng cao</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleStartInterview}
                >
                  Bắt đầu phỏng vấn
                </Button>
              </Card>
            </div>
          )}

          {/* STEP 2: RECORDING */}
          {step === 'recording' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-bold text-lg text-slate-700">Đang ghi hình...</span>
                </div>
                <div className="text-2xl font-mono font-bold text-indigo-600">
                  {Math.floor(seconds / 60)
                    .toString()
                    .padStart(2, '0')}
                  :{(seconds % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="relative group">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full aspect-video rounded-3xl bg-black border-4 border-white shadow-2xl object-cover"
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-12">
                  <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center text-white">
                    <p className="text-sm uppercase tracking-[0.2em] opacity-70 mb-2 font-semibold">
                      Câu hỏi của bạn:
                    </p>
                    <h2 className="text-xl md:text-2xl font-medium">"{selectedQuestion}"</h2>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-16 w-16 rounded-full shadow-orange-200 shadow-2xl p-0"
                  onClick={handleStopRecording}
                >
                  <StopCircle size={32} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === 'preview' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Phỏng vấn hoàn tất!</h2>
                <p className="text-muted-foreground">
                  Bạn có thể xem lại video trước khi gửi cho AI phân tích
                </p>
              </div>

              <video
                src={previewUrl!}
                controls
                className="w-full aspect-video rounded-2xl shadow-lg border-2 border-white bg-black"
              />

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-12" onClick={() => setStep('setup')}>
                  <RefreshCcw className="mr-2" size={18} /> Thử lại câu khác
                </Button>
                <Button
                  className="h-12 bg-indigo-600"
                  disabled={isUploading}
                  onClick={handleUploadAndAnalyze}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" /> Đang phân tích...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2" /> Lưu & Xem phân tích AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: ANALYSIS RESULT (Theo ảnh mẫu) */}
          {step === 'analysis' && analysisResult && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setStep('setup')}>
                  <ArrowLeft className="mr-2" /> Quay lại
                </Button>
                <h1 className="text-2xl font-bold">Kết quả phân tích từ AI</h1>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Cột trái: Transcript & Score */}
                <div className="md:col-span-2 space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <CheckCircle2 className="text-green-500" size={20} /> Transcript của bạn
                    </h3>
                    <p className="text-slate-600 leading-relaxed italic">
                      "{analysisResult.transcript}"
                    </p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4">Gợi ý cải thiện (Suggestions)</h3>
                    <div className="space-y-3">
                      {analysisResult.analysis.suggestions.map((s: string, i: number) => (
                        <div
                          key={i}
                          className="flex gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100"
                        >
                          <span className="font-bold">#{i + 1}</span>
                          <p className="text-sm">{s}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Cột phải: Score & Strengths/Weaknesses */}
                <div className="space-y-6">
                  <Card className="p-6 text-center border-t-4 border-t-indigo-600">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                      Overall Score
                    </p>
                    <div className="text-6xl font-black text-indigo-600 my-2">
                      {analysisResult.analysis.overallScore}
                      <span className="text-2xl text-slate-300">/10</span>
                    </div>
                  </Card>

                  <Card className="p-6 bg-green-50 border-green-100">
                    <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                      <Zap className="fill-green-700" size={16} /> Strengths
                    </h4>
                    <ul className="space-y-2">
                      {analysisResult.analysis.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />{' '}
                          {s}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-6 bg-red-50 border-red-100">
                    <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                      <AlertCircle size={16} /> Weaknesses
                    </h4>
                    <ul className="space-y-2">
                      {analysisResult.analysis.weaknesses.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />{' '}
                          {s}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>

              <div className="text-center pt-8">
                <Button size="lg" className="bg-indigo-600 px-12" onClick={() => setStep('setup')}>
                  Luyện tập câu hỏi khác
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Icon Zap giả định nếu chưa import
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
