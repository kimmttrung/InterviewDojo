export interface PlanResponse {
  id: number;
  mentorId: number; // ID của MentorProfile (nội bộ)
  mentorUserId: number; // ID của User (tiện cho frontend)
  categoryId: number;
  categoryName: string | null;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
}
