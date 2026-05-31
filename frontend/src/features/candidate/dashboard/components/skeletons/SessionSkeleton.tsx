import { Skeleton } from '@/shared/components/ui/skeleton';

export const SessionSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />

              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />

                <Skeleton className="h-4 w-28" />

                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};
