export interface StatsDelta {
  totalUsers: number;
  totalMentors: number;
  totalCandidates: number;
  totalBookings: number;
  pendingReports: number;
}

export interface DashboardStatistics {
  totalUsers: number;
  totalMentors: number;
  totalCandidates: number;
  totalQuestions: number;
  totalBookings: number;
  pendingReports: number;
  delta: StatsDelta;
}

export interface GrowthChartItem {
  month: string;
  newUsers: number;
  newBookings: number;
}

export interface TopMentor {
  rank: number;
  id: number;
  name: string;
  avatarUrl: string | null;
  bookingCount: number;
  avgRating: number | null;
}
