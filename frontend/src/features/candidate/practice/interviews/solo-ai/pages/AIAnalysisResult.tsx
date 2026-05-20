import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { aiAnalysisService } from '../services/aiAnalysis.service';
import {
  ArrowLeft,
  Brain,
  CircleCheck,
  CircleAlert,
  Lightbulb,
  Sparkles,
  Video,
  RefreshCw,
} from 'lucide-react';

// 1. Cập nhật Type đúng với JSON thực tế
type Feedback = {
  id: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  comment: string | null; // Đây là nội dung text/transcript
  createdAt: string;
};

type AnalysisResponse = {
  id: number;
  recordingUrl: string | null;
  feedbacks: Feedback[];
  mode: string;
  status: string;
  // Các field khác nếu cần
};

export default function AIAnalysisResult() {
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshingVideo, setIsRefreshingVideo] = useState(false);

  const fetchAnalysis = useCallback(
    async (isRefreshing = false) => {
      try {
        if (!isRefreshing) setLoading(true);
        else setIsRefreshingVideo(true);

        if (!recordingId) return;

        const res = await aiAnalysisService.getSoloRecording(recordingId);
        const finalData = res.data?.data ?? res.data;

        console.log('📦 Dữ liệu đổ lên UI:', finalData);
        setData(finalData);
      } catch (err: any) {
        if (!isRefreshing) {
          setError(err?.response?.data?.message || 'Không tải được kết quả AI analysis');
        }
      } finally {
        setLoading(false);
        setIsRefreshingVideo(false);
      }
    },
    [recordingId],
  );

  useEffect(() => {
    if (recordingId) fetchAnalysis();
  }, [fetchAnalysis, recordingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-sm border px-8 py-10 text-center">
          <Brain className="mx-auto h-10 w-10 mb-4 text-violet-600 animate-pulse" />
          <h2 className="text-2xl font-semibold">Loading AI analysis...</h2>
          <p className="text-slate-500 mt-2">Hệ thống đang lấy kết quả đánh giá.</p>
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

  // 2. Bóc tách dữ liệu từ feedback đầu tiên
  const mainFeedback = data.feedbacks?.[0];
  const score = mainFeedback?.overallScore || 0;
  const strengths = Array.isArray(mainFeedback?.strengths) ? mainFeedback.strengths : [];
  const weaknesses = Array.isArray(mainFeedback?.weaknesses) ? mainFeedback.weaknesses : [];
  const suggestions = Array.isArray(mainFeedback?.suggestions) ? mainFeedback.suggestions : [];
  const transcript = mainFeedback?.comment || 'Không có transcript';
  const videoUrl = data.recordingUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* ĐIỂM SỐ */}
            <div className="bg-white border rounded-3xl shadow-sm p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-3">
                    <Sparkles className="h-4 w-4" /> AI Interview Review
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                    Kết quả đánh giá
                  </h1>
                </div>

                <div className="rounded-3xl bg-violet-600 text-white px-8 py-6 min-w-[160px] text-center shadow-lg">
                  <div className="text-sm uppercase tracking-wide opacity-80">Overall score</div>
                  <div className="text-5xl font-bold mt-2">{score}</div>
                  <div className="text-sm opacity-80 mt-1">/ 10</div>
                </div>
              </div>
            </div>

            {/* TRANSCRIPT */}
            <div className="bg-white border rounded-3xl shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Nội dung trả lời</h2>
              <div className="rounded-2xl bg-slate-50 border p-5 text-slate-700 leading-7 whitespace-pre-wrap italic">
                "{transcript}"
              </div>
            </div>

            {/* VIDEO */}
            <div className="bg-white border rounded-3xl shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Video Recording</h2>
              {videoUrl ? (
                <video
                  controls
                  key={videoUrl} // Force re-render khi URL thay đổi
                  className="w-full rounded-2xl border bg-black shadow-inner"
                  src={videoUrl}
                />
              ) : (
                <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center p-6">
                  <div className="bg-violet-100 p-4 rounded-full mb-4">
                    <Video className="h-8 w-8 text-violet-600 opacity-70" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Video chưa sẵn sàng</h3>
                  <p className="text-slate-500 mb-6 max-w-sm">
                    Hệ thống đang đồng bộ video từ Cloudinary.
                  </p>
                  <button
                    onClick={() => fetchAnalysis(true)}
                    disabled={isRefreshingVideo}
                    className="flex items-center gap-2 bg-white border shadow-sm px-6 py-3 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshingVideo ? 'animate-spin' : ''}`} />
                    Tải lại Video
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* NHẬN XÉT CỘT PHẢI */}
          <div className="space-y-6">
            <Section
              icon={<CircleCheck className="text-green-600" />}
              title="Strengths"
              items={strengths}
              color="bg-green-50 border-green-100"
            />
            <Section
              icon={<CircleAlert className="text-amber-600" />}
              title="Weaknesses"
              items={weaknesses}
              color="bg-amber-50 border-amber-100"
            />
            <Section
              icon={<Lightbulb className="text-violet-600" />}
              title="Suggestions"
              items={suggestions}
              color="bg-violet-50 border-violet-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Component phụ cho gọn code
function Section({
  icon,
  title,
  items,
  color,
}: {
  icon: any;
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="bg-white border rounded-3xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div key={idx} className={`rounded-2xl p-4 text-slate-700 border ${color}`}>
              {item}
            </div>
          ))
        ) : (
          <p className="text-slate-400 italic">Không có dữ liệu</p>
        )}
      </div>
    </div>
  );
}
