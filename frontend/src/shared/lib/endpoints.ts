export const API_ENDPOINT = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh', // <<-- phải có dòng này
    ME: '/auth/me',
  },
  USER: {
    UPDATE_ME: '/users/me',
    GET_ME: '/users/me',
    UPDATE_TARGET_ROLE: '/users/target-role',
    AVATAR: '/users/me/avatar',
  },
  TARGET_ROLE: {
    GET: 'target-roles',
    CREATE: 'target-roles',
    CREATE_LIST: 'target-roles/bulk',
  },
  MENTOR: {
    UPDATE_ME: '/mentors/me',
    GET_LIST: '/mentors',
  },
  MENTORS: {
    GET_ALL: '/mentors',
    GET_ONE: (id: number | string) => `/mentors/${id}`,
    GET_AVAILABLE_SLOTS: (id: number | string) => `/mentors/${id}/available-slots`,
  },
  CODE_ENGINE: {
    RUN: '/code-engine/run',
  },
  QUESTIONS: {
    GET_ALL: '/questions',
    GET_RANDOM: '/questions/random',
    GET_ONE: (id: string) => `/questions/${id}`,
    CREATE: '/questions',
    UPDATE: (id: number) => `/questions/${id}`,
    DELETE: (id: number) => `/questions/${id}`,
  },
  CATEGORIES: {
    GET_ALL: '/categories',
    GET_ONE: (id: number) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id: number) => `/categories/${id}`,
    DELETE: (id: number) => `/categories/${id}`,
  },
  COMPANIES: {
    GET_ALL: '/companies',
    GET_INDUSTRIES: '/companies/industries',
    GET_ONE: (id: number) => `/companies/${id}`,
    CREATE: '/companies',
    UPDATE: (id: number) => `/companies/${id}`,
    DELETE: (id: number) => `/companies/${id}`,
  },
  MATCHING: {
    JOIN: '/matching/join',
  },
  CODING: {
    GET_ALL: '/coding/questions',
    SUBMIT: '/coding/submit',
    GET_SUBMISSION: (id: number) => `/coding/submission/${id}`,
    GET_QUESTION: (slug: string) => `/coding/question/${slug}`,
  },
  SOLO_RECORDING: {
    UPLOAD_VIDEO: '/solo-recordings/upload-video',
    UPLOAD_AUDIO: '/solo-recordings/upload',
    GET_USER_RECORDINGS: (userId: number | string) => `/solo-recordings/user/${userId}`,
    UPDATE_VIDEO_URL: (recordingId: number) => `/solo-recordings/${recordingId}/video`,
  },
  AI_ANALYSIS: {
    GET_SOLO_RECORDING: (sessionId: number | string) => `/ai-analysis/session/${sessionId}`,
  },

  SLOTS: {
    GET_ALL: '/slots',
    CREATE: '/slots',
    CREATE_BATCH: '/slots/batch',
    UPDATE: (id: number | string) => `/slots/${id}`,
    DELETE: (id: number | string) => `/slots/${id}`,
    DELETE_BATCH: '/slots/batch',
    GET_AVAILABLE_DAYS: (mentorId: number | string) => `/slots/mentors/${mentorId}/available-days`,
    GET_AVAILABLE_SESSIONS: (mentorId: number | string) =>
      `/slots/mentors/${mentorId}/available-sessions`,
  },
  SKILLS: {
    GET_ALL: '/skills',
  },
  COACHING_CATEGORIES: {
    GET_ALL: '/coaching-categories',
  },
  PLANS: {
    GET_BY_USER: (userId: number | string) => `/plans/users/${userId}`,
  },
};
