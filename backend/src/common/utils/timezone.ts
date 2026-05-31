import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const toUTC = (date: Date, timezone = DEFAULT_TIMEZONE) => {
  return fromZonedTime(date, timezone);
};

export const toLocal = (date: Date, timezone = DEFAULT_TIMEZONE) => {
  return toZonedTime(date, timezone);
};

export const formatLocalDate = (date: Date, timezone = DEFAULT_TIMEZONE) => {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
};

export const formatLocalDateTime = (
  date: Date,
  timezone = DEFAULT_TIMEZONE,
) => {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd HH:mm');
};
