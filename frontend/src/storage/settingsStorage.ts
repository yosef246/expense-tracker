import { Settings } from '../types';

const KEY = 'settings';
const DEFAULTS: Settings = { monthlyBudget: 2000, monthStartDay: 1 };

export function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
