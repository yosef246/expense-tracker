/**
 * getProgressColor(percentage: number): string
 *
 * Returns the hex color string for the progress bar fill based on budget utilisation percentage.
 *
 * Thresholds:
 *   percentage < 50   → '#10b981'  (green  — healthy)
 *   percentage < 90   → '#f59e0b'  (yellow — watch out)
 *   percentage >= 90  → '#ef4444'  (red    — over budget or near limit)
 *
 * Note: the input is NOT clamped before colour selection — a percentage of 120 correctly
 * returns red. The ProgressBar component clamps the visual fill width to 100% independently.
 *
 * Examples:
 *   getProgressColor(0)   → '#10b981'
 *   getProgressColor(49)  → '#10b981'
 *   getProgressColor(50)  → '#f59e0b'
 *   getProgressColor(89)  → '#f59e0b'
 *   getProgressColor(90)  → '#ef4444'
 *   getProgressColor(150) → '#ef4444'
 */
export function getProgressColor(percentage: number): string {
  if (percentage < 50) {
    return '#10b981';
  }
  if (percentage < 90) {
    return '#f59e0b';
  }
  return '#ef4444';
}
