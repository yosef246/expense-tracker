/**
 * Core data types for the expense tracker app.
 * All data is stored locally in AsyncStorage — no server or network involved.
 */

/**
 * A single expense record.
 * - id:          UUID v4 string, generated at creation time.
 * - amount:      Positive float. Stored as raw number (e.g. 8.9, 200).
 * - description: Free text, 0–200 chars. May be empty string "".
 * - date:        YYYY-MM-DD string representing the user-chosen expense date.
 * - createdAt:   Full ISO 8601 timestamp of when the record was saved (used for sort order).
 */
export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;       // YYYY-MM-DD
  createdAt: string;  // ISO timestamp e.g. "2026-06-15T14:32:00.000Z"
}

/**
 * App-wide settings stored in AsyncStorage.
 * - monthlyBudget:  Positive integer (ILS). Default: 2000.
 * - monthStartDay:  Either 1 (budget resets on 1st of month) or 15 (resets on 15th). Default: 1.
 */
export interface Settings {
  monthlyBudget: number;
  monthStartDay: 1 | 15;
}

/**
 * Represents a resolved budget period with start/end Date objects and a display label.
 * - start: Inclusive — midnight local time of period start day.
 * - end:   Exclusive — midnight local time of the NEXT period's start day.
 * - label: Hebrew month + year string, e.g. "יוני 2026".
 *
 * Expense filtering: include expense if expense.date >= toDateString(start) && expense.date < toDateString(end).
 * Lexicographic comparison of YYYY-MM-DD strings is safe.
 */
export interface BudgetPeriod {
  start: Date;
  end: Date;
  label: string;
}
