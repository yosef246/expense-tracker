import { useState, useCallback } from 'react';
import { Expense } from '../types';
import * as storage from '../storage/expenseStorage';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => storage.loadExpenses());

  const addExpense = useCallback((amount: number, description: string, date: string) => {
    const expense: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      amount,
      description,
      date,
      createdAt: new Date().toISOString(),
    };
    setExpenses(storage.addExpense(expense));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(storage.deleteExpense(id));
  }, []);

  return { expenses, addExpense, deleteExpense };
}
