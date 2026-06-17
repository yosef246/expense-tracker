/**
 * MonthNavigator.tsx
 *
 * Navigation row for browsing budget periods in HistoryScreen.
 *
 * Props:
 *   label   — Hebrew month + year string, e.g. "יוני 2026". Displayed centred.
 *   onPrev  — called when the user presses the "‹" (previous month) arrow.
 *   onNext  — called when the user presses the "›" (next month) arrow.
 *
 * Layout (DESIGN_SYSTEM.md §6 MonthNavigator, UX_SPEC §3 HistoryScreen):
 *
 *   Physical layout: [›] ——— label ——— [‹]
 *                     right           left
 *
 *   In RTL flexDirection: 'row', the first child in JSX appears on the physical-right side.
 *   Therefore: first child = "›" next (onNext) → physical-right
 *               last child = "‹" prev (onPrev) → physical-left
 *
 *   This matches UX_SPEC: "physical-right: › arrow (advances to next month)"
 *                         "physical-left:  ‹ arrow (goes to previous month)"
 *
 * RTL note:
 *   With I18nManager.forceRTL(true) the row order is automatically mirrored.
 *   The Ionicons chevron-forward/chevron-back glyphs may point the wrong physical
 *   direction after RTL mirror. Using text glyphs "›" / "‹" avoids this issue.
 *   Test on device and apply transform: [{ scaleX: -1 }] to icon if needed.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TEXT_PRIMARY, DIVIDER, CARD_BACKGROUND } from '../constants/colors';

interface MonthNavigatorProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNavigator({
  label,
  onPrev,
  onNext,
}: MonthNavigatorProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {/*
       * FIRST child in JSX = physical-RIGHT in RTL row → next month ("›")
       * Ionicons chevron-forward points right; in RTL layout it stays physical-right.
       */}
      <TouchableOpacity
        style={styles.arrowBtn}
        onPress={onNext}
        accessibilityLabel="חודש הבא"
        accessibilityRole="button"
      >
        <Ionicons
          name="chevron-forward-outline"
          size={22}
          color={TEXT_PRIMARY}
        />
      </TouchableOpacity>

      {/* Month label — centred */}
      <Text style={styles.label}>{label}</Text>

      {/*
       * LAST child in JSX = physical-LEFT in RTL row → previous month ("‹")
       * Ionicons chevron-back points left; in RTL layout it stays physical-left.
       */}
      <TouchableOpacity
        style={styles.arrowBtn}
        onPress={onPrev}
        accessibilityLabel="חודש קודם"
        accessibilityRole="button"
      >
        <Ionicons
          name="chevron-back-outline"
          size={22}
          color={TEXT_PRIMARY}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: CARD_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  arrowBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'transparent',
  },
  label: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
});
