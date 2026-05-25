// src/features/session/pages/MentorSessionsPage.tsx
import { MentorLayout } from '@/features/mentor/dashboard/components/MentorLayout';
import { SessionFilters } from '../components/SessionFilters';
import { SessionListByType } from '../components/SessionListByType';
import { RefreshCw } from 'lucide-react';
import { useSessionsByType } from '../hooks/useSessionByType';
import { Button } from '@/shared/components/ui/button';

export default function MentorSessionsPage() {
  const { refetch, isRefetching } = useSessionsByType('MENTOR_BOOKING');

  return (
    <MentorLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Mentor Sessions</h1>
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <SessionFilters type="MENTOR_BOOKING" />
        <SessionListByType type="MENTOR_BOOKING" />
      </div>
    </MentorLayout>
  );
}
