import { Badge } from '@/shared/components/ui/badge';

type SessionStatusBadgeProps = {
  status: string;
};

export const SessionStatusBadge = ({ status }: SessionStatusBadgeProps) => {
  if (status !== 'ACCEPTED') {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className="relative gap-2 pl-2 pr-2.5 py-0.5 font-semibold text-xs tracking-wide uppercase bg-neutral-100 hover:bg-neutral-100 text-neutral-800 border border-neutral-200/80 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-800 rounded-full shadow-sm"
    >
      {/* Hiệu ứng chấm tròn nhấp nháy */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      Upcoming
    </Badge>
  );
};
