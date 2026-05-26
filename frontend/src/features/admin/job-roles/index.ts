// features/admin/job-roles/index.ts
export {
  useJobRoles,
  useCreateJobRole,
  useUpdateJobRole,
  useDeleteJobRole,
} from './hooks/useJobRoles';
export { jobRoleApi } from './api/jobRoleApi';
export type { JobRole } from './types/job-role.types';
