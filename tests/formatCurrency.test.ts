/**
 * formatCurrency.test.ts
 *
 * Plain TypeScript tests for formatCurrency / formatAmount.
 * No test framework — each test is a function that throws on failure.
 * Run with: npx ts-node formatCurrency.test.ts
 * Or via: npm test (after package.json is in this directory)
 *
 * Spec reference: API_CONTRACT.md §3.1
 *
 * Rules under test:
 *   - Whole integer → no decimal places, thousands comma, trailing " ₪"
 *   - Fractional   → exactly 2 decimal places, thousands comma, trailing " ₪"
 *   - Negative     → leading minus sign (over-budget remaining)
 *   - Zero         → "0 ₪"
 *   - NaN / ±Inf   → not specified in API_CONTRACT; test documents current behaviour
 */

// ── Inline copy of the function under test ────────────────────────────────────
// We cannot import the RN module directly in plain Node, so we replicate the
// tiny pure function here exactly as implemented in
// frontend/src/utils/formatCurrency.ts (lines 24-33).

function formatCurrency(amount: number): string {
  const isWhole = amount % 1 === 0;
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(amount);
  return `${formatted} ₪`;
}

const formatAmount = formatCurrency; // alias, same function

// ── Test infrastructure ────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assertEqual(label: string, actual: string, expected: string): void {
  if (actual === expected) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    const msg = `  FAIL  ${label}\n         expected: ${JSON.stringify(expected)}\n         actual:   ${JSON.stringify(actual)}`;
    console.error(msg);
    failures.push(msg);
    failed++;
  }
}

// Helper: assert that the output CONTAINS the substring (for NaN / Inf cases
// where exact locale rendering is platform-dependent).
function assertContains(label: string, actual: string, substring: string): void {
  if (actual.includes(substring)) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    const msg = `  FAIL  ${label}\n         expected to contain: ${JSON.stringify(substring)}\n         actual: ${JSON.stringify(actual)}`;
    console.error(msg);
    failures.push(msg);
    failed++;
  }
}

// ── Test suite ─────────────────────────────────────────────────────────────────

console.log('\n=== formatCurrency / formatAmount tests ===\n');

// BUG-PROBE: formatCurrency(NaN) — isWhole check: NaN % 1 === 0 is FALSE in JS,
// so it falls into the fractional branch.  Intl.NumberFormat("he-IL").format(NaN)
// returns "NaN" on V8/Node.  Result will be "NaN ₪" — no crash, but this is
// undocumented behaviour.  The API_CONTRACT is silent on NaN; we document here.

// ── Spec-defined cases ────────────────────────────────────────────────────────
console.log('-- Spec-defined examples from API_CONTRACT.md §3.1 --');
assertEqual('0 → "0 ₪"',               formatCurrency(0),      '0 ₪');
assertEqual('200 → "200 ₪"',           formatCurrency(200),    '200 ₪');
assertEqual('1240 → "1,240 ₪"',        formatCurrency(1240),   '1,240 ₪');
assertEqual('8.9 → "8.90 ₪"',          formatCurrency(8.9),    '8.90 ₪');
assertEqual('1240.5 → "1,240.50 ₪"',   formatCurrency(1240.5), '1,240.50 ₪');

// BUG-001: he-IL locale on Node/V8 inserts U+200E (LEFT-TO-RIGHT MARK) before
// the minus sign in negative numbers.  The spec says '-50 ₪' (plain hyphen),
// but the actual output is '‎-50 ₪'.
// We test what the function actually produces vs. the spec expectation to
// surface this bug explicitly.
const negFiftyActual = formatCurrency(-50);
const negFiftySpec   = '-50 ₪';
const hasLRM = negFiftyActual.startsWith('‎');
if (hasLRM) {
  console.log('  BUG   -50 → he-IL locale inserts U+200E (LRM) before minus: '
    + JSON.stringify(negFiftyActual)
    + ' (spec expects: ' + JSON.stringify(negFiftySpec) + ')');
  // Still count as a known failure for the report:
  failures.push('BUG-001: he-IL inserts U+200E before negative amounts — "נשאר" display will have invisible leading character');
  failed++;
} else {
  assertEqual('-50 → "-50 ₪"', negFiftyActual, negFiftySpec);
}

// ── Alias identity ─────────────────────────────────────────────────────────────
console.log('\n-- formatAmount alias --');
assertEqual('formatAmount(200) === formatCurrency(200)',
  formatAmount(200), formatCurrency(200));

// ── Additional edge cases from BRIEF.md / ARCHITECTURE.md ────────────────────
console.log('\n-- Additional edge cases --');

// 1 is a whole integer
assertEqual('1 → "1 ₪"',               formatCurrency(1),      '1 ₪');

// 8.90 and 8.9 must both produce "8.90 ₪"
assertEqual('8.90 (literal) → "8.90 ₪"', formatCurrency(8.90),  '8.90 ₪');

// Large number with thousands
assertEqual('10000 → "10,000 ₪"',       formatCurrency(10000),  '10,000 ₪');

// Negative fractional (over-budget with cents)
assertEqual('-50.5 → "-50.50 ₪"',       formatCurrency(-50.5),  '-50.50 ₪');

// Very large number
assertEqual('1000000 → "1,000,000 ₪"',  formatCurrency(1000000), '1,000,000 ₪');

// ── BUG PROBES — undocumented / problematic inputs ───────────────────────────
console.log('\n-- Bug probes (undocumented inputs) --');

// NaN: NaN % 1 !== 0, so isWhole = false → fractional branch.
// Intl.NumberFormat("he-IL").format(NaN) returns "NaN" on Node v18+.
// Result: "NaN ₪"  — not a crash but the UI should guard against this.
// This test DOCUMENTS the actual behaviour, not the desired behaviour.
const nanResult = formatCurrency(NaN);
assertContains('NaN → ends with " ₪" (no crash)', nanResult, ' ₪');
console.log(`         (actual NaN result: ${JSON.stringify(nanResult)})`);

// Infinity: Math.Infinity % 1 = NaN → isWhole = false → fractional branch.
// Intl.NumberFormat.format(Infinity) returns "∞" on Node.
const infResult = formatCurrency(Infinity);
assertContains('Infinity → ends with " ₪" (no crash)', infResult, ' ₪');
console.log(`         (actual Infinity result: ${JSON.stringify(infResult)})`);

// -Infinity
const negInfResult = formatCurrency(-Infinity);
assertContains('-Infinity → ends with " ₪" (no crash)', negInfResult, ' ₪');
console.log(`         (actual -Infinity result: ${JSON.stringify(negInfResult)})`);

// ── BUG VERIFICATION: NaN isWhole detection ───────────────────────────────────
// The spec (BRIEF.md, UX_SPEC) says amount must be > 0. The UI guards against
// saving amount = 0 or NaN.  However, if corrupted AsyncStorage data arrives,
// formatCurrency(NaN) is called without a crash — good.  But "NaN ₪" is ugly.
// This is a LOW severity issue (BUG-010 in report).

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
  console.error('Failed tests:');
  failures.forEach((f) => console.error(f));
  process.exit(1);
} else {
  process.exit(0);
}
