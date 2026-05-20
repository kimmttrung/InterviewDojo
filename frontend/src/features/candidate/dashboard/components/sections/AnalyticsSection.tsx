'use client';

import { Activity, Bookmark, TrendingUp, Video, LucideIcon, Code2, Users } from 'lucide-react';

import { Card, CardContent } from '@/shared/components/ui/card';

import { AnalyticsSkeleton } from '../skeletons/AnalyticsSkeleton';
import { ScoreLineChart } from '../analytics/ScoreLineChart';

import { useAnalyticsOverview } from '../../hooks/useAnalyticsOverview';
import { useCurrentUser } from '@/features/auth';

import type { AnalyticsOverviewData as Analytics } from '../../dashboard.type';

// ============================================================================
// HELPER: PHÂN KHÚC ĐIỂM SỐ
// ============================================================================
const getScoreLabel = (score: number) => {
  if (score >= 9.0) return { text: 'Excellent', className: 'text-emerald-500' };
  if (score >= 8.0) return { text: 'Very Good', className: 'text-teal-500' };
  if (score >= 6.5) return { text: 'Good', className: 'text-indigo-500' };
  if (score >= 5.0) return { text: 'Average', className: 'text-amber-500' };
  return { text: 'Need Improvement', className: 'text-rose-500' };
};

// ============================================================================
// STAT CARD
// ============================================================================
type StatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
};

const StatCard = ({ title, value, icon: Icon }: StatCardProps) => {
  return (
    <Card
      className="
        overflow-hidden border bg-background
        shadow-sm transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
      "
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          </div>

          <div
            className="
              flex h-12 w-12 items-center justify-center
              rounded-2xl
              bg-primary/10
              ring-1 ring-primary/20
            "
          >
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ANALYTICS STATS
// ============================================================================
type AnalyticsStatsProps = {
  analytics: Analytics;
};

export const AnalyticsStats = ({ analytics }: AnalyticsStatsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard title="Completed Sessions" value={analytics.completedSessions} icon={Video} />
      <StatCard title="Saved Questions" value={analytics.savedQuestions} icon={Bookmark} />
      <StatCard
        title="Solved Code Questions"
        value={analytics.completedCodingQuestions}
        icon={Code2}
      />
      <StatCard
        title="Mentor Sessions"
        value={analytics.sessionBreakdown.mentor}
        icon={TrendingUp}
      />
      <StatCard title="Solo Sessions" value={analytics.sessionBreakdown.solo} icon={Activity} />
      <StatCard title="P2P Sessions" value={analytics.sessionBreakdown.p2p} icon={Users} />
    </div>
  );
};

// ============================================================================
// ANALYTICS OVERVIEW
// ============================================================================
type AnalyticsOverviewProps = {
  analytics: Analytics;
};

const AnalyticsOverview = ({ analytics }: AnalyticsOverviewProps) => {
  // Lấy nhãn thông tin dựa trên điểm số thực tế
  const scoreInfo = getScoreLabel(analytics.overallScore);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div
        className="
          relative overflow-hidden rounded-3xl border
          bg-background p-6 shadow-sm
        "
      >
        {/* Glow */}
        <div
          className="
            absolute right-0 top-0 h-40 w-40
            rounded-full bg-primary/10 blur-3xl
          "
        />

        <div className="relative z-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT */}
            <div className="flex items-start gap-4">
              <div
                className="
                  flex h-14 w-14 items-center justify-center
                  rounded-2xl
                  bg-primary text-primary-foreground
                  shadow-lg
                "
              >
                <Activity className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
                </div>

                <p className="max-w-2xl text-sm text-muted-foreground">
                  Track your interview performance and get concise feedback summaries powered by AI.
                </p>
              </div>
            </div>

            {/* QUICK SCORE */}
            <div
              className="
                flex items-center gap-3 rounded-2xl border
                bg-muted/40 px-5 py-4
              "
            >
              <div
                className="
                  flex h-11 w-11 items-center justify-center
                  rounded-xl bg-emerald-500/10
                "
              >
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Average Score</p>

                <div className="flex items-end gap-2">
                  {/* Format hiển thị điểm số thống nhất 1 chữ số thập phân */}
                  <span className="text-3xl font-bold leading-none">
                    {analytics.overallScore.toFixed(1)}
                  </span>

                  {/* Thay thế chữ cố định bằng nhãn động dựa trên phân khúc điểm */}
                  <span className={`pb-0.5 text-sm font-semibold ${scoreInfo.className}`}>
                    {scoreInfo.text}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <AnalyticsStats analytics={analytics} />

      {/* CHART */}
      <ScoreLineChart data={analytics.scoreChart} />
    </div>
  );
};

// ============================================================================
// MAIN SECTION
// ============================================================================
export const AnalyticsSection = () => {
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError } = useAnalyticsOverview(user?.id || 0);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (isError || !data) {
    return (
      <div
        className="
          rounded-2xl border bg-card
          p-6 text-sm text-muted-foreground
        "
      >
        Failed to load analytics.
      </div>
    );
  }

  return <AnalyticsOverview analytics={data} />;
};
