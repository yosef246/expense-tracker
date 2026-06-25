export function formatCurrency(amount: number): string {
  if (!isFinite(amount) || isNaN(amount)) return '0 ₪';

  const isWhole = amount % 1 === 0;

  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(amount);

  return `${formatted.replace(/‎/g, '')} ₪`;
}

export const formatAmount = formatCurrency;
