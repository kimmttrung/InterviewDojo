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
    NOT_FOUND: 'Không tìm thấy người dùng',
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
    NOT_ENOUGH_CREDIT:
      'Số dư tài khoản không đủ, vui lòng nạp tiền để hoàn thành giao dịch',
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
    GET_AVAILABLE_DAYS: 'Lấy danh sách ngày khả dụng thành công',
    GET_AVAILABLE_SESSIONS: 'Lấy danh sách khung giờ khả dụng thành công',
  },

  MENTOR: {
    FETCHED: 'Lấy danh sách mentor thành công',
    DETAIL_FETCHED: 'Lấy thông tin mentor thành công',
    UPDATED: 'Cập nhật hồ sơ mentor thành công',
    AVAILABLE_SLOTS_FETCHED: 'Lấy lịch rảnh của mentor thành công',
    EXPERIENCE_CREATED: 'Thêm kinh nghiệm thành công',
    SKILL_ADDED: 'Thêm kỹ năng thành công',
    COACHING_PLAN_CREATED: 'Tạo gói dịch vụ thành công',
    SUBMITTED: 'Gửi hồ sơ mentor để xét duyệt thành công',
    APPROVED: 'Duyệt mentor thành công',
    REJECTED: 'Từ chối mentor thành công',
    NOT_FOUND: 'Không tìm thấy mentor',
    NOT_MENTOR: 'Bạn không phải mentor',
    UPLOAD_INTRODUCTION_VIDEO_SUCCESS: 'Upload video giới thiệu thành công',
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
  MENTOR_BOOKING: {
    FETCHED: 'Lấy danh sách booking thành công',
    DETAIL_FETCHED: 'Lấy chi tiết booking thành công',
    ACCEPT_SUCCESS: 'Đã chấp nhận booking',
    REJECT_SUCCESS: 'Đã từ chối booking',
    NOT_FOUND: 'Không tìm thấy booking',
    NOT_AUTHORIZED: 'Bạn không có quyền xử lý booking này',
    INVALID_STATUS: 'Booking không ở trạng thái PENDING',
    SLOT_UNAVAILABLE: 'Slot đã bị block hoặc không khả dụng',
    MENTOR_NOT_ACTIVE: 'Tài khoản mentor chưa được kích hoạt',
  },

  COACHING_CATEGORY: {
    FETCHED: 'Lấy danh sách danh mục coaching thành công',
    CREATED: 'Tạo danh mục coaching thành công',
    UPDATED: 'Cập nhật danh mục coaching thành công',
    DELETED: 'Xóa danh mục coaching thành công',
  },

  SKILL: {
    FETCHED: 'Lấy danh sách kỹ năng thành công',
  },

  COMPANY: {
    FETCHED: 'Lấy danh sách công ty thành công',
    CREATED: 'Tạo công ty thành công',
    UPDATED: 'Cập nhật công ty thành công',
    DELETED: 'Xóa công ty thành công',
    INDUSTRIES_FETCHED: 'Lấy danh sách ngành nghề thành công', // ← thêm
  },

  WALLET: {
    FETCHED: 'Lấy số dư ví thành công',
    TRANSACTIONS_FETCHED: 'Lấy lịch sử giao dịch thành công',
  },

  NOTIFICATIONS: {
    FETCHED: 'Lấy danh sách thông báo thành công',
    MARKED_AS_READ: 'Đã đánh dấu thông báo là đã đọc',
    MARKED_ALL_AS_READ: 'Đã đánh dấu tất cả thông báo là đã đọc',
  },
} as const;
