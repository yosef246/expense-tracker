/**
 * ExpenseItem.tsx
 *
 * Single expense row with swipe-right-to-delete gesture.
 *
 * Props:
 *   expense  — the Expense object to display.
 *   onDelete — callback called with expense.id after user confirms deletion.
 *
 * Layout (DESIGN_SYSTEM.md §6 ExpenseItem):
 *   - White card, borderRadius 12, marginHorizontal 20, marginBottom 8.
 *   - Content row: [date+time (right)] [description (flex-1, right)] [amount (left, green)].
 *   - Date+time: formatExpenseDate(expense.date, expense.createdAt) — "DD/MM HH:mm".
 *   - Amount: formatCurrency(expense.amount) in #10b981 green.
 *
 * Swipe-to-delete (DESIGN_SYSTEM.md §8):
 *   - User swipes physical right (toward reading-start in RTL).
 *   - At 60px threshold, snap open to reveal 80px red "מחק" button on the left.
 *   - Pressing "מחק" shows Alert.alert('מחיקה', 'האם למחוק הוצאה זו?', [...]).
 *   - Confirming calls onDelete(expense.id).
 *   - Implementation: PanResponder with spring animation (friction: 8, tension: 40).
 *
 * NOTE TO FRONTEND DEVELOPER:
 *   The full swipe implementation using PanResponder is below. Wire it up and apply
 *   the design tokens from DESIGN_SYSTEM.md §6.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  PanResponder,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Expense } from '../types';
import { formatCurrency }      from '../utils/formatCurrency';
import { formatExpenseDate }   from '../utils/dateHelpers';

interface ExpenseItemProps {
  expense: Expense;
  onDelete: (id: string) => void;
}

const SWIPE_THRESHOLD = 60;
const DELETE_WIDTH    = 80;

// Module-level: tracks the close function of the currently open row.
// Allows only one row to be open at a time across all ExpenseItem instances.
let closeCurrentRow: (() => void) | null = null;

export default function ExpenseItem({
  expense,
  onDelete,
}: ExpenseItemProps): React.ReactElement {
  const translateX   = useRef(new Animated.Value(0)).current;
  const rowHeight    = useRef(new Animated.Value(1)).current;   // 1 = normal, 0 = collapsed
  const rowOpacity   = useRef(new Animated.Value(1)).current;
  const isOpen       = useRef(false);

  // Closes this row by animating translateX back to 0.
  const closeRow = () => {
    Animated.spring(translateX, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    isOpen.current = false;
    if (closeCurrentRow === closeRow) {
      closeCurrentRow = null;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dy) < 20,

      onPanResponderMove: (_, gestureState) => {
        // Only allow rightward swipe (positive dx in LTR; in RTL the user swipes
        // physically right which is toward reading-start)
        const newX = isOpen.current
          ? gestureState.dx + DELETE_WIDTH
          : gestureState.dx;
        if (newX >= 0) {
          translateX.setValue(Math.min(newX, DELETE_WIDTH));
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        const finalX = isOpen.current
          ? gestureState.dx + DELETE_WIDTH
          : gestureState.dx;

        if (finalX > SWIPE_THRESHOLD) {
          // Close any other open row before opening this one
          if (closeCurrentRow && closeCurrentRow !== closeRow) {
            closeCurrentRow();
          }
          // Snap open
          Animated.spring(translateX, {
            toValue: DELETE_WIDTH,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
          isOpen.current = true;
          closeCurrentRow = closeRow;
        } else {
          // Snap closed
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
          isOpen.current = false;
          if (closeCurrentRow === closeRow) {
            closeCurrentRow = null;
          }
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Alert.alert('מחיקה', 'האם למחוק הוצאה זו?', [
      {
        text: 'ביטול',
        style: 'cancel',
        onPress: () => {
          // Snap row back closed when user cancels
          closeRow();
        },
      },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => {
          // Collapse height + fade out, then call onDelete
          if (closeCurrentRow === closeRow) {
            closeCurrentRow = null;
          }
          isOpen.current = false;
          Animated.parallel([
            Animated.timing(rowHeight, {
              toValue: 0,
              duration: 220,
              easing: Easing.out(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(rowOpacity, {
              toValue: 0,
              duration: 220,
              easing: Easing.out(Easing.ease),
              useNativeDriver: false,
            }),
          ]).start(() => onDelete(expense.id));
        },
      },
    ]);
  };

  // Interpolate rowHeight (0→1) to an actual height for the collapse animation.
  // We use scaleY on the outer wrapper so we don't need to know the intrinsic height.
  const containerStyle = {
    opacity: rowOpacity,
    transform: [{ scaleY: rowHeight }],
  };

  return (
    <Animated.View style={[styles.outerContainer, containerStyle]}>
      {/* Delete button revealed behind the card */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        accessibilityLabel="מחק הוצאה"
      >
        <Text style={styles.deleteText}>מחק</Text>
      </TouchableOpacity>

      {/* Swipeable card */}
      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dateCluster}>
          <Text style={styles.dateTime}>
            {formatExpenseDate(expense.date, expense.createdAt)}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={1}>
          {expense.description || '—'}
        </Text>

        <Text style={styles.amount}>
          {formatCurrency(expense.amount)}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DELETE_WIDTH,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  dateCluster: {
    alignItems: 'flex-end',
  },
  dateTime: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'right',
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a2e',
    textAlign: 'right',
    flex: 1,
    marginHorizontal: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'left',
  },
});
