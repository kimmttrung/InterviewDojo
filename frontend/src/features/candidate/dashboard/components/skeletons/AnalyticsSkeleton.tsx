import { Skeleton } from '@/shared/components/ui/skeleton';

export const AnalyticsSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />

                <Skeleton className="h-8 w-16" />
              </div>

              <Skeleton className="h-12 w-12 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />

          <Skeleton className="h-4 w-64" />
        </div>

        <Skeleton className="mt-6 h-[300px] w-full rounded-xl" />
      </div>
    </div>
  );
};
