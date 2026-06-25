import { useState, useEffect } from 'react';
import { saveExpenses } from '../storage/expenseStorage';

const KEY = 'lastResetYear';

const _wasRecentlyReset = (() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const stored = localStorage.getItem(KEY);
  const lastYear = stored === null ? currentYear - 1 : parseInt(stored, 10);
  if (currentYear > lastYear) {
    saveExpenses([]);
    localStorage.setItem(KEY, String(currentYear));
    return true;
  }
  return false;
})();

export function useYearlyReset() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const [wasRecentlyReset] = useState<boolean>(_wasRecentlyReset);

  useEffect(() => {
    if (wasRecentlyReset && 'caches' in window) {
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .catch(() => {});
    }
  }, [wasRecentlyReset]);

  const showEndOfYearWarning = month === 11 && day >= 20;

  return { showEndOfYearWarning, wasRecentlyReset, currentYear };
}
