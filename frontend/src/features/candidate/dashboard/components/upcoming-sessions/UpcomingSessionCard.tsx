import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';

import { CountdownTimer } from './CountdownTimer';
import { SessionStatusBadge } from './SessionStatusBadge';
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

        {/* Cụm bên phải giờ chỉ còn duy nhất nút Xem chi tiết */}
        <div className="flex items-center">
          <Button variant="outline" asChild>
            <Link to={`/sessions`}>Xem chi tiết</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
