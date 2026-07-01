import { useState, useCallback } from 'react';
import { Settings } from '../types';
import * as storage from '../storage/settingsStorage';
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
    const periodStart = toYMD(getBudgetPeriod(s.monthStartDay).start);
    const updated: Settings = {
      ...s,
      budgetHistory: { ...(s.budgetHistory || {}), [periodStart]: s.monthlyBudget },
    };
    storage.saveSettings(updated);
    setSettings(updated);
  }, []);

  return { settings, saveSettings };
}
