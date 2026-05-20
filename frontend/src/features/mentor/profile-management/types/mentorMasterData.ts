import { SkillType } from './mentor.types';

export interface SkillOption {
  id: number;
  name: string;
  type: SkillType;
}

export interface CompanyOption {
  id: number;

  name: string;

  logoUrl?: string;

  industry?: string;
}

export interface JobRoleOption {
  id: number;

  name: string;

  description?: string;
}

export interface CoachingCategoryOption {
  id: number;

  name: string;

  slug: string;

  description?: string;
}
