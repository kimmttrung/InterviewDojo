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
}