export const API_ENPOINT = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login'
    },
    USER: {
        UPDATE_ME: '/users/me',
        GET_ME: '/users/me',
        UPDATE_TARGET_ROLE: '/users/target-role',
    },
    TARGET_ROLE: {
        GET: 'target-roles',
        CREATE: 'target-roles',
        CREATE_LIST: 'target-roles/bulk',
    },
    MENTOR: {
        UPDATE_ME: 'users/mentor-profile'
    },
    CODE_ENGINE: {
        RUN: '/code-engine/run',
    },
    QUESTIONS: {
        GET_ALL: '/questions',
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
}