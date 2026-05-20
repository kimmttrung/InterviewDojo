// =====================================================
// ANALYTICS
// =====================================================

export type ScoreChartItem = {
  date: string;
  score: number;
};

export type SessionBreakdown = {
  mentor: number;
  p2p: number;
  solo: number;
};

export type AnalyticsOverviewData = {
  completedSessions: number;

  completedCodingQuestions: number;

  savedQuestions: number;

  overallScore: number;

  sessionBreakdown: {
    mentor: number;
    p2p: number;
    solo: number;
  };

  scoreChart: {
    date: string;
    score: number;
  }[];
};

// =====================================================
// AI SUMMARY
// =====================================================

export type AISummary = {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  comment: string;
};

// =====================================================
// INTERESTED CATEGORY
// =====================================================

export type InterestedCategory = {
  id: number;

  name: string;

  count: number;
};

// =====================================================
// UPCOMING SESSION
// =====================================================

export type UpcomingSession = {
  id: number;

  mentor: {
    id: number;

    name: string;

    avatarUrl: string | null;
  };

  coachingPlan: {
    id: number;

    title: string;

    duration: number;
  };

  startTime: string;

  endTime: string;

  status: string;
};

// =====================================================
// DASHBOARD OVERVIEW
// =====================================================

export type DashboardOverview = {
  analytics: AnalyticsOverviewData;

  aiSummary: AISummary;

  upcomingSessions: UpcomingSession[];

  categories: InterestedCategory[];
};
