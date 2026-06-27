import { getBudgetPeriod, toYMD } from '../frontend/src/utils/getBudgetPeriod';

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
  period: { start: Date; end: Date; label: string },
  expectedStart: string,
  expectedEnd: string,
  expectedLabel: string
): void {
  assertEqual(`${label} — start`, toYMD(period.start), expectedStart);
  assertEqual(`${label} — end`,   toYMD(period.end),   expectedEnd);
  assertEqual(`${label} — label`, period.label,         expectedLabel);
}

console.log('\n=== getBudgetPeriod tests (production function) ===\n');

console.log('-- monthStartDay = 10 --');

assertPeriod(
  'day=10, 2026-06-15 (date >= 10, period starts June 10)',
  getBudgetPeriod(10, new Date(2026, 5, 15)),
  '2026-06-10',
  '2026-07-10',
  'יוני 2026'
);

assertPeriod(
  'day=10, 2026-06-05 (date < 10, period starts May 10)',
  getBudgetPeriod(10, new Date(2026, 5, 5)),
  '2026-05-10',
  '2026-06-10',
  'מאי 2026'
);

assertPeriod(
  'day=10, 2026-12-15 (date >= 10, period crosses into next year)',
  getBudgetPeriod(10, new Date(2026, 11, 15)),
  '2026-12-10',
  '2027-01-10',
  'דצמבר 2026'
);

assertPeriod(
  'day=10, 2026-01-05 (date < 10, period crosses back into prev year)',
  getBudgetPeriod(10, new Date(2026, 0, 5)),
  '2025-12-10',
  '2026-01-10',
  'דצמבר 2025'
);

console.log('\n-- monthStartDay = 1 --');

assertPeriod(
  'day=1, 2026-06-15 (mid-month, period is full June)',
  getBudgetPeriod(1, new Date(2026, 5, 15)),
  '2026-06-01',
  '2026-07-01',
  'יוני 2026'
);

assertPeriod(
  'day=1, 2026-01-15 (January, period is full January)',
  getBudgetPeriod(1, new Date(2026, 0, 15)),
  '2026-01-01',
  '2026-02-01',
  'ינואר 2026'
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
  console.error('Failed tests:');
  failures.forEach((f) => console.error(f));
  process.exit(1);
} else {
  process.exit(0);
}
