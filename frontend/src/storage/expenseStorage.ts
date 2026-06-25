import { Expense } from '../types';

const KEY = 'expenses';

export function loadExpenses(): Expense[] {
  try {
    const raw: Omit<Expense, 'category'>[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    return raw.map(e => ({ category: 'other' as const, ...e }));
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(KEY, JSON.stringify(expenses));
}

export function addExpense(current: Expense[], expense: Expense): Expense[] {
  const updated = [...current, expense].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  saveExpenses(updated);
  return updated;
}

export function deleteExpense(current: Expense[], id: string): Expense[] {
  const updated = current.filter(e => e.id !== id);
  saveExpenses(updated);
  return updated;
}

export function editExpense(
  current: Expense[],
  id: string,
  changes: Partial<Pick<Expense, 'amount' | 'description' | 'date' | 'category'>>
): Expense[] {
  const updated = current.map(e => e.id === id ? { ...e, ...changes } : e);
  saveExpenses(updated);
  return updated;
}
