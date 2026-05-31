import React from 'react';
import { Share2, Code2, Users, BookOpen, Target } from 'lucide-react';
import { Layout } from '@/shared/components/layout/Layout';
import { Link } from 'react-router-dom';
import { Footer } from '@/shared/components/layout/Footer';

// Import đầy đủ 4 ảnh từ thư mục assets
import thumbnail1 from '@/assets/img/thumbnail1.png';
import thumbnail2 from '@/assets/img/thumbnail2.png';
import thumbnail3 from '@/assets/img/thumbnail3.png';
import thumbnail4 from '@/assets/img/thumbnail4.png';

export default function HomePage() {
  const features = [
    {
      title: 'Peer to peer matching',
      icon: Share2,
      color: 'from-pink-500 to-rose-500',
      link: '/practice/matching',
    },
    {
      title: 'Solo interview AI feedback',
      icon: BookOpen,
      color: 'from-indigo-500 to-purple-500',
      link: '/practice/solo-recording',
    },
    {
      title: 'Practice coding questions',
      icon: Code2,
      color: 'from-blue-500 to-cyan-500',
      link: '/question-bank',
    },
    {
      title: 'Mentor booking list',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      link: '/mentors',
    },
    // {
    //   title: 'Prep for AI companies',
    //   icon: Brain,
    //   color: 'from-purple-500 to-violet-500',
    //   link: '/share-interview',
    // },
    // {
    //   title: 'View interview questions',
    //   icon: MessageCircle,
    //   color: 'from-orange-500 to-amber-500',
    //   link: '/share-interview',
    // },
    {
      title: 'Add Credit for candidate',
      icon: Target,
      color: 'from-red-500 to-pink-500',
      link: '/wallet',
    },
  ];

  // Đưa 4 ảnh local vào mảng slider
  const interviewImages = [thumbnail1, thumbnail2, thumbnail3, thumbnail4];

  // Nhân bản chuỗi ảnh để cuộn liên tục (infinite loop)
  const marqueeImages = [...interviewImages, ...interviewImages, ...interviewImages];

  return (
    <>
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
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
          @keyframes fade-on-scroll {
          0% { opacity: 1; filter: blur(0px); transform: translateY(0); }
          100% { opacity: 0; filter: blur(12px); transform: translateY(-30px); }
        }
        .scroll-fade-text {
          animation: fade-on-scroll linear both;
          animation-timeline: view();
          animation-range: exit 40% exit 100%;
        }
      `}</style>

        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col pt-8 pb-32 items-center px-4 md:px-8 overflow-hidden bg-gradient-to-b from-transparent via-background/50 to-muted/20">
          {/* Lớp màu chuyển động phía sau */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-10 left-1/3 w-[500px] h-[500px] bg-pink-500/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10 text-center mb-10 mt-4 scroll-fade-text">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Welcome back to InterviewDojo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Khám phá các tính năng bằng cách tương tác với bảng điều khiển bên dưới
            </p>
          </div>

          {/* TRUNG TÂM: 3D THUMBNAIL */}
          <div
            className="relative z-20 w-full max-w-7xl group cursor-pointer"
            style={{ perspective: '1200px' }}
          >
            <div
              className="relative transition-all duration-700 ease-out transform-gpu group-hover:-translate-y-6"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'rotateX(0deg)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotateX(-12deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'rotateX(0deg)';
              }}
            >
              <div className="w-full h-[500px] md:h-[600px] bg-card/60 backdrop-blur-sm rounded-[2rem] overflow-hidden border border-border shadow-2xl relative flex items-center">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none"></div>

                <div className="flex w-max animate-marquee space-x-8 px-8">
                  {marqueeImages.map((src, index) => (
                    <img
                      key={index}
                      src={src}
                      alt={`Real interview practice ${index}`}
                      className="w-[600px] md:w-[800px] h-[400px] md:h-[500px] object-cover rounded-3xl shadow-xl border border-white/10"
                    />
                  ))}
                </div>
              </div>

              {/* Các nút Features nổi 3D khi hover */}
              {/* Đổi flex-wrap thành flex-col để tạo cột dọc chứa 2 hàng */}
              <div
                className="absolute left-0 right-0 -bottom-20 md:-bottom-32 mb-40 md:mb-26 flex flex-col items-center gap-3 md:gap-4 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 transition-all duration-700 ease-out z-50"
                style={{ transform: 'translateZ(100px)' }}
              >
                {/* HÀNG 1: Dùng slice(0, 3) để lấy đúng 3 nút đầu tiên */}
                <div className="flex justify-center gap-3 md:gap-4">
                  {features.slice(0, 3).map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link key={`row1-${index}`} to={item.link}>
                        <div className="bg-background/95 backdrop-blur-xl border border-border p-3 md:p-5 rounded-2xl flex items-center gap-3 shadow-2xl hover:bg-muted transition-colors duration-300 hover:-translate-y-2">
                          <div
                            className={`p-2.5 rounded-xl text-white bg-gradient-to-br ${item.color} shadow-md`}
                          >
                            <Icon className="h-5 w-5 md:h-6 md:w-6" />
                          </div>
                          <span className="text-sm md:text-base font-semibold whitespace-nowrap">
                            {item.title}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* HÀNG 2: Dùng slice(3, 5) để lấy 2 nút còn lại */}
                <div className="flex justify-center gap-3 md:gap-4">
                  {features.slice(3, 5).map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link key={`row2-${index}`} to={item.link}>
                        <div className="bg-background/95 backdrop-blur-xl border border-border p-3 md:p-5 rounded-2xl flex items-center gap-3 shadow-2xl hover:bg-muted transition-colors duration-300 hover:-translate-y-2">
                          <div
                            className={`p-2.5 rounded-xl text-white bg-gradient-to-br ${item.color} shadow-md`}
                          >
                            <Icon className="h-5 w-5 md:h-6 md:w-6" />
                          </div>
                          <span className="text-sm md:text-base font-semibold whitespace-nowrap">
                            {item.title}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
      <Footer />
    </>
  );
}
