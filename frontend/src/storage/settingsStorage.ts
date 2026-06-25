import { Settings } from '../types';

const KEY = 'settings';
const DEFAULTS: Settings = { monthlyBudget: 2000, monthStartDay: 1 };

export function loadSettings(): Settings {
  try {
    const raw = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    if (raw.monthStartDay !== 1 && raw.monthStartDay !== 10) raw.monthStartDay = 10;
    return raw;
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
