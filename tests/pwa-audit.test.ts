/**
 * pwa-audit.test.ts
 *
 * QA audit tests for the expense-tracker PWA.
 * Covers: getProgressColor thresholds, formatCurrency edge cases,
 *         expenseStorage CRUD, useYearlyReset first-launch-on-Jan-1 bug,
 *         MONTH_START_OPTIONS type inconsistency, and duplicate YMD helpers.
 *
 * Run with: npx ts-node pwa-audit.test.ts
 * Or via: npm test (runs all test files in this directory)
 *
 * No external test framework — plain Node + ts-node.
 * Exit 0 = all pass. Exit 1 = failures (details printed to stderr).
 */

// ---------------------------------------------------------------------------
// 1. Test infrastructure
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    const msg = detail
      ? `  FAIL  ${label}\n         ${detail}`
      : `  FAIL  ${label}`;
    console.error(msg);
    failures.push(msg);
    failed++;
  }
}

function assertEqual(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  assert(label, a === e, `expected ${e}, got ${a}`);
}

// ---------------------------------------------------------------------------
// 2. Inline copies of production functions under test
//    (Cannot import React/browser modules in plain Node; pure functions only)
// ---------------------------------------------------------------------------

// --- getProgressColor (frontend/src/utils/getProgressColor.ts) ---
function getProgressColor_production(percentage: number): string {
  // THIS IS THE CURRENT BUGGY PRODUCTION CODE (BUG-003: uses 80, not 90)
  if (percentage < 50) return '#10b981';
  if (percentage < 80) return '#f59e0b';
  return '#ef4444';
}

function getProgressColor_correct(percentage: number): string {
  // What the code SHOULD do per JSDoc and colors.ts
  if (percentage < 50) return '#10b981';
  if (percentage < 90) return '#f59e0b';
  return '#ef4444';
}

// --- formatCurrency (frontend/src/utils/formatCurrency.ts) ---
// Inline the logic without the LRM strip to expose BUG from original code
function formatCurrency_production(amount: number): string {
  // NOTE: Original file does strip LRM via regex. We replicate the full function.
  if (!isFinite(amount) || isNaN(amount)) return '0 ₪';
  const isWhole = amount % 1 === 0;
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(amount);
  // Strip LRM (U+200E) as production code does
  return `${formatted.replace(/‎/g, '')} ₪`;
}

// --- expenseStorage (frontend/src/storage/expenseStorage.ts) ---
// Simulate with in-memory store instead of real localStorage
interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  category: string;
}

function makeStore(): { data: string | null } {
  return { data: null };
}

function storageLoad(store: { data: string | null }): Expense[] {
  try {
    const raw: Omit<Expense, 'category'>[] = JSON.parse(store.data || '[]');
    if (!Array.isArray(raw)) return []; // TS-001 guard
    return raw.map(e => ({ category: 'other', ...e })) as Expense[];
  } catch {
    return [];
  }
}

function storageSave(store: { data: string | null }, expenses: Expense[]): void {
  store.data = JSON.stringify(expenses);
}

function storageAdd(store: { data: string | null }, expense: Expense): Expense[] {
  const all = storageLoad(store);
  const updated = [...all, expense].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  storageSave(store, updated);
  return updated;
}

function storageDelete(store: { data: string | null }, id: string): Expense[] {
  const updated = storageLoad(store).filter(e => e.id !== id);
  storageSave(store, updated);
  return updated;
}

function storageEdit(
  store: { data: string | null },
  id: string,
  changes: Partial<Pick<Expense, 'amount' | 'description' | 'date' | 'category'>>
): Expense[] {
  const updated = storageLoad(store).map(e =>
    e.id === id ? { ...e, ...changes } : e
  );
  storageSave(store, updated);
  return updated;
}

// --- dateToYMD helpers (frontend/src/utils/dateHelpers.ts and getBudgetPeriod.ts) ---
function dateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// toYMD from getBudgetPeriod.ts — identical implementation
function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// --- useYearlyReset logic (frontend/src/hooks/useYearlyReset.ts) ---
// Simulate the reset logic with an in-memory key-value store
type KVStore = { [key: string]: string };

function simulateYearlyReset(
  store: KVStore,
  expenseStore: { data: string | null },
  today: Date
): { wasRecentlyReset: boolean; showEndOfYearWarning: boolean } {
  const currentYear = today.getFullYear();
  const month       = today.getMonth();
  const day         = today.getDate();

  const KEY = 'lastResetYear';

  // Replicate production logic exactly
  const stored = store[KEY] ?? null;
  let wasRecentlyReset = false;

  if (stored === null) {
    // BUG-002: this branch does NOT call saveExpenses([])
    store[KEY] = String(currentYear);
    wasRecentlyReset = false;
  } else {
    const lastYear = parseInt(stored, 10);
    if (currentYear > lastYear) {
      storageSave(expenseStore, []); // clears expenses
      store[KEY] = String(currentYear);
      wasRecentlyReset = true;
    }
  }

  const showEndOfYearWarning = month === 11 && day >= 20;
  return { wasRecentlyReset, showEndOfYearWarning };
}

// Fixed version of the reset logic (BUG-002 fix applied)
function simulateYearlyReset_fixed(
  store: KVStore,
  expenseStore: { data: string | null },
  today: Date
): { wasRecentlyReset: boolean; showEndOfYearWarning: boolean } {
  const currentYear = today.getFullYear();
  const month       = today.getMonth();
  const day         = today.getDate();
  const KEY = 'lastResetYear';

  // Fix: treat null as "never reset before" = reset from previous year
  const stored    = store[KEY] ?? null;
  const lastYear  = stored === null ? currentYear - 1 : parseInt(stored, 10);

  let wasRecentlyReset = false;
  if (currentYear > lastYear) {
    storageSave(expenseStore, []);
    store[KEY] = String(currentYear);
    wasRecentlyReset = stored !== null; // true only for returning users
  } else if (stored === null) {
    store[KEY] = String(currentYear);
  }

  const showEndOfYearWarning = month === 11 && day >= 20;
  return { wasRecentlyReset, showEndOfYearWarning };
}

// ---------------------------------------------------------------------------
// 3. Test suites
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 3A. getProgressColor — threshold boundary tests (exposes BUG-003)
// ---------------------------------------------------------------------------
console.log('\n=== getProgressColor threshold tests ===\n');

// Green zone (both implementations agree)
assertEqual('0% → green',   getProgressColor_production(0),   '#10b981');
assertEqual('49% → green',  getProgressColor_production(49),  '#10b981');

// Yellow zone — production uses wrong threshold of 80
assertEqual('50% → yellow (production)', getProgressColor_production(50),  '#f59e0b');

// BUG-003: These two assertions test the incorrect production threshold.
// At 80% the production code returns RED, but the spec says YELLOW (< 90).
// The first test INTENTIONALLY documents the current (wrong) behaviour.
// The second test shows what it SHOULD be.
{
  const at80 = getProgressColor_production(80);
  assert(
    'BUG-003 DOCUMENTED: 80% production returns red (wrong — should be yellow)',
    at80 === '#ef4444',
    `production getProgressColor(80) = ${at80}, expected red (#ef4444) to confirm the bug`
  );

  const at80Correct = getProgressColor_correct(80);
  assert(
    'BUG-003 CORRECT: 80% spec-correct implementation returns yellow',
    at80Correct === '#f59e0b',
    `correct getProgressColor(80) = ${at80Correct}`
  );
}

// Threshold 89% — production returns red (wrong), correct returns yellow
{
  const at89 = getProgressColor_production(89);
  assert(
    'BUG-003 DOCUMENTED: 89% production returns red (wrong — should be yellow)',
    at89 === '#ef4444',
    `production getProgressColor(89) = ${at89}`
  );

  const at89Correct = getProgressColor_correct(89);
  assert(
    'BUG-003 CORRECT: 89% spec-correct returns yellow',
    at89Correct === '#f59e0b',
    `correct getProgressColor(89) = ${at89Correct}`
  );
}

// Red zone (both implementations agree for >= 90)
assertEqual('90% → red (production)',  getProgressColor_production(90),  '#ef4444');
assertEqual('90% → red (correct)',     getProgressColor_correct(90),     '#ef4444');
assertEqual('100% → red (production)', getProgressColor_production(100), '#ef4444');
assertEqual('150% → red (production)', getProgressColor_production(150), '#ef4444');

// ---------------------------------------------------------------------------
// 3B. formatCurrency — edge cases
// ---------------------------------------------------------------------------
console.log('\n=== formatCurrency edge cases ===\n');

// Guard against NaN (BUG-010 was fixed in this version — NaN guard exists)
assertEqual('formatCurrency(NaN) → "0 ₪"',       formatCurrency_production(NaN),      '0 ₪');
assertEqual('formatCurrency(Infinity) → "0 ₪"',   formatCurrency_production(Infinity),  '0 ₪');
assertEqual('formatCurrency(-Infinity) → "0 ₪"',  formatCurrency_production(-Infinity), '0 ₪');

// Normal values — check no LRM is present in output
{
  const neg50 = formatCurrency_production(-50);
  // The string must start with a plain hyphen (0x2D), not U+200E
  const firstChar = neg50.charCodeAt(0);
  assert(
    'formatCurrency(-50) first character is hyphen (0x2D), no LRM prefix',
    firstChar === 0x2D || neg50.startsWith('-'),
    `first char code is 0x${firstChar.toString(16)}, full string: ${JSON.stringify(neg50)}`
  );
  assert(
    'formatCurrency(-50) does not contain U+200E (LRM)',
    !neg50.includes('‎'),
    `string contains LRM: ${JSON.stringify(neg50)}`
  );
}

assertEqual('formatCurrency(0) → "0 ₪"',          formatCurrency_production(0),        '0 ₪');
assertEqual('formatCurrency(200) → "200 ₪"',       formatCurrency_production(200),      '200 ₪');
assertEqual('formatCurrency(8.9) → "8.90 ₪"',      formatCurrency_production(8.9),      '8.90 ₪');

// ---------------------------------------------------------------------------
// 3C. expenseStorage CRUD — happy path
// ---------------------------------------------------------------------------
console.log('\n=== expenseStorage CRUD tests ===\n');

{
  const store = makeStore();

  // Initial load on empty store
  const empty = storageLoad(store);
  assertEqual('loadExpenses on empty store → []', empty, []);

  // Add first expense
  const e1: Expense = {
    id: 'e1',
    amount: 100,
    description: 'coffee',
    date: '2026-06-20',
    createdAt: '2026-06-20T10:00:00.000Z',
    category: 'food',
  };
  const after1 = storageAdd(store, e1);
  assertEqual('after addExpense: list has 1 item', after1.length, 1);
  assertEqual('added expense has correct amount', after1[0].amount, 100);

  // Add second expense (newer createdAt → sorts first)
  const e2: Expense = {
    id: 'e2',
    amount: 250,
    description: 'lunch',
    date: '2026-06-20',
    createdAt: '2026-06-20T12:00:00.000Z',
    category: 'food',
  };
  const after2 = storageAdd(store, e2);
  assertEqual('after second addExpense: list has 2 items', after2.length, 2);
  assertEqual('newer item (e2) sorts first', after2[0].id, 'e2');
  assertEqual('older item (e1) sorts second', after2[1].id, 'e1');

  // Delete first expense (e2)
  const afterDel = storageDelete(store, 'e2');
  assertEqual('after deleteExpense: list has 1 item', afterDel.length, 1);
  assertEqual('remaining item is e1', afterDel[0].id, 'e1');

  // Verify deletion persisted
  const reloaded = storageLoad(store);
  assertEqual('reload after delete: 1 item', reloaded.length, 1);

  // Edit the remaining expense
  const afterEdit = storageEdit(store, 'e1', { amount: 150, description: 'updated coffee' });
  assertEqual('editExpense: amount updated', afterEdit[0].amount, 150);
  assertEqual('editExpense: description updated', afterEdit[0].description, 'updated coffee');
  assertEqual('editExpense: category unchanged', afterEdit[0].category, 'food');

  // Delete non-existent id — list unchanged
  const afterBadDel = storageDelete(store, 'does-not-exist');
  assertEqual('delete non-existent id: list unchanged', afterBadDel.length, 1);
}

// ---------------------------------------------------------------------------
// 3D. expenseStorage — corrupted data returns empty array (TS-001 guard)
// ---------------------------------------------------------------------------
console.log('\n=== expenseStorage corrupted data ===\n');

{
  const store = makeStore();

  // Non-JSON string
  store.data = 'CORRUPTED';
  assertEqual('corrupted JSON → []', storageLoad(store), []);

  // Valid JSON but not an array
  store.data = '{"foo":"bar"}';
  assertEqual('object JSON (not array) → []', storageLoad(store), []);

  // null literal
  store.data = 'null';
  // JSON.parse('null') = null, !Array.isArray(null) → returns []
  assertEqual('JSON null → []', storageLoad(store), []);

  // Array with old items lacking category — migration applies default
  store.data = JSON.stringify([
    { id: 'x1', amount: 50, description: 'old item', date: '2025-12-01', createdAt: '2025-12-01T00:00:00.000Z' }
  ]);
  const migrated = storageLoad(store);
  assertEqual('old item without category gets default "other"', migrated[0].category, 'other');
}

// ---------------------------------------------------------------------------
// 3E. useYearlyReset — first-launch-on-Jan-1 bug (BUG-002)
// ---------------------------------------------------------------------------
console.log('\n=== useYearlyReset first-launch-on-Jan-1 bug (BUG-002) ===\n');

{
  // Scenario: user has existing expenses, lastResetYear is ABSENT (storage cleared),
  // and today is January 1 (new year's day). Expenses should be cleared.

  const kvStore: KVStore = {};                // no lastResetYear key
  const expenseStore = makeStore();

  // Pre-populate expenses
  const existingExpense: Expense = {
    id: 'old1', amount: 500, description: 'last year expense',
    date: '2026-12-25', createdAt: '2026-12-25T12:00:00.000Z', category: 'other',
  };
  storageSave(expenseStore, [existingExpense]);
  assertEqual('pre-condition: expense exists before reset', storageLoad(expenseStore).length, 1);

  // Simulate opening app on January 1, 2027 with no lastResetYear stored
  const jan1_2027 = new Date(2027, 0, 1); // January 1, 2027
  const buggy = simulateYearlyReset(kvStore, expenseStore, jan1_2027);

  // BUG-002: with production (buggy) code, expenses are NOT cleared because
  // the null branch sets the year but never calls saveExpenses([]).
  assert(
    'BUG-002 DOCUMENTED: production code on first-launch-Jan-1 does NOT clear expenses (bug)',
    storageLoad(expenseStore).length === 1,
    `expense count = ${storageLoad(expenseStore).length}, expected 1 (bug: expenses not cleared)`
  );
  assert(
    'BUG-002 DOCUMENTED: wasRecentlyReset is false on first launch (correct — no banner)',
    !buggy.wasRecentlyReset,
    'wasRecentlyReset should be false on first launch'
  );

  // Now test the fixed version
  const kvStore2: KVStore = {};
  const expenseStore2 = makeStore();
  storageSave(expenseStore2, [existingExpense]);

  simulateYearlyReset_fixed(kvStore2, expenseStore2, jan1_2027);

  assertEqual(
    'BUG-002 FIXED: first-launch-Jan-1 clears expenses',
    storageLoad(expenseStore2).length,
    0
  );
  assertEqual(
    'BUG-002 FIXED: lastResetYear written to 2027',
    kvStore2['lastResetYear'],
    '2027'
  );
}

// Normal returning user: expenses should be cleared on new year
{
  const kvStore: KVStore = { lastResetYear: '2026' };
  const expenseStore = makeStore();
  const oldExpense: Expense = {
    id: 'old2', amount: 200, description: 'dec expense',
    date: '2026-12-30', createdAt: '2026-12-30T10:00:00.000Z', category: 'other',
  };
  storageSave(expenseStore, [oldExpense]);

  const jan1 = new Date(2027, 0, 1);
  const result = simulateYearlyReset(kvStore, expenseStore, jan1);

  assertEqual('returning user: wasRecentlyReset is true', result.wasRecentlyReset, true);
  assertEqual('returning user: expenses cleared', storageLoad(expenseStore).length, 0);
  assertEqual('returning user: lastResetYear updated to 2027', kvStore['lastResetYear'], '2027');
}

// Idempotent: opening app twice on Jan 1 does not re-reset
{
  const kvStore: KVStore = { lastResetYear: '2027' };
  const expenseStore = makeStore();
  const newExpense: Expense = {
    id: 'new1', amount: 30, description: 'jan expense',
    date: '2027-01-01', createdAt: '2027-01-01T09:00:00.000Z', category: 'food',
  };
  storageSave(expenseStore, [newExpense]);

  const jan1Again = new Date(2027, 0, 1);
  const result2 = simulateYearlyReset(kvStore, expenseStore, jan1Again);

  assertEqual('second open same year: wasRecentlyReset is false', result2.wasRecentlyReset, false);
  assertEqual('second open same year: expenses untouched', storageLoad(expenseStore).length, 1);
}

// ---------------------------------------------------------------------------
// 3F. End-of-year warning boundary
// ---------------------------------------------------------------------------
console.log('\n=== end-of-year warning boundary tests ===\n');

{
  // Dec 19 — no warning
  const dec19 = new Date(2026, 11, 19);
  const { showEndOfYearWarning: noWarn } = simulateYearlyReset(
    { lastResetYear: '2026' }, makeStore(), dec19
  );
  assertEqual('Dec 19: no end-of-year warning', noWarn, false);

  // Dec 20 — warning shows
  const dec20 = new Date(2026, 11, 20);
  const { showEndOfYearWarning: warnStart } = simulateYearlyReset(
    { lastResetYear: '2026' }, makeStore(), dec20
  );
  assertEqual('Dec 20: end-of-year warning shown', warnStart, true);

  // Dec 31 — warning shows
  const dec31 = new Date(2026, 11, 31);
  const { showEndOfYearWarning: warnEnd } = simulateYearlyReset(
    { lastResetYear: '2026' }, makeStore(), dec31
  );
  assertEqual('Dec 31: end-of-year warning shown', warnEnd, true);

  // Jan 1 — no warning (it is now the new year)
  const jan1 = new Date(2027, 0, 1);
  const { showEndOfYearWarning: noWarnJan } = simulateYearlyReset(
    { lastResetYear: '2026' }, makeStore(), jan1
  );
  assertEqual('Jan 1: no end-of-year warning', noWarnJan, false);
}

// ---------------------------------------------------------------------------
// 3G. Duplicate YMD helper — confirm both produce identical output (BUG-023)
// ---------------------------------------------------------------------------
console.log('\n=== dateToYMD / toYMD duplication probe ===\n');

{
  const testDates = [
    new Date(2026, 0,  1),  // Jan 1
    new Date(2026, 5, 16),  // Jun 16
    new Date(2026, 11, 31), // Dec 31
    new Date(2024, 1, 29),  // Feb 29 leap year
  ];

  for (const d of testDates) {
    const a = dateToYMD(d);
    const b = toYMD(d);
    assert(
      `dateToYMD and toYMD agree for ${d.toISOString().slice(0, 10)}`,
      a === b,
      `dateToYMD=${a}, toYMD=${b}`
    );
  }
}

// ---------------------------------------------------------------------------
// 3H. MONTH_START_OPTIONS type inconsistency probe (BUG-004)
// ---------------------------------------------------------------------------
console.log('\n=== MONTH_START_OPTIONS type probe (BUG-004) ===\n');

{
  // Simulate the production constant as it currently exists
  const MONTH_START_OPTIONS_PRODUCTION: Array<1 | 15> = [1, 15];

  // Simulate what it SHOULD be
  const MONTH_START_OPTIONS_CORRECT: Array<1 | 10> = [1, 10];

  // Production getBudgetPeriod (simplified) only handles 1 and 10
  function budgetPeriodSupports(day: number): boolean {
    return day === 1 || day === 10;
  }

  for (const opt of MONTH_START_OPTIONS_PRODUCTION) {
    const supported = budgetPeriodSupports(opt);
    if (opt === 15) {
      assert(
        `BUG-004 DOCUMENTED: MONTH_START_OPTIONS contains ${opt} which getBudgetPeriod does NOT handle`,
        !supported,
        `value ${opt} is not supported by getBudgetPeriod`
      );
    }
  }

  for (const opt of MONTH_START_OPTIONS_CORRECT) {
    assert(
      `MONTH_START_OPTIONS_CORRECT: value ${opt} is supported by getBudgetPeriod`,
      budgetPeriodSupports(opt),
      `value ${opt} should be handled`
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Summary
// ---------------------------------------------------------------------------
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  console.error('--- Failed tests ---');
  failures.forEach(f => console.error(f));
  process.exit(1);
} else {
  process.exit(0);
}
