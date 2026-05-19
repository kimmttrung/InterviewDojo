import dayjs from 'dayjs';

import { Avatar, AvatarImage } from '@/shared/components/ui/avatar';

import { CountdownTimer } from './CountdownTimer';

import { JoinRoomButton } from './JoinRoomButton';

import { SessionStatusBadge } from './SessionStatusBadge';
import { CancelSessionButton } from './CancelSessionButton';

import { UpcomingSession } from '../../dashboard.type';

type UpcomingSessionCardProps = {
  session: UpcomingSession;
};

export const UpcomingSessionCard = ({ session }: UpcomingSessionCardProps) => {
  return (
    <div
      className="
        rounded-2xl
        border
        bg-background
        p-5
        transition-shadow
        hover:shadow-md
      "
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={session.mentor.avatarUrl ?? undefined} />
          </Avatar>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{session.mentor.name}</h3>

              <SessionStatusBadge status={session.status} />
            </div>

            <p className="text-sm text-muted-foreground">Mentoring Session</p>

            <p className="text-sm text-muted-foreground">
              {dayjs(session.startTime).format('DD MMM YYYY - HH:mm')}
            </p>

            <CountdownTimer scheduledAt={session.startTime} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CancelSessionButton scheduledAt={session.startTime} />

          <JoinRoomButton scheduledAt={session.startTime} />
        </div>
      </div>
    </div>
  );
};
