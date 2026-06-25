import { BudgetPeriod } from '../types';
import { HEBREW_MONTH_NAMES, dateToYMD } from './dateHelpers';

export { dateToYMD as toYMD };

function localMidnight(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 0, 0, 0, 0);
}

export function getBudgetPeriod(
  monthStartDay: 1 | 10,
  referenceDate: Date = new Date()
): BudgetPeriod {
  const year  = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day   = referenceDate.getDate();

  if (monthStartDay === 1) {
    const start = localMidnight(year, month, 1);
    const end   = localMidnight(year, month + 1, 1);
    return { start, end, label: `${HEBREW_MONTH_NAMES[month]} ${year}` };
  }

  if (day >= 10) {
    const start = localMidnight(year, month, 10);
    const end   = localMidnight(year, month + 1, 10);
    return { start, end, label: `${HEBREW_MONTH_NAMES[month]} ${year}` };
  } else {
    const start = localMidnight(year, month - 1, 10);
    const end   = localMidnight(year, month, 10);
    return { start, end, label: `${HEBREW_MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}` };
  }
}
