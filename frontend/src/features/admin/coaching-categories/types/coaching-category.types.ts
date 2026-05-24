export interface CoachingCategory {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { plans: number };
}

export interface CreateCoachingCategoryDto {
  slug: string;
  name: string;
  description?: string;
}

export interface UpdateCoachingCategoryDto extends Partial<CreateCoachingCategoryDto> {}
