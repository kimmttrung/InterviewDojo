import { Skeleton } from '@/shared/components/ui/skeleton';

import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import { SessionSkeleton } from './SessionSkeleton';

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <AnalyticsSkeleton />

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />

          <Skeleton className="h-4 w-60" />
        </div>

        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />

          <Skeleton className="h-4 w-[90%]" />

          <Skeleton className="h-4 w-[75%]" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 space-y-3">
            <Skeleton className="h-6 w-48" />

            <Skeleton className="h-4 w-64" />
          </div>

          <SessionSkeleton />
        </div>

        <div className="col-span-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 space-y-3">
            <Skeleton className="h-6 w-40" />

            <Skeleton className="h-4 w-52" />
          </div>

          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
