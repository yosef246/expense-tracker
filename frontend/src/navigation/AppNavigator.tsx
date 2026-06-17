/**
 * AppNavigator.tsx
 *
 * Root stack navigator for the expense tracker app.
 * All 4 screens are registered here. Headers are globally hidden — each
 * screen renders its own custom header row.
 *
 * Screen names:
 *   'Home'        — HomeScreen (initial route)
 *   'AddExpense'  — AddExpenseScreen
 *   'Settings'    — SettingsScreen
 *   'History'     — HistoryScreen
 *
 * Navigation calls (from ARCHITECTURE.md §5):
 *   HomeScreen FAB "+"           → navigation.navigate('AddExpense')
 *   HomeScreen ⚙️ icon            → navigation.navigate('Settings')
 *   HomeScreen "📊 היסטוריה"      → navigation.navigate('History')
 *   AddExpenseScreen back button → navigation.goBack()
 *   SettingsScreen back button   → navigation.goBack()
 *   HistoryScreen back button    → navigation.goBack()
 *   AddExpenseScreen after save  → navigation.goBack()
 *   SettingsScreen after save    → navigation.goBack()
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen       from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import SettingsScreen   from '../screens/SettingsScreen';
import HistoryScreen    from '../screens/HistoryScreen';

/**
 * RootStackParamList — type map for all screens and their navigation params.
 *
 * All screens currently take no params (undefined).
 * If a screen later needs params, add them here and update the screen's
 * NativeStackScreenProps type accordingly.
 */
export type RootStackParamList = {
  Home:        undefined;
  AddExpense:  undefined;
  Settings:    undefined;
  History:     undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        // React Navigation 6 automatically mirrors slide direction for RTL
        animation: 'default',
        contentStyle: { backgroundColor: '#f9fafb' },
      }}
    >
      <Stack.Screen name="Home"       component={HomeScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="Settings"   component={SettingsScreen} />
      <Stack.Screen name="History"    component={HistoryScreen} />
    </Stack.Navigator>
  );
}
