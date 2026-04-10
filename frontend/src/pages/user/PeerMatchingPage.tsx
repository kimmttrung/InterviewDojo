import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Layout } from '../../../components/Layout';
import { Button } from '../../../components/ui/button';
import { Loader2, Users, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';

export default function PeerMatchingPage() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [timer, setTimer] = useState(0);

  const userStore = localStorage.getItem('user');
  const user = userStore ? JSON.parse(userStore) : null;

  // Logic đếm thời gian chờ
  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    } else {
      setTimer(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Logic Socket lắng nghe kết quả
  useEffect(() => {
    if (!user) return;
    const socket = io('http://localhost:3000', { query: { userId: user.id } });

    socket.on('match_found', (data: { roomId: string; token: string }) => {
      setIsSearching(false);
      navigate(`/interview/${data.roomId}?token=${data.token}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, navigate]);

  const handleStartMatching = async () => {
    if (!user) return alert('Vui lòng đăng nhập!');
    setIsSearching(true);

    try {
      const response = await fetch('http://localhost:3000/api/v1/matching/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, level: 'Junior' }),
      });
      const result = await response.json();
      if (result.status === 'matched') {
        navigate(`/interview/${result.roomId}?token=${result.token}`);
      }
    } catch (error) {
      console.error(error);
      setIsSearching(false);
      alert('Lỗi kết nối server!');
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        {/* Nút quay lại */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-8 flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </button>

        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight">Peer-to-Peer Matching</h1>
            <p className="text-lg text-muted-foreground">
              Hệ thống sẽ kết nối bạn với một ứng viên có cùng trình độ để thực hiện phỏng vấn chéo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <Zap className="text-yellow-500 mb-2" size={20} />
              <h4 className="font-bold text-sm">Kết nối nhanh</h4>
              <p className="text-xs text-muted-foreground">
                Thường mất chưa đầy 2 phút để tìm thấy đối thủ.
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <Users className="text-blue-500 mb-2" size={20} />
              <h4 className="font-bold text-sm">Cùng trình độ</h4>
              <p className="text-xs text-muted-foreground">
                Matching dựa trên kỹ năng và kinh nghiệm.
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <ShieldCheck className="text-green-500 mb-2" size={20} />
              <h4 className="font-bold text-sm">Môi trường an toàn</h4>
              <p className="text-xs text-muted-foreground">
                Cộng đồng văn minh, hỗ trợ lẫn nhau cùng tiến bộ.
              </p>
            </div>
          </div>

          <div className="py-10">
            {!isSearching ? (
              <Button
                size="lg"
                className="h-16 px-12 text-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all"
                onClick={handleStartMatching}
              >
                Bắt đầu tìm kiếm đối thủ ngay
              </Button>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping"></div>
                  <div className="relative bg-white p-8 rounded-full border-4 border-indigo-600 shadow-xl">
                    <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-indigo-600">
                    Đang tìm ứng viên phù hợp...
                  </h2>
                  <p className="text-muted-foreground">Thời gian chờ: {timer} giây</p>
                </div>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => setIsSearching(false)}
                >
                  Hủy tìm kiếm
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
