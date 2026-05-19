import { Card, CardContent } from '@/shared/components/ui/card';

import { UpcomingSession } from '../../dashboard.type';

import { UpcomingSessionCard } from './UpcomingSessionCard';

type UpcomingSessionsProps = {
  sessions: UpcomingSession[];
};

export const UpcomingSessions = ({ sessions }: UpcomingSessionsProps) => {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">Upcoming Sessions</h2>

          <p className="text-sm text-muted-foreground">Your next mentoring sessions</p>
        </div>

        <div className="space-y-4">
          {sessions.map((session) => (
            <UpcomingSessionCard key={session.id} session={session} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
