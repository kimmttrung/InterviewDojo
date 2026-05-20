import { Activity, Bookmark, Sparkles, TrendingUp, Trophy, Video } from 'lucide-react';

import { AnalyticsOverviewData } from '../../dashboard.type';

import { OverallScoreCard } from './OverallScoreCard';
import { ScoreLineChart } from './ScoreLineChart';
import { StatCard } from './StatCard';

type AnalyticsOverviewProps = {
  analytics: AnalyticsOverviewData;
};

export const AnalyticsOverview = ({ analytics }: AnalyticsOverviewProps) => {
  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div
        className="
          relative overflow-hidden rounded-3xl border
          bg-background p-6 shadow-sm
        "
      >
        {/* Background Glow */}
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

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">Analytics Overview</h1>

                  <div
                    className="
                      flex items-center gap-1 rounded-full
                      bg-primary/10 px-2.5 py-1
                      text-xs font-semibold text-primary
                    "
                  >
                    <Sparkles className="h-3 w-3" />
                    AI Powered
                  </div>
                </div>

                <p className="max-w-2xl text-sm text-muted-foreground">
                  Monitor your interview performance, learning progress, and overall improvement
                  through detailed analytics.
                </p>
              </div>
            </div>

            {/* RIGHT QUICK SUMMARY */}
            <div
              className="
                flex items-center gap-4 rounded-2xl border
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
                <p className="text-xs text-muted-foreground">Current Overall Score</p>

                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold leading-none">{analytics.overallScore}</span>

                  <span className="pb-1 text-sm font-medium text-emerald-500">Excellent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Completed Sessions" value={analytics.completedSessions} icon={Video} />

        <StatCard title="Saved Questions" value={analytics.savedQuestions} icon={Bookmark} />

        {/* <StatCard title="Study Hours" value={analytics.studyHours} icon={Clock3} /> */}

        <OverallScoreCard score={analytics.overallScore} icon={Trophy} />
      </div>

      {/* CHART */}
      <ScoreLineChart data={analytics.scoreChart} />
    </div>
  );
};
