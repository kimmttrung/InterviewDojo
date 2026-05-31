export type UserRole = 'CANDIDATE' | 'MENTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BANNED';
export type BanDuration = 'PERMANENT' | 'TEMPORARY';

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  banReason: string | null;
  bannedUntil: string | null; // ISO string (UTC), hiển thị cần convert về ICT
  createdAt: string;
  experienceYears: number;
  mentorProfile?: { approvalStatus: string } | null;
  _count?: { reportsReceived: number };
}

export interface ReportedUserItem {
  user: AdminUser;
  reportCount: number;
  latestReason: string;
  latestReportAt: string;
  reportTypes: string[];
}

export interface BanFormData {
  duration: BanDuration;
  days?: number;
  reason: string;
}
