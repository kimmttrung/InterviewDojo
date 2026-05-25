import { Injectable } from '@nestjs/common';

@Injectable()
export class AvailibilityScoreService {
  calculateAvailabilityScore(
    candidateHistory: { startTime: Date; endTime: Date }[],
    mentorSlots: { startTime: Date; endTime: Date }[],
  ): number {
    if (mentorSlots.length === 0) return 0;
    // Nếu ứng viên chưa từng có lịch sử phỏng vấn completed -> trả về hệ số trung bình 0.5 để không triệt tiêu điểm mentor
    if (candidateHistory.length === 0) return 0.5;

    let matchedSlots = 0;

    for (const mSlot of mentorSlots) {
      const mStart = new Date(mSlot.startTime);
      const mEnd = new Date(mSlot.endTime);

      // Trích xuất giờ/phút quy đổi ra phút trong ngày của Mentor Slot
      const mStartMins = mStart.getHours() * 60 + mStart.getMinutes();
      const mEndMins = mEnd.getHours() * 60 + mEnd.getMinutes();
      const mDay = mStart.getDay(); // 0: Chủ Nhật, 1: Thứ 2,...

      // Duyệt xem có khớp với thói quen cũ nào của Candidate không
      const isMatch = candidateHistory.some((cHist) => {
        const cStart = new Date(cHist.startTime);
        const cEnd = new Date(cHist.endTime);

        const cStartMins = cStart.getHours() * 60 + cStart.getMinutes();
        const cEndMins = cEnd.getHours() * 60 + cEnd.getMinutes();
        const cDay = cStart.getDay();

        // Điều kiện khớp: Trùng Thứ trong tuần AND Khung giờ của Mentor bọc được/giao thoa với giờ học cũ của Candidate
        const isSameDay = mDay === cDay;
        const isTimeOverlap = mStartMins <= cEndMins && mEndMins >= cStartMins;

        return isSameDay && isTimeOverlap;
      });

      if (isMatch) matchedSlots++;
    }

    // Trả về tỷ lệ số slot khớp trên tổng số slot đang mở của Mentor (Giới hạn tối đa bằng 1)
    return Math.min(matchedSlots / mentorSlots.length, 1);
  }
}
