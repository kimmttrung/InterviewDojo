// src/features/users/types/user.types.ts
export interface UserPublicProfile {
  id: number;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  linkedInLink: string | null;
  githubLink: string | null;
  experienceYears: number;
  currentLevel: string;
  role: 'CANDIDATE' | 'MENTOR' | 'ADMIN';
  status: string;
  targetRoleId: number | null;
  skills: Array<{
    skillId: number;
    name: string;
    type: string;
    level: string;
    experienceMonths: number;
    proofUrl: string | null;
  }>;
}
