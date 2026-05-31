// components/StatusBadge.tsx

import type { ApprovalStatus } from '../types/mentorProfile.response';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',

  PENDING: 'bg-amber-100 text-amber-700',

  REJECTED: 'bg-red-100 text-red-700',

  SUSPENDED: 'bg-rose-100 text-rose-700',

  INCOMPLETE: 'bg-slate-100 text-slate-700',
};

interface Props {
  status: ApprovalStatus;
}

export function StatusBadge({ status }: Props) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status === 'PENDING' ? 'PENDING REVIEW' : status}
    </span>
  );
}
