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
} as const;
