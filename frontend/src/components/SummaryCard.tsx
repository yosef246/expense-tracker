/**
 * SummaryCard.tsx
 *
 * Budget summary card with gradient background, displayed on HomeScreen and HistoryScreen.
 *
 * Props:
 *   totalSpent  — total spent in the period (number, ILS).
 *   budget      — monthly budget (number, ILS).
 *   percent     — pre-computed (totalSpent / budget) * 100. May exceed 100.
 *
 * Layout (DESIGN_SYSTEM.md §6 SummaryCard):
 *   LinearGradient card, colors=['#1e3a5f', '#16213e'], diagonal.
 *   Top to bottom:
 *     1. Small label "סה״כ הוצאות" (on-dark secondary)
 *     2. Hero amount (36px, on-dark white)
 *     3. Budget label "מתוך תקציב X ₪" (on-dark secondary)
 *     4. ProgressBar (full card width)
 *     5. Spent / Remaining row: "הוצאת: X ₪" (right) | "נשאר: Y ₪" (left)
 *     6. Percentage text centred below
 *
 * Usage:
 *   const percent = budget > 0 ? (totalSpent / budget) * 100 : 0;
 *   <SummaryCard totalSpent={totalSpent} budget={budget} percent={percent} />
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import ProgressBar         from './ProgressBar';
import { formatCurrency }  from '../utils/formatCurrency';
import { getProgressColor } from '../utils/getProgressColor';

interface SummaryCardProps {
  totalSpent: number;
  budget: number;
  percent: number;
}

export default function SummaryCard({
  totalSpent,
  budget,
  percent,
}: SummaryCardProps): React.ReactElement {
  const color     = getProgressColor(percent);
  const remaining = budget - totalSpent;

  return (
    <LinearGradient
      colors={['#1e3a5f', '#16213e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Small label */}
      <Text style={styles.spentLabel}>{'סה"כ הוצאות'}</Text>

      {/* Hero amount */}
      <Text style={styles.spentAmount}>{formatCurrency(totalSpent)}</Text>

      {/* Budget label */}
      <Text style={styles.budgetLabel}>
        מתוך תקציב {formatCurrency(budget)}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressWrapper}>
        <ProgressBar percent={percent} color={color} animated />
      </View>

      {/* Spent / Remaining row */}
      <View style={styles.spentRemainingRow}>
        {/* Physical-right = reading-start in RTL: "הוצאת" */}
        <Text style={styles.rowLabel}>הוצאת: {formatCurrency(totalSpent)}</Text>
        {/* Physical-left = reading-end in RTL: "נשאר" */}
        <Text style={styles.rowLabel}>נשאר: {formatCurrency(remaining)}</Text>
      </View>

      {/* Percentage text */}
      <Text style={styles.percentText}>
        {Math.round(percent)}% ניצול
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    // Elevated card shadow
    elevation: 6,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
  },
  spentLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
    marginBottom: 4,
  },
  spentAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    lineHeight: 44,
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.60)',
    textAlign: 'right',
    marginBottom: 12,
  },
  progressWrapper: {
    marginBottom: 8,
  },
  // Spent / Remaining row below the progress bar
  spentRemainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 0,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.80)',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
    marginTop: 6,
  },
});
