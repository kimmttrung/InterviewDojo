import { Loader2 } from 'lucide-react';
import { useStatistics } from '../hooks/useDashboard';
import { StatCard } from '../component/StatCard';
import { GrowthChart } from '../component/GrowthChart';
import { TopMentorsTable } from '../component/TopMentorsTable';

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useStatistics();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statItems = [
    {
      label: 'Tổng người dùng',
      value: stats?.totalUsers ?? 0,
      delta: stats?.delta.totalUsers,
    },
    {
      label: 'Mentors',
      value: stats?.totalMentors ?? 0,
      delta: stats?.delta.totalMentors,
    },
    {
      label: 'Candidates',
      value: stats?.totalCandidates ?? 0,
      delta: stats?.delta.totalCandidates,
    },
    {
      label: 'Câu hỏi',
      value: stats?.totalQuestions ?? 0,
    },
    {
      label: 'Đặt lịch',
      value: stats?.totalBookings ?? 0,
      delta: stats?.delta.totalBookings,
    },
    {
      label: 'Report chờ xử lý',
      value: stats?.pendingReports ?? 0,
      delta: stats?.delta.pendingReports,
      valueClassName: (stats?.pendingReports ?? 0) > 0 ? 'text-destructive' : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      {/* chart + leaderboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GrowthChart />
        <TopMentorsTable />
      </div>
    </div>
  );
};
