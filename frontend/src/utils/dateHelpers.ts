import { BudgetPeriod } from '../types';

export const HEBREW_MONTH_NAMES: readonly string[] = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

export function getMonthLabel(date: Date): string {
  return `${HEBREW_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function getDaysElapsed(period: BudgetPeriod, today: Date): number {
  const totalDays = getTotalDays(period);

  const startMidnight = new Date(
    period.start.getFullYear(),
    period.start.getMonth(),
    period.start.getDate(),
    0, 0, 0, 0
  );
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0, 0, 0, 0
  );

  const diffMs = todayMidnight.getTime() - startMidnight.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 1;
  const elapsed = diffDays + 1;
  return Math.min(elapsed, totalDays);
}

export function getTotalDays(period: BudgetPeriod): number {
  const diffMs = period.end.getTime() - period.start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function formatExpenseDate(isoDate: string, createdAt: string): string {
  const [year, month, day] = isoDate.split('-');

  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const dayName = HEBREW_DAYS[dateObj.getDay()];

  const ts = new Date(createdAt);
  const hours   = String(ts.getHours()).padStart(2, '0');
  const minutes = String(ts.getMinutes()).padStart(2, '0');

  return `${day}/${month} ${dayName} ${hours}:${minutes}`;
}

export function formatDisplayTime(isoTimestamp: string): string {
  const ts = new Date(isoTimestamp);
  const hours   = String(ts.getHours()).padStart(2, '0');
  const minutes = String(ts.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateForDisplay(date: Date): string {
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year  = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function dateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
