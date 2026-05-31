import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../shared/components/ui/dialog';
import { Calendar, Users, MessageSquare, Loader2, Bot, Users2, Star } from 'lucide-react';
import CodeEditer from '../../../assets/img/CodeEditer.png';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/button';
import { Card } from '../../../shared/components/ui/card';
import { Footer } from '../../../shared/components/layout/Footer';
import { Layout } from '../../../shared/components/layout/Layout';

// 1. Dữ liệu nhận xét phong phú kèm ảnh thật (Avatar từ Unsplash)
const testimonials = [
  {
    name: 'Maritza',
    role: 'Product Manager, Microsoft',
    text: 'Everything I needed in one place. The AI feedback was incredibly accurate and helped me refine my answers.',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Filipe',
    role: 'SWE, Google',
    text: "Nothing beats mock coding interviews. I wasn't nervous at all during my actual onsite rounds.",
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Yinka',
    role: 'Data Scientist, Meta',
    text: 'Truly benefited from the mock practice sessions. Highly recommended for senior roles.',
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'David',
    role: 'Frontend Engineer, Amazon',
    text: 'The peer matching system is lightning fast. Met some amazing engineers here to practice with.',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Sarah',
    role: 'Backend Developer, Netflix',
    text: 'Loved the system design mock interviews. Helped me secure my dream job!',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Kenji',
    role: 'Fullstack, Stripe',
    text: 'Practicing everyday built my confidence. The community is incredibly supportive.',
    avatar:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=face',
  },
];

export default function PracticePage() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 2. Nhân bản mảng để tạo vòng lặp vô hạn mượt mà
  const marqueeTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <Layout>
      {/* 3. CSS Hiệu ứng cuộn ngang */}
      <style>{`
        @keyframes marquee-horizontal {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-horizontal {
          animation: marquee-horizontal 35s linear infinite;
        }
        .animate-marquee-horizontal:hover {
          /* Dừng cuộn khi người dùng trỏ chuột vào để dễ đọc */
          animation-play-state: paused;
        }
      `}</style>

      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 w-full mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          {/* HEADER TRANG */}
          <div className="mb-10 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Practice Mock Interviews</h1>
            <p className="text-muted-foreground text-base">
              Join thousands of tech candidates practicing interviews with peers and AI to land
              jobs.
            </p>
          </div>

          {/* ACTION BARS & IMAGE */}
          <div className="grid md:grid-cols-2 gap-12 items-start mb-20">
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 border rounded-2xl space-y-6 shadow-sm">
                <h3 className="text-xl font-semibold">Ready to practice?</h3>
                <p className="text-sm text-muted-foreground">
                  Select a mode below to start sharpening your interview skills immediately or
                  schedule a session with a senior mentor.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className={`px-8 h-12 text-white transition-all ${isSearching ? 'bg-orange-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    onClick={() => setIsModalOpen(true)}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Finding partner...
                      </>
                    ) : (
                      'Practice Mode'
                    )}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 h-12 border-slate-300 hover:bg-slate-100"
                    onClick={() => navigate('/mentors')}
                  >
                    Schedule with Mentor
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src={CodeEditer}
                alt="Platform"
                className="rounded-xl shadow-lg border bg-muted w-full object-cover"
              />
            </div>
          </div>

          {/* INTERVIEW MODE SELECTION MODAL */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center">
                  Select Practice Mode
                </DialogTitle>
                <DialogDescription className="text-center">
                  Choose the best method to sharpen your interview skills.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div
                  onClick={() => navigate('/practice/solo-recording')}
                  className="flex items-center gap-4 p-4 rounded-xl border hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all group"
                >
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-200">
                    <Bot size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">Solo Interview with AI Feedback</h4>
                    <p className="text-sm text-muted-foreground">
                      Practice individually and receive instant feedback from AI.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => navigate('/practice/matching')}
                  className="flex items-center gap-4 p-4 rounded-xl border hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all group"
                >
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-200">
                    <Users2 size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">Peer Matching</h4>
                    <p className="text-sm text-muted-foreground">
                      Get matched directly with other candidates for a live session.
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* HOW IT WORKS */}
          <section className="py-16">
            <h2 className="text-center text-3xl font-bold mb-12">How it works</h2>
            <div className="grid md:grid-cols-3 gap-12">
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

          {/* TESTIMONIALS CAROUSEL */}
          {/* Để nền tràn viền mượt mà, ta cho overflow-hidden và padding */}
          <section className="py-16 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-[2.5rem] mb-12 shadow-2xl overflow-hidden relative">
            {/* Lớp phủ trang trí mờ 2 bên viền */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-indigo-600 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-purple-700 to-transparent z-10 pointer-events-none"></div>

            <div className="text-center mb-10 px-4 relative z-20">
              <h2 className="text-3xl font-bold">
                Join thousands of candidates landing dream jobs
              </h2>
              <p className="text-indigo-200 mt-3">
                See what our community has to say about their practice experience.
              </p>
            </div>

            {/* Container của cuộn Marquee */}
            <div className="flex w-max animate-marquee-horizontal space-x-6 px-6">
              {marqueeTestimonials.map((t, i) => (
                <Card
                  key={i}
                  className="w-[320px] md:w-[400px] p-6 bg-white/10 backdrop-blur-md border-white/20 text-white shadow-lg flex-shrink-0 flex flex-col justify-between transition-colors hover:bg-white/20 cursor-default"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, starIdx) => (
                      <Star key={starIdx} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="italic mb-6 text-sm md:text-base leading-relaxed flex-1">
                    "{t.text}"
                  </p>

                  {/* Info User & Avatar */}
                  <div className="flex items-center gap-4 mt-auto">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-300/50 shadow-sm"
                    />
                    <div>
                      <p className="font-bold text-base">{t.name}</p>
                      <p className="text-xs text-indigo-200">{t.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </Layout>
  );
}
