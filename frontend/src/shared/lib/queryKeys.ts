export const queryKeys = {
  questions: {
    all: ['questions'] as const,
    list: (params: any) => ['questions', params] as const,
    detail: (id: string) => ['questions', id] as const,
  },
  user: {
    me: ['user', 'me'] as const,
    profile: (id: string) => ['user', id] as const,
  },
  questionBank: {
    all: ['questionBank'] as const,
    filtered: (filters: any) => ['questionBank', filters] as const,
  },
  matching: {
    status: ['matching', 'status'] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  companies: {
    all: ['companies'] as const,
  },
  mentor: {
    list: (filters: Record<string, any>) => ['mentors', filters] as const,

    profile: ['mentor-profile'] as const,

    experiences: ['mentor-experiences'] as const,

    coachingPlans: ['mentor-coaching-plans'] as const,

    skills: ['mentor-skills'] as const,
  },
  session: {
    list: (filters: Record<string, any>) => ['sessions', filters] as const,
    detail: (id: string | number) => ['sessions', id] as const,
  },

  admin: {
    statistics: ['admin', 'statistics'] as const,
    mentors: (filters?: any) => ['admin', 'mentors', filters] as const,
    mentorDetail: (id: number) => ['admin', 'mentors', id] as const,
    users: (filters?: any) => ['admin', 'users', filters] as const,
    reportedUsers: ['admin', 'users', 'reported'] as const,
    reports: (filters?: any) => ['admin', 'reports', filters] as const,
    reportDetail: (id: number) => ['admin', 'reports', id] as const,
    questions: (filters?: any) => ['admin', 'questions', filters] as const,
    questionDetail: (id: number) => ['admin', 'questions', id] as const,
    coachingCategories: ['admin', 'coachingCategories'] as const,
  },
} as const;
