import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, ShieldCheck, Zap, ArrowLeft, Star, Quote } from 'lucide-react';
import { matchingService } from '../services/matching.service';
import { useSocketStore } from '@/stores/useSocketStore';
import { Layout } from '@/shared/components/layout/Layout';
import { Button } from '@/shared/components/ui/button';
import { useCurrentUser } from '@/features/auth';
import { ReceivedFeedbackModal } from '@/features/shared-domain/feedback/components/ReceivedFeedbackModal';

// Dữ liệu nhận xét (Testimonials)
const testimonials = [
  {
    name: 'Nguyễn Văn A',
    role: 'Frontend Developer',
    content:
      'Hệ thống ghép cặp rất nhanh, tôi đã tìm được một partner trình độ tương đương chỉ trong vài giây. Rất tuyệt vời!',
    rating: 5,
  },
  {
    name: 'Trần Thị B',
    role: 'Backend Engineer',
    content:
      'Môi trường thực hành phỏng vấn chuyên nghiệp. Nhờ các buổi P2P mà tôi tự tin hơn rất nhiều khi phỏng vấn thật.',
    rating: 5,
  },
  {
    name: 'Lê Hoàng C',
    role: 'Fullstack Student',
    content:
      'Chức năng review chéo sau phỏng vấn giúp tôi nhận ra nhiều điểm yếu của bản thân mà trước nay không để ý.',
    rating: 4,
  },
  {
    name: 'Phạm Thị D',
    role: 'Data Analyst',
    content:
      'Cộng đồng rất thân thiện. Tôi đã học được cách trả lời câu hỏi system design cực hay từ bạn cùng phòng.',
    rating: 5,
  },
];

export default function PeerMatchingPage() {
  const navigate = useNavigate();
  const { connect, socket } = useSocketStore();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  const [showReceivedFeedback, setShowReceivedFeedback] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [timer, setTimer] = useState(0);

  // State cho Testimonial Pagination
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // ==================== TIMER ====================
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isSearching) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSearching]);

  // ==================== AUTO SLIDE TESTIMONIALS ====================
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Tự động chuyển trang sau 5 giây
    return () => clearInterval(slideInterval);
  }, []);

  // ==================== SOCKET CONNECT ====================
  useEffect(() => {
    if (!user?.id) return;
    connect(user.id);
    console.log('🔌 Connecting socket with user ID:', user.id);
  }, [user?.id, connect]);

  // ==================== LISTEN SOCKET ====================
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data: { roomId: string; sessionId: number; token: string }) => {
      console.log('MATCH FOUND:', data);
      setIsSearching(false);
      navigate(`/interview/${data.roomId}?token=${data.token}&sessionId=${data.sessionId}`);
    };

    socket.on('match_found', handleMatchFound);
    return () => {
      socket.off('match_found', handleMatchFound);
    };
  }, [socket, navigate]);

  // ==================== START MATCHING ====================
  const handleStartMatching = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để tiếp tục!');
      return;
    }

    const { socket } = useSocketStore.getState();

    if (!socket?.connected) {
      console.log('⏳ waiting for socket...');
      await new Promise<void>((resolve) => {
        socket?.once('connect', () => {
          console.log('socket connected (await)');
          resolve();
        });
      });
    }

    console.log('🚀 socket ready → start matching');
    setIsSearching(true);

    try {
      console.log(user.id, 'is joining the queue for level Junior');
      const { data } = await matchingService.join({
        userId: user.id,
        level: 'Junior',
      });

      if (data.status === 'matched') {
        setIsSearching(false);
        navigate(`/interview/${data.roomId}?token=${data.token}`);
      }
    } catch (error: any) {
      console.error(error);
      setIsSearching(false);
      alert(error?.response?.data?.message || 'Server error');
    }
  };

  // ==================== LOADING & AUTH STATE ====================
  if (isUserLoading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
          <p>Bạn cần đăng nhập để sử dụng tính năng này.</p>
          <Button onClick={() => navigate('/login')}>Đăng nhập</Button>
        </div>
      </Layout>
    );
  }

  // ==================== MAIN UI ====================
  return (
    <Layout>
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Vùng bao bọc chính đồng bộ với HomePage */}
      <div className="relative min-h-[calc(100vh-4rem)] flex flex-col pt-16 pb-20 px-4 md:px-8 overflow-hidden bg-gradient-to-b from-transparent via-background/50 to-muted/20">
        {/* Lớp màu chuyển động phía sau */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-purple-500/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-10 left-1/3 w-[500px] h-[500px] bg-pink-500/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        {/* Nút điều hướng */}
        <div className="relative z-20 w-full max-w-6xl mx-auto flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center text-muted-foreground hover:text-primary transition-colors font-medium bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </button>

          <button
            onClick={() => setShowReceivedFeedback(true)}
            className="flex items-center text-sm font-medium bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-border px-4 py-2 rounded-full shadow-sm hover:bg-muted transition-colors"
          >
            My Feedbacks
          </button>
        </div>

        {/* KHUNG NỘI DUNG CHÍNH TRUNG TÂM */}
        <div className="relative z-10 max-w-4xl w-full mx-auto text-center space-y-10 flex-1 flex flex-col justify-center">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Peer-to-Peer Matching
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hệ thống sẽ kết nối bạn với một ứng viên có cùng trình độ (Level) để tiến hành buổi
              phỏng vấn chéo.
            </p>
          </div>

          {/* Feature Cards (Glassmorphism) */}
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-card/60 backdrop-blur-md rounded-2xl border border-border shadow-xl hover:-translate-y-1 transition-transform duration-300">
              <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-4 shadow-inner">
                <Zap className="text-yellow-600 dark:text-yellow-500" size={24} />
              </div>
              <h4 className="font-bold text-base mb-1">Kết nối siêu tốc</h4>
              <p className="text-sm text-muted-foreground">
                Thường mất ít hơn 2 phút để tìm thấy partner phù hợp với bạn.
              </p>
            </div>

            <div className="p-6 bg-card/60 backdrop-blur-md rounded-2xl border border-border shadow-xl hover:-translate-y-1 transition-transform duration-300">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 shadow-inner">
                <Users className="text-blue-600 dark:text-blue-500" size={24} />
              </div>
              <h4 className="font-bold text-base mb-1">Tương đồng trình độ</h4>
              <p className="text-sm text-muted-foreground">
                Thuật toán ghép cặp dựa trên kỹ năng và số năm kinh nghiệm.
              </p>
            </div>

            <div className="p-6 bg-card/60 backdrop-blur-md rounded-2xl border border-border shadow-xl hover:-translate-y-1 transition-transform duration-300">
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 shadow-inner">
                <ShieldCheck className="text-green-600 dark:text-green-500" size={24} />
              </div>
              <h4 className="font-bold text-base mb-1">Môi trường an toàn</h4>
              <p className="text-sm text-muted-foreground">
                Cộng đồng chuyên nghiệp, hỗ trợ nhau cùng tiến bộ và phát triển.
              </p>
            </div>
          </div>

          {/* Vùng nút Bắt đầu / Loading */}
          <div className="py-8">
            {!isSearching ? (
              <Button
                size="lg"
                className="h-16 px-12 text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl hover:shadow-indigo-500/30 transition-all rounded-full hover:scale-105"
                onClick={handleStartMatching}
              >
                Find a Partner Now
              </Button>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
                  <div className="relative bg-background p-6 rounded-full border-4 border-indigo-500 shadow-xl">
                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-primary">
                    Đang tìm kiếm ứng viên phù hợp...
                  </h2>
                  <p className="text-muted-foreground mt-2 font-mono bg-muted/50 inline-block px-4 py-1 rounded-full border">
                    Thời gian chờ: {timer} giây
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 rounded-full px-8"
                  onClick={() => setIsSearching(false)}
                >
                  Hủy tìm kiếm
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ==================== PAGINATED TESTIMONIALS (FLUX STYLE) ==================== */}
        <div className="relative z-10 w-full max-w-3xl mx-auto mt-8 mb-4">
          <div className="text-center mb-6">
            <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Cộng đồng nói gì về chúng tôi
            </p>
          </div>

          <div className="relative bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-8 md:p-10 shadow-2xl">
            <div className="relative min-h-[180px] md:min-h-[140px] flex items-center justify-center overflow-hidden">
              {testimonials.map((testi, idx) => (
                <div
                  key={idx}
                  className={`absolute w-full transition-all duration-500 ease-in-out flex flex-col items-center text-center ${
                    idx === activeTestimonial
                      ? 'opacity-100 translate-x-0 relative z-10'
                      : 'opacity-0 translate-x-8 pointer-events-none z-0'
                  }`}
                >
                  <Quote className="text-primary/20 mb-4 h-8 w-8" />
                  <p className="text-base md:text-lg text-foreground/90 leading-relaxed mb-6 font-medium max-w-xl italic">
                    "{testi.content}"
                  </p>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[...Array(testi.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="font-bold text-sm text-foreground">{testi.name}</p>
                    <p className="text-xs text-muted-foreground">{testi.role}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls (Dấu chấm) */}
            <div className="flex justify-center items-center gap-2 mt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === activeTestimonial
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-primary/20 hover:bg-primary/40'
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Modal hiển thị feedback */}
        <ReceivedFeedbackModal
          open={showReceivedFeedback}
          onClose={() => setShowReceivedFeedback(false)}
          sessionId={null}
        />
      </div>
    </Layout>
  );
}
