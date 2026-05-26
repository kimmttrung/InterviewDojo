import { Injectable } from '@nestjs/common';

@Injectable()
export class TargetRoleScoreService {
  calculateRoleScore(candidateRole: string, mentorRole: string): number {
    if (!candidateRole || !mentorRole || candidateRole === 'Unknown') return 0;

    const cRole = candidateRole.toLowerCase().trim();
    const mRole = mentorRole.toLowerCase().trim();

    if (cRole === mRole) return 1.0;

    const asymmetricMatrix: Record<string, Record<string, number>> = {
      // ==================== KHỐI WEB & SOFTWARE (ĐÃ CÓ & TINH CHỈNH) ====================
      'software engineer': {
        'fullstack engineer': 0.95,
        'backend engineer': 0.85,
        'frontend engineer': 0.8,
        'solutions architect': 0.75,
        'engineering manager': 0.6,
      },
      'frontend engineer': {
        'fullstack engineer': 0.9,
        'software engineer': 0.8,
        'ux designer': 0.45,
        'backend engineer': 0.3,
      },
      'backend engineer': {
        'fullstack engineer': 0.9,
        'solutions architect': 0.85,
        'software engineer': 0.8,
        'devops engineer': 0.55,
        'frontend engineer': 0.25,
      },
      'fullstack engineer': {
        'software engineer': 0.85,
        'backend engineer': 0.6,
        'frontend engineer': 0.55,
        'solutions architect': 0.65,
      },

      // ==================== KHỐI LẬP TRÌNH DI ĐỘNG (MOBILE) ====================
      'mobile developer': {
        'software engineer': 0.8, // Thường nắm chắc tư duy lập trình và cấu trúc dữ liệu nền tảng
        'fullstack engineer': 0.65, // Có thể hỗ trợ tốt mảng kết nối API/Backend của app
        'frontend engineer': 0.5, // Chia sẻ chung tư duy về UI/UX, State Management, Vòng đời Component
        'backend engineer': 0.2, // Lệch pha nặng về mặt client-side
      },

      // ==================== KHỐI AI, DATA SCIENCE & BIG DATA ====================
      'data scientist': {
        'machine learning engineer': 0.85,
        'data engineer': 0.75,
        'software engineer': 0.4,
      },
      'machine learning engineer': {
        'data scientist': 0.8,
        'data engineer': 0.7,
        'software engineer': 0.5,
      },
      'data engineer': {
        'solutions architect': 0.8, // Kiến trúc sư hệ thống hiểu sâu về luồng và lưu trữ dữ liệu lớn
        'backend engineer': 0.7, // Hỗ trợ tốt kỹ năng viết API thu thập dữ liệu và tối ưu SQL
        'data scientist': 0.5, // Chỉ mạnh về phân tích và mô hình, yếu về hạ tầng dữ liệu (Data Pipeline)
        'machine learning engineer': 0.65, // Biết cách deploy và kết nối luồng dữ liệu vào model
      },
      'data analyst': {
        'data scientist': 0.85, // Bao bọc tốt kiến thức toán thống kê và phân tích
        'data engineer': 0.7, // Hỗ trợ tốt phần xử lý dữ liệu thô (ETL) để làm báo cáo
        'product manager': 0.5, // Giúp định hướng phân tích số liệu để giải quyết bài toán kinh doanh
      },

      // ==================== KHỐI HẠ TẦNG & BẢO MẬT (INFRASTRUCTURE & SECURITY) ====================
      'devops engineer': {
        'solutions architect': 0.85,
        'backend engineer': 0.5,
        'frontend engineer': 0.1,
      },
      'solutions architect': {
        'devops engineer': 0.75, // Triển khai hạ tầng tốt nhưng có thể thiếu tư duy thiết kế tổng thể
        'backend engineer': 0.7, // Hiểu sâu logic ứng dụng, cần bổ sung thêm kiến thức hạ tầng mảng Cloud
        'engineering manager': 0.5,
      },
      'security engineer': {
        'solutions architect': 0.75, // Hiểu kiến trúc hệ thống để rà soát lỗ hổng bảo mật
        'backend engineer': 0.6, // Hỗ trợ tốt mảng bảo mật mã nguồn (Secure Coding, OWASP Top 10)
        'devops engineer': 0.65, // Giao thoa mạnh ở mảng DevSecOps (Bảo mật luồng CI/CD)
        'frontend engineer': 0.15,
      },

      // ==================== KHỐI QUẢN TRỊ & SẢN PHẨM (PRODUCT & MANAGEMENT) ====================
      'product manager': {
        'engineering manager': 0.7, // Hiểu luồng vận hành sản phẩm và cách làm việc với các stakeholder
        'scrum master': 0.6, // Hỗ trợ tốt về mặt quy trình vận hành Agile/Scrum của team
        'ux designer': 0.55, // Hỗ trợ tốt mảng tư duy sản phẩm hướng người dùng (User-Centric)
        'software engineer': 0.35, // Chỉ hỗ trợ tốt góc nhìn Technical, thiếu tư duy Business/Market
      },
      'engineering manager': {
        'solutions architect': 0.7,
        'software engineer': 0.4,
        'product manager': 0.5, // Giúp bổ sung kỹ năng quản lý sản phẩm nhưng thiếu góc nhìn quản trị nhân sự/Tech Lead
      },
      'scrum master': {
        'product manager': 0.75, // Hiểu rõ quy trình Agile và cách điều phối dự án
        'engineering manager': 0.7, // Nắm chắc kỹ năng quản trị và tháo gỡ nút thắt (Blocker) cho team
        'technical writer': 0.4, // Giúp chuẩn hóa tài liệu quy trình nhưng thiếu kỹ năng điều phối (Facilitation)
      },

      // ==================== KHỐI ĐẢM BẢO CHẤT LƯỢNG (QA / TESTING) ====================
      'qa engineer': {
        'software engineer': 0.75, // Hỗ trợ cực tốt cho Automation Test nhờ tư duy viết code vững chắc
        'backend engineer': 0.55, // Giúp ích cho mảng Test API, Performance Test hoặc Security Test
        'frontend engineer': 0.5, // Hỗ trợ tốt mảng UI Testing, E2E Testing bằng Cypress/Playwright
        'product manager': 0.4, // Chỉ hỗ trợ tốt mảng kiểm thử nghiệp vụ (UAT), không mạnh kỹ thuật
      },

      // ==================== KHỐI THIẾT KẾ (DESIGN) ====================
      'ux designer': {
        'product manager': 0.7, // Mạnh về tư duy nghiên cứu trải nghiệm người dùng (User Research)
        'frontend engineer': 0.55, // Hiểu sâu về UI Component và khả năng khả thi khi lập trình (Feasibility)
        'backend engineer': 0.1, // Lệch pha hoàn toàn hệ sinh thái
      },

      // ==================== KHỐI TÀI LIỆU KỸ THUẬT (TECHNICAL WRITING) ====================
      'technical writer': {
        'software engineer': 0.65, // Hiểu code để giải thích API, hệ thống cho lập trình viên khác đọc
        'product manager': 0.6, // Nắm bắt tốt nghiệp vụ để viết tài liệu hướng dẫn sử dụng sản phẩm
        'qa engineer': 0.5, // Có thói quen viết tài liệu kịch bản kiểm thử (Test Case) chi tiết
      },
    };

    // Tra cứu trực tiếp theo đúng chiều: Candidate cần gì -> Mentor có đáp ứng được không
    const score = asymmetricMatrix[cRole]?.[mRole];

    // Nếu tìm thấy hệ số giao thoa thì trả về, nếu không thuộc nhóm liên quan trả điểm sàn 0.15
    return score !== undefined ? score : 0.15;
  }

  calculateBestRoleScore(candidateRole: string, mentorRoles: string[]): number {
    if (!mentorRoles || mentorRoles.length === 0 || !candidateRole) {
      return 0.15;
    }

    const scores = mentorRoles.map((mRole) =>
      this.calculateRoleScore(candidateRole, mRole),
    );

    return Math.max(...scores);
  }
}
