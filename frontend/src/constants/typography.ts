/**
 * Typography scale for the expense tracker app.
 * Source of truth: DESIGN_SYSTEM.md §3 and §9.
 * Uses device system font (SF Pro on iOS, Roboto on Android). No custom font loading.
 */

import { StyleSheet } from 'react-native';
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  TEXT_ON_DARK,
  TEXT_ON_DARK_2,
  AMOUNT_POSITIVE,
  DANGER,
} from './colors';

export const typography = StyleSheet.create({
  // 48px — Budget amount on HomeScreen (on dark gradient)
  heroAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: TEXT_ON_DARK,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 56,
  },

  // 24px — Page titles ("הוספת הוצאה חדשה")
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'right',
    lineHeight: 32,
  },

  // 18px — Section headers ("הוצאות אחרונות", card headings)
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'right',
    lineHeight: 26,
  },

  // 16px — Expense description, form labels
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: TEXT_PRIMARY,
    textAlign: 'right',
    lineHeight: 24,
  },

  // 16px bold — Emphasized body, amounts in cards
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'right',
    lineHeight: 24,
  },

  // 14px — Budget label under hero amount
  bodySm: {
    fontSize: 14,
    fontWeight: '400',
    color: TEXT_SECONDARY,
    textAlign: 'right',
    lineHeight: 20,
  },

  // 13px — Date + time metadata in expense rows
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_MUTED,
    textAlign: 'right',
    lineHeight: 18,
  },

  // 13px bold — Badge labels
  captionBold: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'right',
    lineHeight: 18,
  },

  // 36px — Total spent inside SummaryCard (on dark)
  amountHero: {
    fontSize: 36,
    fontWeight: '700',
    color: TEXT_ON_DARK,
    textAlign: 'right',
    lineHeight: 44,
  },

  // 16px — Expense amounts in ExpenseItem rows (green)
  amountBody: {
    fontSize: 16,
    fontWeight: '600',
    color: AMOUNT_POSITIVE,
    textAlign: 'left',
    lineHeight: 24,
  },

  // 13px — Inline validation warning messages
  warningText: {
    fontSize: 13,
    fontWeight: '400',
    color: DANGER,
    textAlign: 'right',
    lineHeight: 18,
  },

  // 14px — Subdued labels on dark gradient surfaces
  onDarkLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: TEXT_ON_DARK_2,
    textAlign: 'right',
    lineHeight: 20,
  },

  // 15px — Empty state placeholder text (centred)
  emptyState: {
    fontSize: 15,
    fontWeight: '400',
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
  },
});
