import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Brain,
  CalendarClock,
  CircleCheck,
  CircleAlert,
  Lightbulb,
  FileText,
  Sparkles,
} from 'lucide-react';

type AnalysisResponse = {
  id: number;
  soloRecordingId: number;
  transcript: string | null;
  overallScore: number;
  strengths: string[] | null;
  weaknesses: string[] | null;
  suggestions: string[] | null;
  processedAt: string;
  soloRecording?: {
    id: number;
    videoUrl: string;
    duration?: number | null;
    createdAt?: string;
  };
};

const API_BASE = 'http://localhost:3000/api/v1';

export default function AIAnalysisResult() {
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE}/ai-analysis/solo-recording/${recordingId}`,
        );
        setData(res.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || 'Không tải được kết quả AI analysis',
        );
      } finally {
        setLoading(false);
      }
    };

    if (recordingId) {
      fetchAnalysis();
    }
  }, [recordingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-sm border px-8 py-10 text-center">
          <Brain className="mx-auto h-10 w-10 mb-4 text-violet-600 animate-pulse" />
          <h2 className="text-2xl font-semibold">Loading AI analysis...</h2>
          <p className="text-slate-500 mt-2">
            Hệ thống đang lấy kết quả đánh giá từ backend.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border p-8 max-w-lg w-full text-center">
          <CircleAlert className="mx-auto h-10 w-10 text-red-500 mb-4" />
          <h2 className="text-2xl font-semibold">Không tải được kết quả</h2>
          <p className="text-slate-500 mt-2">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-5 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const score = Number(data.overallScore || 0);
  const strengths = Array.isArray(data.strengths) ? data.strengths : [];
  const weaknesses = Array.isArray(data.weaknesses) ? data.weaknesses : [];
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-3xl shadow-sm p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-3">
                    <Sparkles className="h-4 w-4" />
                    AI Interview Review
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                    Kết quả đánh giá câu trả lời
                  </h1>
                  <p className="text-slate-500 mt-2">
                    Review từ transcript và nội dung trả lời của ứng viên.
                  </p>
                </div>

                <div className="rounded-3xl bg-violet-600 text-white px-8 py-6 min-w-[160px] text-center shadow-lg">
                  <div className="text-sm uppercase tracking-wide opacity-80">
                    Overall score
                  </div>
                  <div className="text-5xl font-bold mt-2">{score}</div>
                  <div className="text-sm opacity-80 mt-1">/ 10</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <CalendarClock className="h-4 w-4" />
                    Processed at
                  </div>
                  <p className="text-slate-900 mt-2">
                    {new Date(data.processedAt).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <FileText className="h-4 w-4" />
                    Recording ID
                  </div>
                  <p className="text-slate-900 mt-2">#{data.soloRecordingId}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-3xl shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Transcript
              </h2>
              <div className="rounded-2xl bg-slate-50 border p-5 text-slate-700 leading-7 whitespace-pre-wrap">
                {data.transcript || 'Chưa có transcript'}
              </div>
            </div>

            {data.soloRecording?.videoUrl && (
              <div className="bg-white border rounded-3xl shadow-sm p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                  Recording
                </h2>
                <video
                  controls
                  className="w-full rounded-2xl border bg-black"
                  src={data.soloRecording.videoUrl}
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white border rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <CircleCheck className="h-5 w-5 text-green-600" />
                <h3 className="text-xl font-semibold">Strengths</h3>
              </div>
              <div className="space-y-3">
                {strengths.length ? (
                  strengths.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-green-50 border border-green-100 p-4 text-slate-700"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Chưa có dữ liệu.</p>
                )}
              </div>
            </div>

            <div className="bg-white border rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <CircleAlert className="h-5 w-5 text-amber-600" />
                <h3 className="text-xl font-semibold">Weaknesses</h3>
              </div>
              <div className="space-y-3">
                {weaknesses.length ? (
                  weaknesses.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-slate-700"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Chưa có dữ liệu.</p>
                )}
              </div>
            </div>

            <div className="bg-white border rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-violet-600" />
                <h3 className="text-xl font-semibold">Suggestions</h3>
              </div>
              <div className="space-y-3">
                {suggestions.length ? (
                  suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-violet-50 border border-violet-100 p-4 text-slate-700"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Chưa có dữ liệu.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}