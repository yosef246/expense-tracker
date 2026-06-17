import { Expense } from '../types';

const KEY = 'expenses';

export function loadExpenses(): Expense[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(KEY, JSON.stringify(expenses));
}

export function addExpense(expense: Expense): Expense[] {
  const all = loadExpenses();
  const updated = [...all, expense].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  saveExpenses(updated);
  return updated;
}

export function deleteExpense(id: string): Expense[] {
  const updated = loadExpenses().filter((e) => e.id !== id);
  saveExpenses(updated);
  return updated;
}
