import { useStatistics } from '../hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/card';
import { Loader2 } from 'lucide-react';

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useStatistics();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const items = [
    { label: 'Tổng người dùng', value: stats?.totalUsers || 0, color: 'bg-blue-500' },
    { label: 'Mentors', value: stats?.totalMentors || 0, color: 'bg-green-500' },
    { label: 'Candidates', value: stats?.totalCandidates || 0, color: 'bg-purple-500' },
    { label: 'Câu hỏi', value: stats?.totalQuestions || 0, color: 'bg-yellow-500' },
    { label: 'Đặt lịch', value: stats?.totalBookings || 0, color: 'bg-pink-500' },
    { label: 'Report chờ xử lý', value: stats?.pendingReports || 0, color: 'bg-red-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
