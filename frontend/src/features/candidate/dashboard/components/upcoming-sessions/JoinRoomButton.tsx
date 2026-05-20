import dayjs from 'dayjs';

import { Button } from '@/shared/components/ui/button';

type JoinRoomButtonProps = {
  scheduledAt: string;
};

export const JoinRoomButton = ({ scheduledAt }: JoinRoomButtonProps) => {
  const canJoin = dayjs(scheduledAt).diff(dayjs(), 'minute') <= 30;

  return (
    <Button size="sm" disabled={!canJoin}>
      Join Room
    </Button>
  );
};
