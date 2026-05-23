export type SkillOption = {
  id: number;
  name: string;
  type: 'HARDSKILL' | 'SOFTSKILL' | 'LANGUAGE';
};

export type UserSkillPayload = {
  skillId: number;
  type: 'HARDSKILL' | 'SOFTSKILL' | 'LANGUAGE';
  experienceMonths: number;
  level: 'LEARNING' | 'PRACTICED' | 'PERSONAL_PROJECT' | 'PRODUCTION_READY' | 'EXPERT';

  proofUrl?: string;
};
