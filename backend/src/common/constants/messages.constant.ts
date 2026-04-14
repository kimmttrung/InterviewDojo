export const Messages = {
    // fallback theo method
    DEFAULT: {
        GET: 'Lấy dữ liệu thành công',
        POST: 'Tạo mới thành công',
        PUT: 'Cập nhật thành công',
        PATCH: 'Cập nhật thành công',
        DELETE: 'Xóa thành công',
    },

    // Auth
    AUTH: {
        LOGIN_SUCCESS: 'Đăng nhập thành công',
        LOGOUT_SUCCESS: 'Đăng xuất thành công',
        REGISTER_SUCCESS: 'Đăng ký thành công',
        TOKEN_REFRESHED: 'Làm mới token thành công',
    },

    // Coding
    CODING: {
        SUBMIT_SUCCESS: 'Submission đã được nhận và đang xử lý',
        QUESTION_CREATED: 'Tạo câu hỏi coding thành công',
        TESTCASE_ADDED: 'Thêm test case thành công',
        QUESTION_FETCHED: 'Lấy câu hỏi thành công',
        SUBMISSION_FETCHED: 'Lấy kết quả submission thành công',
    },

    // User
    USER: {
        PROFILE_FETCHED: 'Lấy thông tin người dùng thành công',
        PROFILE_UPDATED: 'Cập nhật thông tin thành công',
    },

    // Booking
    BOOKING: {
        CREATED: 'Đặt lịch thành công',
        CANCELLED: 'Huỷ lịch thành công',
        FETCHED: 'Lấy danh sách lịch thành công',
    },
} as const;