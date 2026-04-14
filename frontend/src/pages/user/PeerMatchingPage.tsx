import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Layout } from '../../../components/Layout';
import { Button } from '../../../components/ui/button';
import { Loader2, Users, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { matchingService } from '../../../services/matching.service';

export default function PeerMatchingPage() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [timer, setTimer] = useState(0);

  const userStore = localStorage.getItem('user');
  const user = userStore ? JSON.parse(userStore) : null;

  // Wait timer logic
  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    } else {
      setTimer(0);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Socket logic for listening to match results
  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      query: { userId: user.id },
    });

    socket.on('match_found', (data: { roomId: string; token: string }) => {
      setIsSearching(false);
      navigate(`/interview/${data.roomId}?token=${data.token}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, navigate]);

  const handleStartMatching = async () => {
    if (!user) return alert('Please log in to continue!');
    setIsSearching(true);

    try {
      const { data } = await matchingService.join({
        userId: user.id,
        level: 'Junior',
      });

      if (data.status === 'matched') {
        navigate(`/interview/${data.roomId}?token=${data.token}`);
      }
    } catch (error: any) {
      console.error(error);
      setIsSearching(false);
      alert(error?.response?.data?.message || 'Server error');
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        {/* Back Button */}
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
