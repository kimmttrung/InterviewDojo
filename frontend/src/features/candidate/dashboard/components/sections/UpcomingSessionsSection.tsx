import { UpcomingSessions } from '../upcoming-sessions/UpcomingSessions';
import { SessionSkeleton } from '../skeletons/SessionSkeleton';
import { useUpcomingSessions } from '../../hooks/useUpcomingSessions';
import { useCurrentUser } from '@/features/auth';

export const UpcomingSessionsSection = () => {
  const { data: user } = useCurrentUser();

  const { data, isLoading, isError } = useUpcomingSessions(user?.id || 0);

  if (isLoading) {
    return <SessionSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Failed to load sessions.
      </div>
    );
  }

  return <UpcomingSessions sessions={data} />;
};
