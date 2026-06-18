import { Expense } from '../types';

const KEY = 'expenses';

export function loadExpenses(): Expense[] {
  try {
    const raw: Omit<Expense, 'category'>[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    // Migration: add default category to old records that don't have one
    return raw.map(e => ({ category: 'other' as const, ...e }));
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(KEY, JSON.stringify(expenses));
}

export function addExpense(expense: Expense): Expense[] {
  const all = loadExpenses();
  const updated = [...all, expense].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  saveExpenses(updated);
  return updated;
}

export function deleteExpense(id: string): Expense[] {
  const updated = loadExpenses().filter(e => e.id !== id);
  saveExpenses(updated);
  return updated;
}

export function editExpense(
  id: string,
  changes: Partial<Pick<Expense, 'amount' | 'description' | 'date' | 'category'>>
): Expense[] {
  const updated = loadExpenses().map(e => e.id === id ? { ...e, ...changes } : e);
  saveExpenses(updated);
  return updated;
}
