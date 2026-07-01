import { useState, useCallback } from 'react';
import { Settings } from '../types';
import * as storage from '../storage/settingsStorage';
import { loadExpenses } from '../storage/expenseStorage';
import { getBudgetPeriod, toYMD } from '../utils/getBudgetPeriod';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const s = storage.loadSettings();
    const periodStart = toYMD(getBudgetPeriod(s.monthStartDay).start);
    if (!s.budgetHistory?.[periodStart]) {
      const updated: Settings = {
        ...s,
        budgetHistory: { ...(s.budgetHistory || {}), [periodStart]: s.monthlyBudget },
      };
      storage.saveSettings(updated);
      return updated;
    }
    return s;
  });

  const saveSettings = useCallback((s: Settings) => {
    const currentPeriodStart = toYMD(getBudgetPeriod(s.monthStartDay).start);
    const history = { ...(s.budgetHistory || {}), ...(settings.budgetHistory || {}) };
    const oldBudget = settings.monthlyBudget;

    const seen = new Set<string>();
    for (const e of loadExpenses()) {
      const [y, m, d] = e.date.split('-').map(Number);
      const key = toYMD(getBudgetPeriod(s.monthStartDay, new Date(y, m - 1, d)).start);
      if (key !== currentPeriodStart && !history[key] && !seen.has(key)) {
        history[key] = oldBudget;
        seen.add(key);
      }
    }

    history[currentPeriodStart] = s.monthlyBudget;

    const updated: Settings = { ...s, budgetHistory: history };
    storage.saveSettings(updated);
    setSettings(updated);
  }, [settings]);

  return { settings, saveSettings };
}
