export class UserDetailDto {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  status: string;
  creditBalance: number;
  createdAt: Date;
  experienceYears: number;
  linkedInLink: string | null;
  githubLink: string | null;
  targetRoleId: number | null;
}
