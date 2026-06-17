/**
 * InsightsBox.tsx
 *
 * Light-blue insights panel displayed at the bottom of HistoryScreen.
 * Shows the largest single expense and the daily spending average for the period.
 *
 * Props:
 *   largestExpense — the Expense object with the highest amount in the period,
 *                    or null if the period has no expenses.
 *   dailyAverage   — pre-computed average: totalSpent / daysElapsed (current period)
 *                    or totalSpent / totalDays (past period). Formatted by this component.
 *
 * Layout (DESIGN_SYSTEM.md §6 InsightsBox):
 *   - Background: #eff6ff, border: 1px solid #bfdbfe, borderRadius 12, padding 16.
 *   - Two lines of text in #1d4ed8 (INSIGHTS_TEXT).
 *   - If largestExpense is null: shows "אין הוצאות בחודש זה" in secondary grey.
 *
 * Usage:
 *   const largestExpense = periodExpenses.length > 0
 *     ? periodExpenses.reduce((max, e) => e.amount > max.amount ? e : max, periodExpenses[0])
 *     : null;
 *   const isCurrentPeriod = toYMD(today) >= startStr && toYMD(today) < endStr;
 *   const days = isCurrentPeriod ? getDaysElapsed(period, today) : getTotalDays(period);
 *   const dailyAverage = days > 0 ? totalSpent / days : 0;
 *
 *   <InsightsBox largestExpense={largestExpense} dailyAverage={dailyAverage} />
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Expense } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import {
  INSIGHTS_BG,
  INSIGHTS_BORDER,
  INSIGHTS_TEXT,
  TEXT_SECONDARY,
} from '../constants/colors';

interface InsightsBoxProps {
  largestExpense: Expense | null;
  dailyAverage: number;
}

export default function InsightsBox({
  largestExpense,
  dailyAverage,
}: InsightsBoxProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {largestExpense ? (
        <>
          <Text style={styles.insightLine}>
            {'ההוצאה הגדולה ביותר: '}
            <Text style={styles.insightBold}>
              {largestExpense.description || '—'}
            </Text>
            {' ('}
            {formatCurrency(largestExpense.amount)}
            {')'}
          </Text>
          <Text style={styles.insightLine}>
            {'ממוצע יומי: '}
            <Text style={styles.insightBold}>{formatCurrency(dailyAverage)}</Text>
          </Text>
        </>
      ) : (
        <Text style={styles.emptyText}>אין הוצאות בחודש זה</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: INSIGHTS_BG,
    borderWidth: 1,
    borderColor: INSIGHTS_BORDER,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  insightLine: {
    fontSize: 14,
    fontWeight: '500',
    color: INSIGHTS_TEXT,
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 6,
  },
  insightBold: {
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
});
