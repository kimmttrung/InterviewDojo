// features/admin/job-roles/types/job-role.types.ts
export interface JobRole {
  id: number;
  name: string;
  description?: string | null;
  _count?: {
    questions: number;
  };
}
