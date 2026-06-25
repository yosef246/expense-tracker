import { ExpenseCategory } from '../types';

export const CATEGORIES: { id: ExpenseCategory; emoji: string; label: string; color: string }[] = [
  { id: 'food',           emoji: '🍔', label: 'אוכל',          color: '#f97316' },
  { id: 'car',            emoji: '🚗', label: 'רכב',           color: '#3b82f6' },
  { id: 'entertainment',  emoji: '🎉', label: 'בילוי',         color: '#a855f7' },
  { id: 'travel',         emoji: '🚌', label: 'נסיעות',        color: '#06b6d4' },
  { id: 'clothes',        emoji: '👗', label: 'בגדים',         color: '#ec4899' },
  { id: 'standing_order', emoji: '🔄', label: 'הוראות קבע',   color: '#6366f1' },
  { id: 'cigarettes',     emoji: '🚬', label: 'סיגריות',       color: '#78716c' },
  { id: 'gift',           emoji: '🎁', label: 'מתנה',          color: '#ef4444' },
  { id: 'debt',           emoji: '💸', label: 'חוב',           color: '#dc2626' },
  { id: 'other',          emoji: '📦', label: 'אחר',           color: '#94a3b8' },
];

export function getCategoryEmoji(id: ExpenseCategory | undefined): string {
  return CATEGORIES.find(c => c.id === id)?.emoji ?? '📦';
}

export function getCategoryColor(id: ExpenseCategory | undefined): string {
  return CATEGORIES.find(c => c.id === id)?.color ?? '#94a3b8';
}
