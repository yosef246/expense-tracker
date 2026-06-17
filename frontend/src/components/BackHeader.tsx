/**
 * BackHeader.tsx
 *
 * Reusable header row used on AddExpenseScreen, SettingsScreen, and HistoryScreen.
 *
 * Layout (DESIGN_SYSTEM.md §6 BackHeader):
 *   - Full-width horizontal row, height 56.
 *   - Physical-right side (RTL reading-start): "→ חזרה" back button with Ionicons arrow-forward.
 *   - Remaining space: screen title, centred (compensated with paddingEnd so title is truly centred).
 *   - Background: #f9fafb (matches page background, no visible border).
 *
 * RTL note:
 *   arrow-forward-outline points physically right. In RTL, going back = returning toward the
 *   reading-start direction (physical right), so this icon is semantically correct without any
 *   scaleX transform.
 *
 * Props:
 *   title  — screen title displayed in the centre/remaining space.
 *   onBack — called when the back button is tapped.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BACKGROUND,
  TEXT_PRIMARY,
  BORDER_FOCUS,
} from '../constants/colors';

interface BackHeaderProps {
  title: string;
  onBack: () => void;
}

export default function BackHeader({
  title,
  onBack,
}: BackHeaderProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {/* Back button — physical right in RTL (reading-start side) */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        accessibilityLabel="חזרה"
        accessibilityRole="button"
      >
        <Ionicons
          name="arrow-forward-outline"
          size={22}
          color={BORDER_FOCUS}
        />
        <Text style={styles.backLabel}>חזרה</Text>
      </TouchableOpacity>

      {/* Title — centred in the remaining space */}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {/* Invisible spacer — balances the back button width so title is truly centred */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: BACKGROUND,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    paddingEnd: 8,
    gap: 4,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: BORDER_FOCUS,
    textAlign: 'right',
    marginStart: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    // paddingEnd compensates for back button width to keep title truly centred
    paddingEnd: 64,
  },
  spacer: {
    width: 0, // back button already has its own width via flex layout
  },
});
