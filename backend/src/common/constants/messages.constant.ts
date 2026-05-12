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
    ADMIN_CREATED: 'Tạo admin thành công',
    USER_FETCHED: 'Lấy thông tin người dùng thành công',
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
    TARGET_ROLE_UPDATED: 'Cập nhật target role thành công',
    MENTOR_PROFILE_CREATED: 'Tạo hồ sơ mentor thành công',
    AVATAR_UPLOADED: 'Cập nhật ảnh đại diện thành công',
  },

  // Booking
  BOOKING: {
    CREATED: 'Đặt lịch thành công',
    CANCELLED: 'Huỷ lịch thành công',
    FETCHED: 'Lấy danh sách lịch thành công',
    DETAIL_FETCHED: 'Lấy chi tiết lịch đặt thành công',
    STATUS_UPDATED: 'Cập nhật trạng thái lịch đặt thành công',
    NOT_FOUND: 'Không tìm thấy lịch đặt hoặc không có quyền truy cập',
    SLOT_UNAVAILABLE: 'Khung giờ này đã được đặt hoặc không khả dụng',
    PLAN_NOT_FOUND: 'Gói dịch vụ không tồn tại hoặc đã bị khóa',
    INVALID_TRANSITION: 'Không thể chuyển đổi sang trạng thái này',
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
  QUESTIONS: {
    FETCHED: 'Lấy danh sách câu hỏi thành công',
    FETCH_ONE: 'Lấy thông tin câu hỏi thành công',
    CREATED: 'Tạo câu hỏi thành công',
    UPDATED: 'Cập nhật câu hỏi thành công',
    DELETED: 'Xóa câu hỏi thành công',
    RANDOM_FETCHED: 'Lấy câu hỏi ngẫu nhiên thành công',
  },

  SLOT: {
    FETCHED: 'Lấy danh sách slot thành công',
    CREATED: 'Tạo mới slot thành công',
    BATCH_CREATED: 'Tạo hàng loạt slot thành công',
    UPDATED: 'Cập nhật thông tin slot thành công',
    DELETED: 'Xóa slot thành công',
    BATCH_DELETED: 'Xóa hàng loạt slot thành công',
    NOT_FOUND: 'Không tìm thấy slot hoặc không có quyền truy cập',
    INVALID_STATUS:
      'Chỉ có thể thao tác với slot đang ở trạng thái trống (AVAILABLE)',
  },

  MENTOR: {
    FETCHED: 'Lấy danh sách mentor thành công',
    DETAIL_FETCHED: 'Lấy thông tin mentor thành công',
    UPDATED: 'Cập nhật hồ sơ mentor thành công',
    NOT_FOUND: 'Không tìm thấy mentor',
    FORBIDDEN: 'Bạn không có quyền truy cập',
  },
  PLAN: {
    FETCHED: 'Lấy danh sách gói dịch vụ thành công',
    DETAIL_FETCHED: 'Lấy thông tin gói dịch vụ thành công',
    CREATED: 'Tạo mới gói dịch vụ thành công',
    UPDATED: 'Cập nhật gói dịch vụ thành công',
    DELETED: 'Xóa gói dịch vụ thành công',
    APPROVED: 'Duyệt gói dịch vụ thành công',
    NOT_FOUND: 'Không tìm thấy gói dịch vụ hoặc không có quyền truy cập',
    FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này',
  },

  COACHING_CATEGORY: {
    FETCHED: 'Lấy danh sách danh mục coaching thành công',
    CREATED: 'Tạo danh mục coaching thành công',
    UPDATED: 'Cập nhật danh mục coaching thành công',
    DELETED: 'Xóa danh mục coaching thành công',
  },
} as const;
