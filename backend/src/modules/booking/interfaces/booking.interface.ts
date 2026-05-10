export interface BookingResponse {
  id: number;
  slotId: number;
  mentorId: number;
  candidateId: number;
  coachingPlanId: number;
  status: string;
  createdAt: Date;
  // Bổ sung thông tin gói để Client dễ hiển thị
  planDetails?: {
    title: string;
    price: number;
    duration: number;
  };
}
