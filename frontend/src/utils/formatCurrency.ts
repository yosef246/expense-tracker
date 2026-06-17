/**
 * formatCurrency(amount: number): string
 *
 * Formats a monetary amount in Israeli New Shekel for display.
 *
 * Rules:
 *   - Whole integer:        "200 ₪"      (no decimals)
 *   - Has fractional part:  "8.90 ₪"     (exactly 2 decimals)
 *   - Thousands separator:  "1,240 ₪"
 *   - Negative amounts:     "-50 ₪"      (for over-budget "remaining" value)
 *
 * Implementation uses Intl.NumberFormat with 'he-IL' locale for correct comma
 * thousands separator, then appends " ₪" manually to avoid platform-specific
 * currency symbol rendering differences on older Android versions.
 *
 * Examples:
 *   formatCurrency(200)     → "200 ₪"
 *   formatCurrency(1240)    → "1,240 ₪"
 *   formatCurrency(8.9)     → "8.90 ₪"
 *   formatCurrency(1240.5)  → "1,240.50 ₪"
 *   formatCurrency(-50)     → "-50 ₪"
 *   formatCurrency(0)       → "0 ₪"
 */
export function formatCurrency(amount: number): string {
  if (!isFinite(amount) || isNaN(amount)) return '0 ₪';

  const isWhole = amount % 1 === 0;

  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(amount);

  // Strip U+200E LEFT-TO-RIGHT MARK that he-IL locale inserts before negative
  // numbers on Hermes / Node v18+. Without this, "-50 ₪" renders with an
  // invisible leading byte that corrupts RTL label display (BUG-001).
  return `${formatted.replace(/‎/g, '')} ₪`;
}

/**
 * formatAmount — alias for formatCurrency.
 * Provided for convenience per the task spec naming convention.
 * Both names are identical in behaviour.
 */
export const formatAmount = formatCurrency;
