/**
 * Cross-platform shadow presets.
 * Source of truth: DESIGN_SYSTEM.md §5.
 *
 * Usage:
 *   import { cardShadow } from '../constants/shadows';
 *   <View style={[styles.card, cardShadow]} />
 *
 * React Native selects ios vs android properties per platform.
 * Both blocks are declared on the same object; React Native ignores
 * properties that don't apply to the current platform.
 */

/** Card shadow — white cards (ExpenseItem, outer wrappers) */
export const cardShadow = {
  shadowColor: '#1a1a2e',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

/** Elevated card shadow — SummaryCard, modals */
export const elevatedShadow = {
  shadowColor: '#1a1a2e',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 6,
};

/** FAB shadow */
export const fabShadow = {
  shadowColor: '#1d4ed8',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 10,
  elevation: 8,
};

/** No shadow (flat) */
export const noShadow = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};
