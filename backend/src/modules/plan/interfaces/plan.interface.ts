export interface PlanResponse {
  id: number;
  mentorId: number;
  categoryId: number;
  categoryName: string | null;
  title: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
}
