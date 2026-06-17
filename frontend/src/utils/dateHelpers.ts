/**
 * dateHelpers.ts
 *
 * Date formatting and calculation utilities for the expense tracker app.
 * All formatting targets Hebrew display conventions.
 * Uses local time throughout — no UTC conversion in display logic.
 */

import { BudgetPeriod } from '../types';

/**
 * Hebrew month names, indexed 0–11 (January=0 … December=11).
 * Used by getBudgetPeriod and getMonthLabel.
 */
export const HEBREW_MONTH_NAMES: readonly string[] = [
  'ינואר',    // 0 — January
  'פברואר',   // 1 — February
  'מרץ',      // 2 — March
  'אפריל',    // 3 — April
  'מאי',      // 4 — May
  'יוני',     // 5 — June
  'יולי',     // 6 — July
  'אוגוסט',   // 7 — August
  'ספטמבר',   // 8 — September
  'אוקטובר',  // 9 — October
  'נובמבר',   // 10 — November
  'דצמבר',    // 11 — December
];

/**
 * getMonthLabel(date: Date): string
 *
 * Returns a Hebrew month name + 4-digit year string.
 *
 * Example:
 *   getMonthLabel(new Date('2026-06-16')) → "יוני 2026"
 */
export function getMonthLabel(date: Date): string {
  return `${HEBREW_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * getMonthName(date: Date): string
 *
 * Alias for getMonthLabel — returns Hebrew month name + year.
 * Provided for frontend convenience under the name used in the task spec.
 */
export function getMonthName(date: Date): string {
  return getMonthLabel(date);
}

/**
 * getDaysElapsed(period: BudgetPeriod, today: Date): number
 *
 * Returns the number of days from period.start up to and including today,
 * capped at the total number of days in the period.
 *
 * Used for daily-average calculation in the current (incomplete) period.
 *
 * Examples:
 *   period = { start: 2026-06-01, end: 2026-07-01 }, today = 2026-06-16
 *   → 16 (days 1 through 16 inclusive)
 *
 *   If today is before period.start, returns 1 (avoid division by zero).
 *   If today is after period.end, returns getTotalDays(period).
 */
export function getDaysElapsed(period: BudgetPeriod, today: Date): number {
  const totalDays = getTotalDays(period);

  // Compute days elapsed: (today midnight − start midnight) / ms_per_day + 1
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

  if (diffDays < 0) return 1; // today before period — guard against /0
  const elapsed = diffDays + 1; // inclusive of start day
  return Math.min(elapsed, totalDays);
}

/**
 * getTotalDays(period: BudgetPeriod): number
 *
 * Returns the total number of calendar days in the budget period.
 * Calculated as (end − start) in whole days.
 *
 * Used for daily-average calculation in completed past periods.
 *
 * Examples:
 *   June 1 → July 1  = 30 days
 *   June 15 → July 15 = 30 days
 *   May 15 → June 15  = 31 days
 */
export function getTotalDays(period: BudgetPeriod): number {
  const diffMs = period.end.getTime() - period.start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * formatExpenseDate(isoDate: string, createdAt: string): string
 *
 * Formats the display string for an expense row: "DD/MM HH:mm"
 * Uses isoDate (YYYY-MM-DD) for the day/month part and
 * createdAt (full ISO timestamp) for the time part.
 *
 * Examples:
 *   formatExpenseDate("2026-06-15", "2026-06-15T14:32:00.000Z") → "15/06 14:32"
 *   (time is shown in LOCAL device time zone, matching user expectation)
 */
export function formatExpenseDate(isoDate: string, createdAt: string): string {
  const [, month, day] = isoDate.split('-');

  const ts = new Date(createdAt);
  const hours   = String(ts.getHours()).padStart(2, '0');
  const minutes = String(ts.getMinutes()).padStart(2, '0');

  return `${day}/${month} ${hours}:${minutes}`;
}

/**
 * formatDisplayDate(isoDate: string): string
 *
 * Formats a YYYY-MM-DD date string into DD/MM display format.
 *
 * Example:
 *   formatDisplayDate("2026-06-16") → "16/06"
 */
export function formatDisplayDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

/**
 * formatDisplayTime(isoTimestamp: string): string
 *
 * Formats a full ISO timestamp into HH:mm in local device time.
 *
 * Example:
 *   formatDisplayTime("2026-06-15T14:32:00.000Z") → "14:32"
 */
export function formatDisplayTime(isoTimestamp: string): string {
  const ts = new Date(isoTimestamp);
  const hours   = String(ts.getHours()).padStart(2, '0');
  const minutes = String(ts.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * formatDateForDisplay(date: Date): string
 *
 * Formats a Date object as DD/MM/YYYY for display in the AddExpenseScreen date field.
 *
 * Example:
 *   formatDateForDisplay(new Date(2026, 5, 16)) → "16/06/2026"
 */
export function formatDateForDisplay(date: Date): string {
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year  = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * dateToYMD(date: Date): string
 *
 * Converts a Date to YYYY-MM-DD in LOCAL time for saving as expense.date.
 *
 * Example:
 *   dateToYMD(new Date(2026, 5, 16)) → "2026-06-16"
 */
export function dateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
