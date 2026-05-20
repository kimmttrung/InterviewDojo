import { Skeleton } from '@/shared/components/ui/skeleton';
import { useAISummary } from '../../hooks/useAISummary';
import { useCurrentUser } from '@/features/auth';

// Import component Card từ thư mục ai-summary
import { AISummaryCard } from '../ai-summary/AISummaryCard';

export const AISummarySection = () => {
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError } = useAISummary(user?.id || 0);

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>

        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[70%]" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Failed to load AI summary.
      </div>
    );
  }

  return <AISummaryCard summary={data} />;
};
