import { useState, useCallback } from 'react';
import { Expense, ExpenseCategory } from '../types';
import * as storage from '../storage/expenseStorage';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => storage.loadExpenses());

  const addExpense = useCallback((
    amount: number,
    description: string,
    date: string,
    category: ExpenseCategory = 'other',
  ) => {
    const expense: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      amount, description, date, category,
      createdAt: new Date().toISOString(),
    };
    setExpenses(storage.addExpense(expense));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(storage.deleteExpense(id));
  }, []);

  const editExpense = useCallback((
    id: string,
    changes: Partial<Pick<Expense, 'amount' | 'description' | 'date' | 'category'>>,
  ) => {
    setExpenses(storage.editExpense(id, changes));
  }, []);

  return { expenses, addExpense, deleteExpense, editExpense };
}
