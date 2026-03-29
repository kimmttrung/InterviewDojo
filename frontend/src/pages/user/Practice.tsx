import { Layout } from '../../../components/Layout';
import { Footer } from '../../../components/Footer';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';
import { Calendar, Users, MessageSquare, Loader2 } from 'lucide-react'; // Thêm Loader2 để làm hiệu ứng loading
import CodeEditer from '../../assets/img/CodeEditer.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function Practice() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  // Lấy thông tin user từ localStorage (đảm bảo bạn đã lưu khi login)
  const userStore = localStorage.getItem('user');
  const user = userStore ? JSON.parse(userStore) : null;

  // --- LOGIC SOCKET LẮNG NGHE KẾT QUẢ MATCHING ---
  useEffect(() => {
    if (!user) return;

    // Kết nối tới server Socket của bạn
    const socket = io('http://localhost:3000', {
      query: { userId: user.id },
    });

    // Khi Backend tìm thấy đối thủ, nó sẽ bắn sự kiện 'match_found'
    socket.on('match_found', (data: { roomId: string; token: string }) => {
      console.log('Ghép cặp thành công!', data);
      setIsSearching(false);

      // Tự động chuyển hướng sang phòng phỏng vấn kèm theo Token
      navigate(`/interview/${data.roomId}?token=${data.token}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, navigate]);

  // --- HÀM GỌI API MATCHING ---
  const handleStartMatching = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để bắt đầu matching!');
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch('http://localhost:3000/api/v1/matching/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          level: 'Junior', // Có thể thay bằng user.level nếu có
        }),
      });

      const result = await response.json();

      // Nếu may mắn có người đợi sẵn, API trả về matched luôn
      if (result.status === 'matched') {
        navigate(`/interview/${result.roomId}?token=${result.token}`);
      }
      // Nếu chưa có ai, ta chỉ việc ngồi đợi Socket 'match_found' ở useEffect bên trên
    } catch (error) {
      console.error('Lỗi Matching:', error);
      setIsSearching(false);
      alert('Không thể kết nối tới server matching!');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* HERO SECTION - CHỈ SỬA NÚT BẤM TẠI ĐÂY */}
        <section className="py-20 px-8 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
              Practice mock interviews <br />
              <span className="text-primary">with peers and AI</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Join thousands of tech candidates practicing interviews to land jobs. Practice real
              questions over video chat in a collaborative environment with helpful AI feedback.
            </p>
            <div className="flex flex-wrap gap-4">
              {/* NÚT BẤM MATCHING ĐÃ ĐƯỢC NÂNG CẤP */}
              <Button
                size="lg"
                className={`px-8 h-12 text-white transition-all ${isSearching ? 'bg-orange-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                onClick={handleStartMatching}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tìm đối thủ...
                  </>
                ) : (
                  'Bắt đầu Matching ngay'
                )}
              </Button>

              <Button size="lg" variant="outline" className="px-8 h-12">
                Start an AI interview
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={CodeEditer}
              alt="Platform Preview"
              className="rounded-xl shadow-2xl border bg-muted"
            />
          </div>
        </section>

        {/* CÁC PHẦN DƯỚI GIỮ NGUYÊN HOÀN TOÀN */}
        <section className="py-16 bg-muted/30 px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">
              Who's using it
            </span>
            <h2 className="text-3xl font-bold">How everyone in tech prepares</h2>
            <p className="text-muted-foreground text-lg">
              Exponent Practice supports interview prep for everyone in tech. From product
              management to software engineering and data roles, there are thousands of practice
              questions to choose from.
            </p>
          </div>
        </section>

        {/* ... (Các phần HOW IT WORKS, TESTIMONIALS, FAQ GIỮ NGUYÊN) ... */}
        <section className="py-20 px-8 max-w-7xl mx-auto">
          <h2 className="text-center text-3xl font-bold mb-16">How it works</h2>
          <div className="grid md:cols-3 gap-12">
            {[
              {
                title: 'Schedule a time',
                desc: 'Join later today or pre-schedule an hour-long mock interview session that suits your availability.',
                icon: Calendar,
              },
              {
                title: 'Get matched',
                desc: 'Automatically match with peers preparing for the same interviews. Take turns role-playing.',
                icon: Users,
              },
              {
                title: 'Exchange feedback',
                desc: 'Trade detailed notes using realistic rubrics. Get honest, actionable feedback from peers and AI.',
                icon: MessageSquare,
              },
            ].map((step, idx) => (
              <div key={idx} className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 bg-indigo-600 text-white px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold">Join thousands of candidates landing dream jobs</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              {[
                {
                  name: 'Maritza',
                  role: 'Product Manager, Microsoft',
                  text: 'Everything I needed in one place...',
                },
                {
                  name: 'Filipe',
                  role: 'SWE, Google',
                  text: "Nothing beats mock coding interviews. I wasn't nervous...",
                },
                {
                  name: 'Yinka',
                  role: 'Data Scientist, Meta',
                  text: 'Truly benefited from the mock practice sessions...',
                },
              ].map((t, i) => (
                <Card key={i} className="p-6 bg-white/10 border-white/20 text-white">
                  <p className="italic mb-4 text-sm">"{t.text}"</p>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-xs text-indigo-200">{t.role}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-8 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How does it work?</AccordionTrigger>
              <AccordionContent>
                The matching system pairs you with peers based on your role, experience level, and
                target companies.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it free?</AccordionTrigger>
              <AccordionContent>
                We offer free daily peer mock interviews, while AI feedback and premium coaching
                require a subscription.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Footer />
      </div>
    </Layout>
  );
}
