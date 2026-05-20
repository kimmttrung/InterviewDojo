// utils/date.ts

export function formatDateForInput(date?: string | null): string {
  if (!date) {
    return '';
  }

  return date.split('T')[0];
}
