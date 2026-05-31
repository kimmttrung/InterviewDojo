// interfaces/plan.interface.ts
export interface PlanResponse {
  id: number;
  mentorId: number;
  mentorUserId: number;
  categoryId: number;
  categoryName: string | null;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  questions?: PlanQuestion[];
}

export interface PlanQuestion {
  id: number;
  question: string;
  type: string;
  isRequired: boolean;
  orderIndex: number;
}
