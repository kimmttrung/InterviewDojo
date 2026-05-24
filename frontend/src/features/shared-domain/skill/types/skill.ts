export type SkillOption = {
  id: number;
  name: string;
  type: 'HARDSKILL' | 'SOFTSKILL' | 'LANGUAGE';
};

export type UserSkillPayload = {
  skillId: number;
  type: 'HARDSKILL' | 'SOFTSKILL' | 'LANGUAGE';
  experienceMonths: number;
  level: 'AWARENESS' | 'FOUNDATION' | 'AUTONOMOUS' | 'FLUENT' | 'LEADERSHIP';

  proofUrl?: string;
};
