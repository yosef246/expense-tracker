export function getProgressColor(percentage: number): string {
  if (percentage < 50) {
    return '#10b981';
  }
  if (percentage < 90) {
    return '#f59e0b';
  }
  return '#ef4444';
}
