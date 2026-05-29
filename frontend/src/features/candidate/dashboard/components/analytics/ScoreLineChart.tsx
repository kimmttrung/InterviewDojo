'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, Sparkles, Filter } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';

type ScoreLineChartProps = {
  data: {
    date: string;
    score: number;
    sessionType: string;
  }[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
};

const formatDateToDDMMYYYY = (dateString: any) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString || '');
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0]?.payload) {
    const data = payload[0].payload;

    const score = typeof data?.score === 'number' ? data.score : 0;
    let sessionType = data?.sessionType ? String(data.sessionType) : 'UNKNOWN';
    console.log('KIỂM TRA DỮ LIỆU TOOLTIP:', data);

    if (sessionType === 'MENTOR_BOOKING') {
      sessionType = 'MENTORING';
    }

    return (
      <div className="rounded-xl border bg-background px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <p className="mb-2 border-b pb-2 text-sm font-medium text-muted-foreground">
          {formatDateTime(label)}
        </p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Score</span>
            <span className="text-base font-bold text-primary">{score.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Session</span>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold capitalize text-secondary-foreground">
              {sessionType.toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ScoreLineChart = ({ data, activeFilter, setActiveFilter }: ScoreLineChartProps) => {
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (activeFilter === 'ALL') return data;

    const targetType = activeFilter === 'MENTORING' ? 'MENTOR_BOOKING' : activeFilter;
    return data.filter((d) => d && d.sessionType === targetType);
  }, [data, activeFilter]);

  const latestScore = filteredData[filteredData.length - 1]?.score || 0;
  const previousScore = filteredData[filteredData.length - 2]?.score || latestScore;
  const diff = latestScore - previousScore;

  const filters = ['ALL', 'MENTORING', 'SOLO', 'P2P'];

  console.log('KIỂM TRA DỮ LIỆU ĐỒ THỊ:', data);
  return (
    <Card className="overflow-hidden border bg-background shadow-sm">
      <CardContent className="p-0">
        {/* HEADER & FILTERS */}
        <div className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Score Progression</h2>
              <p className="text-sm text-muted-foreground">
                Track your interview performance over time
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* TABS BUTTONS */}
            <div className="flex items-center gap-1 rounded-xl border bg-muted/30 p-1">
              <div className="px-2 text-muted-foreground">
                <Filter className="h-4 w-4" />
              </div>
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`
                    rounded-lg px-3 py-1.5 text-xs font-medium transition-all
                    ${
                      activeFilter === f
                        ? 'bg-background text-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:bg-muted/80'
                    }
                  `}
                >
                  {f === 'ALL' ? 'All' : f}
                </button>
              ))}
            </div>

            {/* LATEST STATS */}
            <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Latest Score</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{latestScore.toFixed(1)}</span>
                  <span
                    className={`
                      rounded-full px-2 py-0.5 text-xs font-semibold
                      ${diff >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}
                    `}
                  >
                    {diff >= 0 ? '+' : ''}
                    {diff.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHART */}
        <div className="h-[340px] w-full px-2 py-4">
          {filteredData.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No session data available for this category.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.4}
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatDateToDDMMYYYY}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.toFixed(1)}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: 'hsl(var(--primary))',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={4}
                  fill="url(#scoreGradient)"
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};
