'use client';

import {
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';

import { TrendingUp, Sparkles } from 'lucide-react';

import { Card, CardContent } from '@/shared/components/ui/card';

type ScoreLineChartProps = {
  data: {
    date: string;
    score: number;
  }[];
};

// 1. Hàm format chỉ lấy Ngày Tháng Năm (Dùng cho trục XAxis cho gọn)
const formatDateToDDMMYYYY = (dateString: any) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString || '');

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();

  return `${d}-${m}-${y}`;
};

// 2. Hàm format lấy cả Giờ và Ngày Tháng Năm (Dùng cho Tooltip hiển thị chi tiết)
const formatDateTime = (dateString: any) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString || '');

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes} ${d}-${m}-${y}`;
};

export const ScoreLineChart = ({ data }: ScoreLineChartProps) => {
  const latestScore = data[data.length - 1]?.score || 0;
  const previousScore = data[data.length - 2]?.score || latestScore;
  const diff = latestScore - previousScore;

  return (
    <Card
      className="
        overflow-hidden border bg-background
        shadow-sm
      "
    >
      <CardContent className="p-0">
        {/* HEADER */}
        <div
          className="
            flex flex-col gap-4
            border-b px-6 py-5
            sm:flex-row sm:items-center sm:justify-between
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-11 w-11 items-center justify-center
                rounded-2xl
                bg-primary text-primary-foreground
                shadow-md
              "
            >
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight">Score Progression</h2>

              <p className="text-sm text-muted-foreground">
                Track your interview performance over time
              </p>
            </div>
          </div>

          {/* STATS */}
          <div
            className="
              flex items-center gap-3
              rounded-2xl border
              bg-muted/40 px-4 py-3
            "
          >
            <div
              className="
                flex h-9 w-9 items-center justify-center
                rounded-xl bg-emerald-500/10
              "
            >
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Latest Score</p>

              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{latestScore.toFixed(1)}</span>

                <span
                  className={`
                    rounded-full px-2 py-0.5
                    text-xs font-semibold
                    ${
                      diff >= 0
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-rose-500/10 text-rose-600'
                    }
                  `}
                >
                  {diff >= 0 ? '+' : ''}
                  {diff.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART */}
        <div className="h-[340px] w-full px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              {/* Gradient */}
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Grid */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                opacity={0.4}
              />

              {/* Axis */}
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatDateToDDMMYYYY} /* Trục X hiển thị ngày tháng cho thoáng */
                tick={{
                  fontSize: 12,
                  fill: 'hsl(var(--muted-foreground))',
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toFixed(1)}
                tick={{
                  fontSize: 12,
                  fill: 'hsl(var(--muted-foreground))',
                }}
              />

              {/* Tooltip */}
              <Tooltip
                formatter={(value: any) => [Number(value).toFixed(1), 'Score']}
                labelFormatter={
                  formatDateTime
                } /* Đổi sang hàm formatDateTime để hiển thị cả GIỜ và NGÀY */
                cursor={{
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                }}
              />

              {/* Area */}
              <Area type="monotone" dataKey="score" stroke="none" fill="url(#scoreGradient)" />

              {/* Line */}
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={4}
                dot={{
                  r: 5,
                  fill: 'hsl(var(--primary))',
                  strokeWidth: 3,
                  stroke: 'hsl(var(--background))',
                }}
                activeDot={{
                  r: 7,
                  fill: 'hsl(var(--primary))',
                  strokeWidth: 4,
                  stroke: 'hsl(var(--background))',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
