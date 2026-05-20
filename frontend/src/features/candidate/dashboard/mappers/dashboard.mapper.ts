import type {
  AISummary,
  AnalyticsOverviewData,
  InterestedCategory,
  UpcomingSession,
} from '../dashboard.type';

// =====================================================
// ANALYTICS
// =====================================================

export const mapAnalyticsOverview = (data: any): AnalyticsOverviewData => {
  return {
    completedSessions: Number(data?.completedSessions) || 0,

    savedQuestions: Number(data?.savedQuestions) || 0,

    completedCodingQuestions: Number(data?.completedCodingQuestions) || 0,

    overallScore: Number(data?.overallScore) || 0,

    sessionBreakdown: {
      mentor: Number(data?.sessionBreakdown?.mentor) || 0,

      p2p: Number(data?.sessionBreakdown?.p2p) || 0,

      solo: Number(data?.sessionBreakdown?.solo) || 0,
    },

    scoreChart: Array.isArray(data?.scoreChart)
      ? data.scoreChart.map((item: any) => ({
          date: item?.date ?? '',

          score: Number(item?.score) || 0,
        }))
      : [],
  };
};

// =====================================================
// AI SUMMARY
// =====================================================

export const mapAISummary = (data: any): AISummary => {
  return {
    strengths: Array.isArray(data?.strengths) ? data.strengths : [],

    weaknesses: Array.isArray(data?.weaknesses) ? data.weaknesses : [],

    suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],

    comment: data?.comment ?? '',
  };
};

// =====================================================
// UPCOMING SESSIONS
// =====================================================

export const mapUpcomingSessions = (data: any): UpcomingSession[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((session: any) => ({
    id: session?.id ?? 0,

    mentor: {
      id: session?.mentor?.id ?? 0,

      name: session?.mentor?.name ?? '',

      avatarUrl: session?.mentor?.avatarUrl ?? '',
    },

    coachingPlan: {
      id: session?.coachingPlan?.id ?? 0,

      title: session?.coachingPlan?.title ?? '',

      duration: Number(session?.coachingPlan?.duration) || 0,
    },

    startTime: session?.startTime ?? '',

    endTime: session?.endTime ?? '',

    status: session?.status ?? '',
  }));
};

// =====================================================
// INTERESTED CATEGORIES
// =====================================================

export const mapInterestedCategories = (data: any): InterestedCategory[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((category: any) => ({
    id: category?.id ?? 0,

    name: category?.name ?? '',

    count: Number(category?.count) || 0,
  }));
};
