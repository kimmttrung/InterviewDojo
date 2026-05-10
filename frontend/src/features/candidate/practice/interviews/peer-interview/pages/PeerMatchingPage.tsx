// src/features/candidate/practice/interviews/peer-interview/pages/PeerMatchingPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { matchingService } from '../services/matching.service';
import { useSocketStore } from '@/stores/useSocketStore';
import { Layout } from '@/shared/components/layout/Layout';
import { Button } from '@/shared/components/ui/button';
import { useCurrentUser } from '@/features/auth'; // ✅ lấy user từ server state

export default function PeerMatchingPage() {
  const navigate = useNavigate();
  const { connect, socket } = useSocketStore();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  const [isSearching, setIsSearching] = useState(false);
  const [timer, setTimer] = useState(0);

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

  // ==================== SOCKET CONNECT ====================
  useEffect(() => {
    if (!user?.id) return;
    connect(user.id);
    console.log('🔌 Connecting socket with user ID:', user.id);
  }, [user?.id, connect]);

  // ==================== LISTEN SOCKET ====================
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data: { roomId: string; token: string }) => {
      console.log('🎯 MATCH FOUND:', data);
      setIsSearching(false);
      navigate(`/interview/${data.roomId}?token=${data.token}`);
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
          console.log('✅ socket connected (await)');
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

  // ==================== LOADING STATE ====================
  if (isUserLoading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-8 flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </button>

        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight">Peer-to-Peer Matching</h1>
            <p className="text-lg text-muted-foreground">
              Our system will connect you with a candidate of a similar level for a cross-interview
              session.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <Zap className="text-yellow-500 mb-2" size={20} />
              <h4 className="font-bold text-sm">Fast Connection</h4>
              <p className="text-xs text-muted-foreground">
                It usually takes less than 2 minutes to find a match.
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <Users className="text-blue-500 mb-2" size={20} />
              <h4 className="font-bold text-sm">Similar Level</h4>
              <p className="text-xs text-muted-foreground">
                Matching is based on your specific skills and experience.
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <ShieldCheck className="text-green-500 mb-2" size={20} />
              <h4 className="font-bold text-sm">Safe Environment</h4>
              <p className="text-xs text-muted-foreground">
                A professional community supporting each other's growth.
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
                Find a Partner Now
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
                    Finding the right candidate...
                  </h2>
                  <p className="text-muted-foreground">Waiting time: {timer} seconds</p>
                </div>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => setIsSearching(false)}
                >
                  Cancel Search
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
