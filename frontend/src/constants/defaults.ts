/**
 * Default values applied on first launch when no AsyncStorage data exists.
 */

import { Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  monthlyBudget: 2000,
  monthStartDay: 1,
};

/**
 * The two valid options for monthStartDay.
 * Used to render the segmented control in SettingsScreen.
 */
export const MONTH_START_OPTIONS: Array<1 | 15> = [1, 15];
