import { useState, useCallback } from 'react';
import { Settings } from '../types';
import * as storage from '../storage/settingsStorage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => storage.loadSettings());

  const saveSettings = useCallback((s: Settings) => {
    storage.saveSettings(s);
    setSettings(s);
  }, []);

  return { settings, saveSettings };
}
