export interface PlanResponse {
  id: number;
  mentorId: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
}
