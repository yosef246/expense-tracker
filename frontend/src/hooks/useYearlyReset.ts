import { useState } from 'react';
import { saveExpenses } from '../storage/expenseStorage';

const KEY = 'lastResetYear';

export function useYearlyReset() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth(); // 11 = December
  const day = now.getDate();

  // Lazy initializer runs synchronously before useExpenses loads — guarantees clean slate
  const [wasRecentlyReset] = useState<boolean>(() => {
    const stored = localStorage.getItem(KEY);
    if (stored === null) {
      localStorage.setItem(KEY, String(currentYear));
      return false;
    }
    const lastYear = parseInt(stored, 10);
    if (currentYear > lastYear) {
      saveExpenses([]);
      localStorage.setItem(KEY, String(currentYear));
      if ('caches' in window) {
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
      }
      return true;
    }
    return false;
  });

  // Warning banner: December 20th and onwards
  const showEndOfYearWarning = month === 11 && day >= 20;

  return { showEndOfYearWarning, wasRecentlyReset, currentYear };
}
