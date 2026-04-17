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

  // Feedback
  AI_ANALYSIS: {
    TRANSCRIPT_GENERATED: 'Tạo bản ghi âm thành công',
    TRANSCRIPT_FAILED: 'Tạo bản ghi âm thất bại',
    FEEDBACK_GENERATED: 'Tạo phản hồi thành công',
    ANALYSIS_FAILED: 'Phân tích thất bại',
    ANALYSIS_TIMEOUT: 'Phân tích quá thời gian cho phép',
    NO_SPEECH_DETECTED: 'Không phát hiện tiếng nói',
  },

  SOLO_RECORDING: {
    UPLOAD_AUDIO_SUCCESS: 'Tải lên thành công và đang phân tích',
    UPLOAD_VIDEO_SUCCESS: 'Tải lên video thành công',

    UPLOAD_AUDIO_FAILED: 'Tải lên âm thanh thất bại',
    UPLOAD_VIDEO_FAILED: 'Tải lên video thất bại',

    ERROR_AUDIO_FILE: 'File tải lên không phải là audio hợp lệ',
    ERROR_VIDEO_FILE: 'File tải lên không phải là video hợp lệ',

    USER_RECORDINGS_FETCHED: 'Lấy bản ghi âm của người dùng thành công',
  },
} as const;
