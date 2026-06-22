import { ExpenseCategory } from '../types';

export const CATEGORIES: { id: ExpenseCategory; emoji: string; label: string; color: string }[] = [
  { id: 'food',          emoji: '🍔', label: 'אוכל',   color: '#f97316' },
  { id: 'car',           emoji: '🚗', label: 'רכב',    color: '#3b82f6' },
  { id: 'entertainment', emoji: '🎉', label: 'בילוי',  color: '#a855f7' },
  { id: 'travel',        emoji: '🚌', label: 'נסיעות', color: '#06b6d4' },
  { id: 'other',         emoji: '📦', label: 'אחר',    color: '#94a3b8' },
];

export function getCategoryEmoji(id: ExpenseCategory | undefined): string {
  return CATEGORIES.find(c => c.id === id)?.emoji ?? '📦';
}

export function getCategoryColor(id: ExpenseCategory | undefined): string {
  return CATEGORIES.find(c => c.id === id)?.color ?? '#94a3b8';
}
