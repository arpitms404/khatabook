/**
 * Date and Time utilities for Asia/Kolkata timezone
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current date in YYYY-MM-DD in Asia/Kolkata timezone
 */
export function getTodayIST(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * Returns current month identifier in YYYY-MM
 */
export function getCurrentMonthIST(): string {
  return getTodayIST().slice(0, 7);
}

/**
 * Formats a YYYY-MM-DD or ISO string for friendly display in IST
 * e.g., "19 Oct 2026"
 */
export function formatDateIST(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Formats a month code (e.g., "2026-10") to "October 2026"
 */
export function formatMonthName(yearMonth: string): string {
  try {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, 15));
    return new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return yearMonth;
  }
}

/**
 * Returns an array of recent months for filtering [current, -1, -2, -3, -4, -5]
 */
export function getRecentMonths(count = 6): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    const label = new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      year: 'numeric',
    }).format(d);
    months.push({ key, label });
  }

  return months;
}
