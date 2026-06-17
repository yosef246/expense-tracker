/**
 * getBudgetPeriod(monthStartDay, referenceDate): BudgetPeriod
 *
 * Computes the budget period (start/end dates + display label) that contains referenceDate,
 * based on the user's configured monthStartDay setting.
 *
 * Returned BudgetPeriod:
 *   - start: Date at midnight local time of the period's first day (inclusive)
 *   - end:   Date at midnight local time of the NEXT period's first day (exclusive)
 *   - label: Hebrew month name + year, e.g. "יוני 2026"
 *
 * Logic for monthStartDay === 1:
 *   - start = 1st of the calendar month containing referenceDate at 00:00:00 local
 *   - end   = 1st of the next calendar month at 00:00:00 local
 *   - label = Hebrew name of referenceDate's month + year
 *
 * Logic for monthStartDay === 15:
 *   - If referenceDate.getDate() >= 15:
 *       start = 15th of referenceDate's calendar month
 *       end   = 15th of referenceDate's next calendar month
 *   - If referenceDate.getDate() < 15:
 *       start = 15th of referenceDate's previous calendar month
 *       end   = 15th of referenceDate's calendar month
 *   - label = Hebrew name of the START date's month + year
 *
 * Expense filtering invariant:
 *   An expense with date string D belongs to this period when:
 *     toYMD(start) <= D < toYMD(end)
 *   Use lexicographic string comparison on YYYY-MM-DD — it is safe and avoids timezone issues.
 *
 * Examples (referenceDate = 2026-06-16, monthStartDay = 1):
 *   start = 2026-06-01, end = 2026-07-01, label = "יוני 2026"
 *
 * Examples (referenceDate = 2026-06-16, monthStartDay = 15):
 *   start = 2026-06-15, end = 2026-07-15, label = "יוני 2026"
 *
 * Examples (referenceDate = 2026-06-10, monthStartDay = 15):
 *   start = 2026-05-15, end = 2026-06-15, label = "מאי 2026"
 */

import { BudgetPeriod } from '../types';
import { HEBREW_MONTH_NAMES } from './dateHelpers';

/** Returns a new Date set to midnight local time for the given year/month/day. */
function localMidnight(year: number, month: number, day: number): Date {
  const d = new Date(year, month, day, 0, 0, 0, 0);
  return d;
}

export function getBudgetPeriod(
  monthStartDay: 1 | 15,
  referenceDate: Date = new Date()
): BudgetPeriod {
  const year  = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-indexed
  const day   = referenceDate.getDate();

  if (monthStartDay === 1) {
    // Period: 1st of current month → 1st of next month
    const start = localMidnight(year, month, 1);
    const end   = localMidnight(year, month + 1, 1); // Date handles month overflow
    const label = `${HEBREW_MONTH_NAMES[month]} ${year}`;
    return { start, end, label };
  }

  // monthStartDay === 15
  if (day >= 15) {
    // Period: 15th of this month → 15th of next month
    const start = localMidnight(year, month, 15);
    const end   = localMidnight(year, month + 1, 15);
    const label = `${HEBREW_MONTH_NAMES[month]} ${year}`;
    return { start, end, label };
  } else {
    // Period: 15th of previous month → 15th of this month
    const start = localMidnight(year, month - 1, 15); // Date handles month underflow
    const end   = localMidnight(year, month, 15);
    // Label uses the start date's month
    const startMonth = start.getMonth();
    const startYear  = start.getFullYear();
    const label = `${HEBREW_MONTH_NAMES[startMonth]} ${startYear}`;
    return { start, end, label };
  }
}

/**
 * toYMD(date): string
 * Converts a Date to a YYYY-MM-DD string in LOCAL time (not UTC).
 * Used for safe lexicographic comparison with expense.date strings.
 */
export function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
