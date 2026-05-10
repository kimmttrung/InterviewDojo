export interface MentorResponse {
  id: number;
  email: string;
  name: string | null;
  bio: string | null;
  experienceYears: number;
  avatarUrl: string | null;
  cvUrl: string | null;
  certificateUrl: string | null;
  approvalStatus: string | null;
  createdAt: Date;
}
