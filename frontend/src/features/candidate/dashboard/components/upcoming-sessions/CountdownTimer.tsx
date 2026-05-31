'use client';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { useEffect, useMemo, useState } from 'react';

dayjs.extend(duration);

type CountdownTimerProps = {
  scheduledAt: string;
};

// ============================================================
// HELPERS
// ============================================================

const formatRemainingTime = (scheduledAt: string) => {
  const now = dayjs();

  const target = dayjs(scheduledAt);

  const diff = target.diff(now);

  if (diff <= 0) {
    return 'Session started';
  }

  const durationValue = dayjs.duration(diff);

  const totalHours = Math.floor(durationValue.asHours());

  const days = Math.floor(totalHours / 24);

  const hours = totalHours % 24;

  const minutes = durationValue.minutes();

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
};

// ============================================================
// COMPONENT
// ============================================================

export const CountdownTimer = ({ scheduledAt }: CountdownTimerProps) => {
  const initialValue = useMemo(() => formatRemainingTime(scheduledAt), [scheduledAt]);

  const [timeLeft, setTimeLeft] = useState(initialValue);

  useEffect(() => {
    setTimeLeft(formatRemainingTime(scheduledAt));

    const interval = setInterval(() => {
      setTimeLeft(formatRemainingTime(scheduledAt));
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [scheduledAt]);

  return <p className="text-sm font-semibold text-primary">{timeLeft}</p>;
};
