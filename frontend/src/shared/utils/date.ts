const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Format ISO string -> YYYY-MM-DD
 * Dùng cho input type="date"
 */
export const formatDateForInput = (value?: string | Date | null): string => {
  if (!value) return '';

  const date = new Date(value);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DEFAULT_TIMEZONE,
  }).format(date);
};

/**
 * Format ISO string -> YYYY-MM-DDTHH:mm
 * Dùng cho input type="datetime-local"
 */
export const formatDateTimeForInput = (value?: string | Date | null): string => {
  if (!value) return '';

  const date = new Date(value);

  // convert UTC -> local browser datetime-local format
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 16);
};

/**
 * Format hiển thị giờ Việt Nam
 * VD: 13:00
 */
export const formatICTTime = (value?: string | Date | null): string => {
  if (!value) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DEFAULT_TIMEZONE,
  }).format(new Date(value));
};

/**
 * Format ngày giờ Việt Nam
 * VD: 22/06/2026 13:00
 */
export const formatICTDateTime = (value?: string | Date | null): string => {
  if (!value) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DEFAULT_TIMEZONE,
  }).format(new Date(value));
};

/**
 * Trả về YYYY-MM-DD hôm nay theo giờ VN
 * Dùng cho min date
 */
export const getTodayICT = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DEFAULT_TIMEZONE,
  }).format(new Date());
};

export const formatICTFullDate = (value?: string | Date | null): string => {
  if (!value) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
};

export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);

  return new Date(y, m - 1, d);
};
