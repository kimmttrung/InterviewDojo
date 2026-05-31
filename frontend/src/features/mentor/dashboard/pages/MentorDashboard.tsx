import { useMemo } from 'react';

import { CheckCircle, XCircle, Clock, Banknote, CheckSquare } from 'lucide-react';
import { MentorLayout } from '../components/MentorLayout';
import { Card } from '@/shared/components/ui/card';
import { useMentorBookings } from '@/features/mentor/booking-management/hooks/useMentorBookings';
import { useMentorPayouts } from '@/features/mentor/payouts/hooks/useMentorPayouts';
import { parseISO } from 'date-fns/parseISO';
import { format } from 'date-fns/format';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function MentorDashboard() {
  const { data: allBookings } = useMentorBookings({ limit: 1 });
  const { data: pendingBookings } = useMentorBookings({ status: 'PENDING_ACCEPTANCE', limit: 1 });
  const { data: acceptedBookings } = useMentorBookings({ status: 'ACCEPTED', limit: 1 });
  const { data: completedBookings } = useMentorBookings({ status: 'COMPLETED', limit: 1 });
  const { data: rejectedBookings } = useMentorBookings({ status: 'REJECTED', limit: 1 });

  // ==================== FETCH PAYOUTS (DÒNG TIỀN) ====================
  // Lấy danh sách payout đã hoàn thành để tính toán doanh thu (limit lớn để gom nhóm biểu đồ)
  const { data: payoutsData } = useMentorPayouts({ status: 'COMPLETED', limit: 100 });

  // ==================== PROCESS CHART DATA ====================
  // Gom nhóm dữ liệu payout theo ngày để vẽ biểu đồ dòng tiền
  const chartData = useMemo(() => {
    const items = payoutsData?.items || (Array.isArray(payoutsData) ? payoutsData : []);

    if (items.length === 0) return [];

    const groupedData: Record<string, number> = {};

    items.forEach((payout: any) => {
      // Đảm bảo createdAt tồn tại, nếu không lấy ngày hiện tại để tránh lỗi crash app
      const dateString = payout.createdAt || payout.created_at || new Date().toISOString();
      const date = format(parseISO(dateString), 'MMM dd');

      if (!groupedData[date]) {
        groupedData[date] = 0;
      }

      // ĐÃ SỬA: Sử dụng mentorEarning thay vì amount. Ép kiểu Number để tránh lỗi NaN
      groupedData[date] += Number(payout.mentorEarning || payout.amount || 0);
    });

    // Chuyển object thành array cho Recharts
    return Object.keys(groupedData).map((date) => ({
      date,
      amount: groupedData[date],
    }));
  }, [payoutsData]);

  const totalRevenue = chartData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <MentorLayout>
      <div className="p-4 space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your bookings, sessions, and revenue.
          </p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 border shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
            </div>
            <h2 className="text-3xl font-bold">{allBookings?.meta?.total || 0}</h2>
          </Card>

          <Card className="p-4 border shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-bold text-yellow-600">
              {pendingBookings?.meta?.total || 0}
            </h2>
          </Card>

          <Card className="p-4 border shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Accepted</p>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold text-blue-600">
              {acceptedBookings?.meta?.total || 0}
            </h2>
          </Card>

          <Card className="p-4 border shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Completed Sessions</p>
              <CheckSquare className="h-4 w-4 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-green-600">
              {completedBookings?.meta?.total || 0}
            </h2>
          </Card>

          <Card className="p-4 border shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-red-600">
              {rejectedBookings?.meta?.total || 0}
            </h2>
          </Card>
        </div>

        {/* CASH FLOW CHART SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold">Revenue Flow</h3>
              <p className="text-sm text-muted-foreground">
                Your earnings over time from completed sessions.
              </p>
            </div>

            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: any) => [
                        `${Number(value || 0).toLocaleString()}`,
                        'Revenue',
                      ]}
                    />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                  No revenue data available yet.
                </div>
              )}
            </div>
          </Card>

          {/* TOTAL REVENUE SUMMARY */}
          <Card className="p-6 shadow-sm flex flex-col justify-center items-center text-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <div className="p-4 bg-white/20 rounded-full mb-4">
              <Banknote className="w-8 h-8" />
            </div>
            <p className="text-indigo-100 font-medium mb-1">Total Earnings</p>
            <h2 className="text-5xl font-extrabold tracking-tight">
              {totalRevenue.toLocaleString()}
            </h2>
            <p className="text-sm text-indigo-100 mt-4 px-4">
              This includes all successfully processed payouts from your completed sessions.
            </p>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
}
