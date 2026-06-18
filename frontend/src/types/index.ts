export type ExpenseCategory = 'food' | 'car' | 'entertainment' | 'shopping' | 'other';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;       // YYYY-MM-DD
  createdAt: string;  // ISO timestamp
  category: ExpenseCategory;
}

export interface Settings {
  monthlyBudget: number;
  monthStartDay: 1 | 15;
}

export interface BudgetPeriod {
  start: Date;
  end: Date;
  label: string;
}
