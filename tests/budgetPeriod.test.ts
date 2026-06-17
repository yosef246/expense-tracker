/**
 * budgetPeriod.test.ts
 *
 * Plain TypeScript tests for getBudgetPeriod and toYMD.
 * No test framework — each test is a function that throws on failure.
 * Run with: npx ts-node budgetPeriod.test.ts
 * Or via: npm test (after package.json is in this directory)
 *
 * Spec reference: API_CONTRACT.md §3.2 and §3.3
 *
 * Logic under test:
 *   monthStartDay === 1:
 *     start = 1st of current calendar month (local midnight)
 *     end   = 1st of next calendar month (local midnight)
 *     label = Hebrew month name + year of referenceDate's month
 *
 *   monthStartDay === 15:
 *     referenceDate.date >= 15:
 *       start = 15th this month, end = 15th next month
 *       label = start's month name + year
 *     referenceDate.date < 15:
 *       start = 15th previous month, end = 15th this month
 *       label = start's month name + year (previous month)
 *
 * Boundary cases:
 *   - today = exactly 14 (just before 15th period flips)
 *   - today = exactly 15 (first day of new period)
 *   - today = exactly 1  (monthStartDay=1, first day of month)
 *   - year/month overflow: Dec → Jan, Jan → Dec
 */

// ── Inline copies of the functions under test ─────────────────────────────────
// Cannot import React Native modules in plain Node; replicate pure functions
// exactly as in:
//   frontend/src/utils/getBudgetPeriod.ts  (lines 45-95)
//   frontend/src/utils/dateHelpers.ts      (lines 15-28 — HEBREW_MONTH_NAMES)

const HEBREW_MONTH_NAMES: readonly string[] = [
  'ינואר',   // 0
  'פברואר',  // 1
  'מרץ',     // 2
  'אפריל',   // 3
  'מאי',     // 4
  'יוני',    // 5
  'יולי',    // 6
  'אוגוסט',  // 7
  'ספטמבר',  // 8
  'אוקטובר', // 9
  'נובמבר',  // 10
  'דצמבר',   // 11
];

interface BudgetPeriod {
  start: Date;
  end: Date;
  label: string;
}

function localMidnight(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 0, 0, 0, 0);
}

function getBudgetPeriod(
  monthStartDay: 1 | 15,
  referenceDate: Date = new Date()
): BudgetPeriod {
  const year  = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day   = referenceDate.getDate();

  if (monthStartDay === 1) {
    const start = localMidnight(year, month, 1);
    const end   = localMidnight(year, month + 1, 1);
    const label = `${HEBREW_MONTH_NAMES[month]} ${year}`;
    return { start, end, label };
  }

  // monthStartDay === 15
  if (day >= 15) {
    const start = localMidnight(year, month, 15);
    const end   = localMidnight(year, month + 1, 15);
    const label = `${HEBREW_MONTH_NAMES[month]} ${year}`;
    return { start, end, label };
  } else {
    const start = localMidnight(year, month - 1, 15);
    const end   = localMidnight(year, month, 15);
    const startMonth = start.getMonth();
    const startYear  = start.getFullYear();
    const label = `${HEBREW_MONTH_NAMES[startMonth]} ${startYear}`;
    return { start, end, label };
  }
}

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Test infrastructure ────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assertEqual(label: string, actual: unknown, expected: unknown): void {
  const a = String(actual);
  const e = String(expected);
  if (a === e) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    const msg = `  FAIL  ${label}\n         expected: ${JSON.stringify(e)}\n         actual:   ${JSON.stringify(a)}`;
    console.error(msg);
    failures.push(msg);
    failed++;
  }
}

function assertPeriod(
  label: string,
  period: BudgetPeriod,
  expectedStart: string,
  expectedEnd: string,
  expectedLabel: string
): void {
  assertEqual(`${label} — start`, toYMD(period.start), expectedStart);
  assertEqual(`${label} — end`,   toYMD(period.end),   expectedEnd);
  assertEqual(`${label} — label`, period.label,         expectedLabel);
}

// ── Test suite ─────────────────────────────────────────────────────────────────

console.log('\n=== getBudgetPeriod tests ===\n');

// ── monthStartDay === 1 ───────────────────────────────────────────────────────
console.log('-- monthStartDay = 1 --');

// Spec example: 2026-06-16 → Jun 1..Jul 1
assertPeriod(
  'day=1, 2026-06-16',
  getBudgetPeriod(1, new Date(2026, 5, 16)),
  '2026-06-01',
  '2026-07-01',
  'יוני 2026'
);

// First day of month — inclusive start boundary
assertPeriod(
  'day=1, 2026-06-01 (first day, inclusive)',
  getBudgetPeriod(1, new Date(2026, 5, 1)),
  '2026-06-01',
  '2026-07-01',
  'יוני 2026'
);

// Last day of month (June 30)
assertPeriod(
  'day=1, 2026-06-30 (last day)',
  getBudgetPeriod(1, new Date(2026, 5, 30)),
  '2026-06-01',
  '2026-07-01',
  'יוני 2026'
);

// Year overflow: December → January
assertPeriod(
  'day=1, 2026-12-15 (December, year overflow)',
  getBudgetPeriod(1, new Date(2026, 11, 15)),
  '2026-12-01',
  '2027-01-01',
  'דצמבר 2026'
);

// January (start of year)
assertPeriod(
  'day=1, 2026-01-01 (January)',
  getBudgetPeriod(1, new Date(2026, 0, 1)),
  '2026-01-01',
  '2026-02-01',
  'ינואר 2026'
);

// February in a leap year
assertPeriod(
  'day=1, 2024-02-29 (leap day)',
  getBudgetPeriod(1, new Date(2024, 1, 29)),
  '2024-02-01',
  '2024-03-01',
  'פברואר 2024'
);

// ── monthStartDay === 15 ──────────────────────────────────────────────────────
console.log('\n-- monthStartDay = 15 --');

// Spec example: 2026-06-16 (>= 15) → Jun15..Jul15
assertPeriod(
  'day=15, 2026-06-16 (after 15th)',
  getBudgetPeriod(15, new Date(2026, 5, 16)),
  '2026-06-15',
  '2026-07-15',
  'יוני 2026'
);

// Spec example: 2026-06-10 (< 15) → May15..Jun15
assertPeriod(
  'day=15, 2026-06-10 (before 15th)',
  getBudgetPeriod(15, new Date(2026, 5, 10)),
  '2026-05-15',
  '2026-06-15',
  'מאי 2026'
);

// CRITICAL BOUNDARY: exactly day 14 (< 15 branch)
assertPeriod(
  'day=15, 2026-06-14 (day=14, must use previous period)',
  getBudgetPeriod(15, new Date(2026, 5, 14)),
  '2026-05-15',
  '2026-06-15',
  'מאי 2026'
);

// CRITICAL BOUNDARY: exactly day 15 (>= 15 branch, first day of new period)
assertPeriod(
  'day=15, 2026-06-15 (day=15, first day of new period)',
  getBudgetPeriod(15, new Date(2026, 5, 15)),
  '2026-06-15',
  '2026-07-15',
  'יוני 2026'
);

// CRITICAL BOUNDARY: day 1 (well before 15, uses previous month's 15th)
assertPeriod(
  'day=15, 2026-06-01 (day=1, uses previous month)',
  getBudgetPeriod(15, new Date(2026, 5, 1)),
  '2026-05-15',
  '2026-06-15',
  'מאי 2026'
);

// Year-crossing: January 10 → period spans Dec15..Jan15
// referenceDate.month = 0 (January), day < 15
// start = localMidnight(2026, -1, 15) — month -1 → Dec 2025
assertPeriod(
  'day=15, 2026-01-10 (crosses year boundary into Dec 2025)',
  getBudgetPeriod(15, new Date(2026, 0, 10)),
  '2025-12-15',
  '2026-01-15',
  'דצמבר 2025'
);

// Year-crossing (forward): December 20 → period Dec15..Jan15-next-year
assertPeriod(
  'day=15, 2026-12-20 (crosses year boundary forward)',
  getBudgetPeriod(15, new Date(2026, 11, 20)),
  '2026-12-15',
  '2027-01-15',
  'דצמבר 2026'
);

// ── toYMD tests ───────────────────────────────────────────────────────────────
console.log('\n-- toYMD --');
assertEqual('toYMD(new Date(2026,5,16)) → "2026-06-16"',
  toYMD(new Date(2026, 5, 16)), '2026-06-16');
assertEqual('toYMD(new Date(2026,0,1)) → "2026-01-01"',
  toYMD(new Date(2026, 0, 1)), '2026-01-01');
assertEqual('toYMD(new Date(2026,11,31)) → "2026-12-31"',
  toYMD(new Date(2026, 11, 31)), '2026-12-31');

// ── Expense filtering invariant probe ─────────────────────────────────────────
// Verifies that the boundary condition "date >= startStr && date < endStr"
// correctly includes the first day and excludes the end day.
console.log('\n-- Expense filtering boundary probe (day=1) --');
{
  const period = getBudgetPeriod(1, new Date(2026, 5, 16)); // Jun 2026
  const startStr = toYMD(period.start); // "2026-06-01"
  const endStr   = toYMD(period.end);   // "2026-07-01"

  // Expense on the very first day of the period — must be included
  const firstDayDate = '2026-06-01';
  const inPeriod1 = firstDayDate >= startStr && firstDayDate < endStr;
  assertEqual('expense on 2026-06-01 is IN Jun period', String(inPeriod1), 'true');

  // Expense on 2026-07-01 (= end) — must NOT be included (exclusive end)
  const endDayDate = '2026-07-01';
  const inPeriod2 = endDayDate >= startStr && endDayDate < endStr;
  assertEqual('expense on 2026-07-01 is NOT in Jun period (exclusive end)', String(inPeriod2), 'false');

  // Expense on last day of June — must be included
  const lastDayDate = '2026-06-30';
  const inPeriod3 = lastDayDate >= startStr && lastDayDate < endStr;
  assertEqual('expense on 2026-06-30 is IN Jun period', String(inPeriod3), 'true');
}

console.log('\n-- Expense filtering boundary probe (day=15) --');
{
  // Period: May 15 .. Jun 15 (referenceDate = Jun 10)
  const period = getBudgetPeriod(15, new Date(2026, 5, 10));
  const startStr = toYMD(period.start); // "2026-05-15"
  const endStr   = toYMD(period.end);   // "2026-06-15"

  // May 15 — included (inclusive start)
  const may15 = '2026-05-15';
  assertEqual('expense on 2026-05-15 is IN period (inclusive start)',
    String(may15 >= startStr && may15 < endStr), 'true');

  // June 14 — included (last day before exclusive end)
  const jun14 = '2026-06-14';
  assertEqual('expense on 2026-06-14 is IN period',
    String(jun14 >= startStr && jun14 < endStr), 'true');

  // June 15 — NOT included (exclusive end boundary)
  const jun15 = '2026-06-15';
  assertEqual('expense on 2026-06-15 is NOT in period (exclusive end)',
    String(jun15 >= startStr && jun15 < endStr), 'false');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
  console.error('Failed tests:');
  failures.forEach((f) => console.error(f));
  process.exit(1);
} else {
  process.exit(0);
}
