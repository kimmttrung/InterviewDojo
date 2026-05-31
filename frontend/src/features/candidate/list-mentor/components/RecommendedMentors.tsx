import { Loader2, ChevronLeft, ChevronRight, Sparkle } from 'lucide-react';
import { useRef, useEffect } from 'react';

import { Button } from '@/shared/components/ui/button';
import { useProfile } from '@/features/candidate/profile/hooks/useProfile';
import { useRecommendedMentors } from '../hooks/useRecommendedMentors';
import { MentorCard } from './MentorCard';

export const RecommendedMentors = () => {
  const { profile, isLoading: profileLoading } = useProfile();
  const candidateId = profile?.id;
  const { data, isLoading } = useRecommendedMentors(candidateId);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Hàm Xử lý Cuộn (Tính toán theo kích thước card + khoảng cách gap: 360px)
  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = 360;
    containerRef.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  // 2. Tự động chạy ngang (Autoplay) mỗi 5 giây
  useEffect(() => {
    if (!data || data.length <= 1) return;

    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;

      // Nếu cuộn gần hết phía bên phải, tự động quay lại từ đầu
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scroll('right');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [data]);

  if (profileLoading || isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!candidateId) return null;

  if (!data?.length) {
    return (
      <div className="mb-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <p className="font-semibold text-slate-700">No recommendations yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Update your skills and target role to get mentor suggestions.
        </p>
      </div>
    );
  }

  return (
    /* Đổi sang background Gradient từ Indigo sang Violet nhạt cực sang trọng */
    <section className="relative rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50 p-6 border border-indigo-100/70 shadow-sm overflow-hidden group">
      {' '}
      {/* Tiêu đề vùng Gợi ý */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          {/* Tăng kích thước icon cúp phù hợp với chữ tiêu đề mới */}
          <Sparkle className="h-6 w-6 text-amber-500 animate-pulse" />

          {/* Thay text-xl (20px) thành text-2xl (24px) để tiêu đề to, nổi bật rõ ràng */}
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Top Matches For You
          </h2>
        </div>

        {/* Thay text-xs (12px) thành text-sm (14px) để người dùng dễ đọc hơn */}
        <p className="text-sm text-slate-500 font-medium mt-1.5 pl-9">
          Best mentor rankings personalized based on your profile compatibility.
        </p>
      </div>
      {/* Vùng chứa Danh sách & Nút Điều Hướng 2 Bên */}
      <div className="relative px-2">
        {/* Nút bên TRÁI */}
        <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            className="h-10 w-10 rounded-full shadow-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 backdrop-blur-sm"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Nút bên PHẢI */}
        <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            className="h-10 w-10 rounded-full shadow-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 backdrop-blur-sm"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Danh sách chạy ngang */}
        <div
          ref={containerRef}
          className="
            flex
            items-start
            gap-8
            overflow-x-auto
            scroll-smooth
            py-6
            pl-12
            pr-4
            scrollbar-none
          "
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {data.map((mentor: any, index: number) => (
            <div
              key={mentor.id}
              className="
                relative
                min-w-[340px]
                max-w-[340px]
                flex-shrink-0
                transition-all
                duration-300
                hover:-translate-y-1.5
              "
            >
              {/* SỐ THỨ TỰ XẾP HẠNG (Kiểu Netflix font to khổng lồ nằm đè một phần phía sau/trước card) */}
              <span
                className="
                absolute 
                left-[-38px] 
                bottom-[-10px] 
                z-10 
                text-[100px] 
                font-black 
                leading-none 
                select-none
                bg-gradient-to-b from-indigo-300 to-indigo-500/80
                bg-clip-text 
                text-transparent
                drop-shadow-[0_4px_6px_rgba(0,0,0,0.05)]
              "
              >
                {index + 1}
              </span>

              {/* Bọc MentorCard để đổ thêm shadow trắng nổi bật trên nền Gradient */}
              <div className="relative z-20 bg-white rounded-xl shadow-md border border-indigo-50/50">
                <MentorCard mentor={mentor} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
