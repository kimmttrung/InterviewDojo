import dayjs from 'dayjs';

import { Button } from '@/shared/components/ui/button';

type CancelSessionButtonProps = {
  scheduledAt: string;
  onCancel?: () => void;
};

export const CancelSessionButton = ({ scheduledAt, onCancel }: CancelSessionButtonProps) => {
  const canCancel = dayjs(scheduledAt).diff(dayjs(), 'hour') > 24;

  return (
    <Button variant="outline" size="sm" disabled={!canCancel} onClick={onCancel}>
      Cancel
    </Button>
  );
};
