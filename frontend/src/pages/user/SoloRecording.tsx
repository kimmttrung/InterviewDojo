import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
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
import { soloRecordingService } from '../../../services/solo-recording.service';

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

  // Toggle States
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    return () => stopStream();
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

      // Reset toggle states when starting new stream
      setIsCamOn(true);
      setIsMicOn(true);
    } catch (err) {
      alert('Could not access Camera/Mic. Please check permissions.');
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
    if (!user) return alert('Please log in to continue');
    setIsUploading(true);

    try {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `solo-${Date.now()}.webm`, { type: 'video/webm' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', String(user.id));
      formData.append('duration', String(seconds));

      // ✅ upload
      const uploadRes = await soloRecordingService.upload(formData);
      const uploadData = uploadRes.data;

      // ✅ analyze
      const analyzeFormData = new FormData();
      analyzeFormData.append('file', file);
      analyzeFormData.append('question', selectedQuestion);

      const analyzeRes = await soloRecordingService.analyze(uploadData.data.id, analyzeFormData);

      setAnalysisResult(analyzeRes.data.data);
      setStep('analysis');
    } catch (err) {
      console.error(err);
      alert('AI analysis failed. Please try again.');
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
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-bold text-lg text-slate-700">Recording Live...</span>
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
                  className={`w-full aspect-video rounded-3xl bg-black border-4 border-white shadow-2xl object-cover transition-opacity ${!isCamOn ? 'opacity-0' : 'opacity-100'}`}
                />

                {/* Visual Feedback for Camera Off */}
                {!isCamOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 rounded-3xl text-white">
                    <div className="bg-slate-800 p-6 rounded-full mb-4">
                      <CameraOff size={48} className="text-slate-500" />
                    </div>
                    <p className="text-lg font-medium">Camera is turned off</p>
                  </div>
                )}

                {/* Floating Controls */}
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <Button
                    variant={isCamOn ? 'secondary' : 'destructive'}
                    size="icon"
                    className="rounded-full h-12 w-12 shadow-xl"
                    onClick={toggleCamera}
                  >
                    {isCamOn ? <Camera size={20} /> : <CameraOff size={20} />}
                  </Button>
                  <Button
                    variant={isMicOn ? 'secondary' : 'destructive'}
                    size="icon"
                    className="rounded-full h-12 w-12 shadow-xl"
                    onClick={toggleMic}
                  >
                    {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                  </Button>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-12">
                  <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center text-white shadow-2xl">
                    <p className="text-sm uppercase tracking-[0.2em] opacity-70 mb-2 font-bold">
                      Your Question:
                    </p>
                    <h2 className="text-xl md:text-2xl font-medium italic">"{selectedQuestion}"</h2>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-20 w-20 rounded-full shadow-2xl p-0 hover:scale-110 transition-transform"
                  onClick={handleStopRecording}
                >
                  <StopCircle size={40} />
                </Button>
              </div>
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
                <Button variant="outline" className="h-14 text-lg" onClick={() => setStep('setup')}>
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

          {/* STEP 4: ANALYSIS RESULT */}
          {step === 'analysis' && analysisResult && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setStep('setup')} className="hover:bg-white">
                  <ArrowLeft className="mr-2" /> Go Back
                </Button>
                <h1 className="text-3xl font-bold">Performance Insight</h1>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-700">
                      <CheckCircle2 className="text-green-500" size={20} /> Speech Transcript
                    </h3>
                    <p className="text-slate-600 leading-relaxed italic text-lg">
                      "{analysisResult.transcript}"
                    </p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4">Actionable Suggestions</h3>
                    <div className="space-y-3">
                      {analysisResult.analysis.suggestions.map((s: string, i: number) => (
                        <div
                          key={i}
                          className="flex gap-4 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100"
                        >
                          <span className="font-black text-blue-400">0{i + 1}</span>
                          <p className="text-sm font-medium">{s}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-8 text-center border-t-4 border-t-indigo-600 shadow-lg">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Overall Quality Score
                    </p>
                    <div className="text-7xl font-black text-indigo-600">
                      {analysisResult.analysis.overallScore}
                      <span className="text-2xl text-slate-300">/10</span>
                    </div>
                  </Card>

                  <Card className="p-6 bg-green-50 border-green-100">
                    <h4 className="font-bold text-green-700 mb-4 flex items-center gap-2">
                      <Zap className="fill-green-700" size={16} /> Key Strengths
                    </h4>
                    <ul className="space-y-3">
                      {analysisResult.analysis.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-green-800 flex items-start gap-3">
                          <div className="mt-1 h-2 w-2 rounded-full bg-green-500 shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-6 bg-red-50 border-red-100">
                    <h4 className="font-bold text-red-700 mb-4 flex items-center gap-2">
                      <AlertCircle size={16} /> Improvement Areas
                    </h4>
                    <ul className="space-y-3">
                      {analysisResult.analysis.weaknesses.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-red-800 flex items-start gap-3">
                          <div className="mt-1 h-2 w-2 rounded-full bg-red-400 shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>

              <div className="text-center pt-8">
                <Button
                  size="lg"
                  className="bg-indigo-600 px-16 h-14 text-lg"
                  onClick={() => setStep('setup')}
                >
                  Practice Another Question
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
