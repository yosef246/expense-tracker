# ARCHITECTURE.md — Personal Expense Tracker (מעקב הוצאות)

---

## 1. Project Summary

This is a personal, offline-only mobile expense tracking application built for a single user. There is no backend server, no user authentication, and no cloud synchronisation. All data is persisted exclusively on the device using AsyncStorage. The app is written entirely in Hebrew with full RTL layout and displays all monetary values in Israeli New Shekel (₪). It provides four screens: a Home dashboard, an Add Expense form, a Settings panel, and a Monthly History view. The core value is frictionless daily expense logging with a clear visual indicator of how the user is tracking against their self-defined monthly budget.

---

## 2. Tech Stack

| Layer | Choice | Justification |
|---|---|---|
| Mobile framework | React Native via Expo SDK 51 | Managed workflow removes native build complexity; Expo Go enables instant on-device testing without a Mac/PC build step |
| Language | TypeScript 5.x | Catches data-model mistakes at compile time; mandatory for a data-heavy app with no tests at this stage |
| Navigation | React Navigation 6 (`@react-navigation/native` + `@react-navigation/native-stack`) | Industry standard; native-stack gives iOS/Android native header animations |
| Local storage | `@react-native-async-storage/async-storage` ^1.23 | Only stable, community-maintained AsyncStorage for Expo managed workflow |
| Gradients | `expo-linear-gradient` (bundled with Expo SDK 51) | Required for the design spec; no extra native module needed |
| Date handling | `date-fns` ^3.x | Lightweight, tree-shakeable, no locale download needed; provides `format`, `startOfMonth`, `addMonths`, `getDaysInMonth`, `differenceInDays` |
| Date picker | `@react-native-community/datetimepicker` via `expo` (already included in Expo SDK 51 as `expo-modules-core` dependency) | Native OS date picker on both iOS and Android |
| Styling | React Native `StyleSheet` only — no Tailwind | Expo managed workflow does not support NativeWind without ejecting; plain StyleSheet is sufficient and has zero overhead |
| Swipe-to-delete | `react-native-gesture-handler` ^2.x (already required by React Navigation) + manual animated swipe | Avoids adding a second gesture library |
| RTL | `I18nManager` from `react-native` | Built-in; `forceRTL(true)` + app reload enforces system-wide RTL |
| Package manager | npm (bundled with Node 20 LTS) | Expo's default; avoids yarn/pnpm version conflicts |
| Build tool | Expo CLI (`npx expo start`) | No custom Metro config needed |
| Icons | `@expo/vector-icons` (Ionicons subset) | Bundled with Expo; covers all required icons (settings gear, plus, arrow, calendar) |

---

## 3. Data Model

All data lives in AsyncStorage under exactly two keys: `"expenses"` and `"settings"`.

### AsyncStorage key: `"expenses"`

Stored value: JSON-serialised array of `Expense` objects.

```
Expense
- id:          string   — UUID v4, generated with crypto.randomUUID() or a manual fallback
- amount:      number   — positive float; stored as raw number (e.g. 8.90, 200)
- description: string   — free text, 1–200 chars; required
- date:        string   — ISO 8601 date string (YYYY-MM-DD) representing the expense date chosen by the user
- createdAt:   string   — ISO 8601 timestamp (full, with time) of when the record was saved; used for ordering
```

Example record:
```json
{
  "id": "a1b2c3d4-...",
  "amount": 8.90,
  "description": "פחית קולה ביילו",
  "date": "2026-06-15",
  "createdAt": "2026-06-15T14:32:00.000Z"
}
```

Sort order for all list displays: descending by `createdAt` (newest first). The `date` field drives budget-period filtering; `createdAt` drives display ordering within that period.

### AsyncStorage key: `"settings"`

Stored value: JSON-serialised `Settings` object.

```
Settings
- monthlyBudget:  number   — positive integer; default 2000; unit: ILS
- monthStartDay:  1 | 15   — the calendar day on which the user's budget month begins; default 1
```

Example record:
```json
{
  "monthlyBudget": 2000,
  "monthStartDay": 1
}
```

### Default values (applied on first launch when no AsyncStorage data exists)

```
expenses  → []
settings  → { monthlyBudget: 2000, monthStartDay: 1 }
```

---

## 4. File / Folder Structure

```
expense-tracker/
├── app.json                        — Expo config (name, slug, orientation: portrait)
├── App.tsx                         — Entry point: RTL init + NavigationContainer + RootStack
├── tsconfig.json
├── package.json
├── .env                            — empty (no secrets; included for future-proofing)
│
└── src/
    ├── constants/
    │   ├── colors.ts               — All color tokens: GREEN, YELLOW, RED, background, card, text, etc.
    │   ├── storage.ts              — AsyncStorage key constants: EXPENSES_KEY, SETTINGS_KEY
    │   └── defaults.ts             — Default settings object; MONTH_START_OPTIONS array ([1, 15])
    │
    ├── types/
    │   └── index.ts                — TypeScript interfaces: Expense, Settings, BudgetPeriod
    │
    ├── utils/
    │   ├── formatCurrency.ts       — formatCurrency(amount: number): string
    │   ├── getBudgetPeriod.ts      — getBudgetPeriod(monthStartDay, referenceDate): BudgetPeriod
    │   ├── getProgressColor.ts     — getProgressColor(percent: number): string
    │   ├── generateId.ts           — generateId(): string (UUID v4 or timestamp fallback)
    │   └── dateHelpers.ts          — getMonthLabel(date), getDaysElapsed(period), getTotalDays(period)
    │
    ├── hooks/
    │   ├── useExpenses.ts          — Load, save, add, delete expenses from AsyncStorage
    │   └── useSettings.ts          — Load and save settings from AsyncStorage
    │
    ├── components/
    │   ├── ProgressBar.tsx         — Animated progress bar with dynamic color
    │   ├── ExpenseItem.tsx         — Single expense row with swipe-to-delete gesture
    │   ├── MonthNavigator.tsx      — ‹ Month YYYY › arrow control for History screen
    │   ├── SummaryCard.tsx         — Budget summary card reused in Home + History
    │   └── InsightsBox.tsx         — Light-blue insights panel at bottom of History screen
    │
    └── screens/
        ├── HomeScreen.tsx          — Screen 1
        ├── AddExpenseScreen.tsx    — Screen 2
        ├── SettingsScreen.tsx      — Screen 3
        └── HistoryScreen.tsx       — Screen 4
```

---

## 5. Navigation Structure

React Navigation 6 native stack. No tabs. No drawer. All navigation is stack-based push/pop.

```
App.tsx
└── NavigationContainer
    └── Stack.Navigator  (initialRouteName="Home", screenOptions: headerShown false for all screens)
        ├── Stack.Screen  name="Home"        component={HomeScreen}
        ├── Stack.Screen  name="AddExpense"  component={AddExpenseScreen}
        ├── Stack.Screen  name="Settings"    component={SettingsScreen}
        └── Stack.Screen  name="History"     component={HistoryScreen}
```

All headers are hidden (`headerShown: false`). Each screen renders its own custom header row with a back button where needed.

Navigation calls:
- HomeScreen FAB "+" → `navigation.navigate('AddExpense')`
- HomeScreen ⚙️ icon → `navigation.navigate('Settings')`
- HomeScreen "📊 היסטוריה" button → `navigation.navigate('History')`
- AddExpenseScreen back → `navigation.goBack()`
- SettingsScreen back → `navigation.goBack()`
- HistoryScreen back → `navigation.goBack()`

After saving an expense in AddExpenseScreen, call `navigation.goBack()`. HomeScreen reloads its data via the `useExpenses` hook using a `useFocusEffect` listener so the totals are always fresh when the screen comes back into focus.

---

## 6. Key Hooks

### `useExpenses` — `src/hooks/useExpenses.ts`

**State managed:**
- `expenses: Expense[]` — full sorted array (descending by `createdAt`)
- `isLoading: boolean`

**Functions exposed:**
- `addExpense(payload: Omit<Expense, 'id' | 'createdAt'>): Promise<void>` — generates id and createdAt, appends to array, persists to AsyncStorage
- `deleteExpense(id: string): Promise<void>` — filters out the record, persists to AsyncStorage
- `reload(): Promise<void>` — re-reads from AsyncStorage (called by `useFocusEffect` on every screen focus)

**Internal behaviour:**
- On mount and on every `reload()` call, reads `EXPENSES_KEY` from AsyncStorage, parses JSON, sorts descending by `createdAt`, stores in state.
- All writes: read current array → mutate in memory → write entire array back to AsyncStorage as JSON string. This is safe at the scale of personal use (1000+ records is ~100–200 KB of JSON, well within AsyncStorage limits).

### `useSettings` — `src/hooks/useSettings.ts`

**State managed:**
- `settings: Settings`
- `isLoading: boolean`

**Functions exposed:**
- `saveSettings(updated: Settings): Promise<void>` — writes to `SETTINGS_KEY`, updates local state

**Internal behaviour:**
- On mount, reads `SETTINGS_KEY`. If null, writes and returns `DEFAULT_SETTINGS`. Merges with defaults defensively so future new settings fields don't break older persisted objects.

---

## 7. Utility Functions

### `formatCurrency(amount: number): string` — `src/utils/formatCurrency.ts`

Rules:
- If `amount` is a whole integer (amount % 1 === 0): format with thousands comma, zero decimal places. Example: `200` → `"200 ₪"`, `1240` → `"1,240 ₪"`.
- If `amount` has a fractional part: format with thousands comma, exactly 2 decimal places. Example: `8.9` → `"8.90 ₪"`, `1240.5` → `"1,240.50 ₪"`.
- Implementation: use `Intl.NumberFormat('he-IL', { minimumFractionDigits: 0|2, maximumFractionDigits: 0|2 })` then append ` ₪`. Do not rely on the `currency` style of `Intl.NumberFormat` because it may render the symbol differently across Android versions.

### `getBudgetPeriod(monthStartDay: 1 | 15, referenceDate: Date): BudgetPeriod` — `src/utils/getBudgetPeriod.ts`

Returns `BudgetPeriod`:
```typescript
interface BudgetPeriod {
  start: Date;   // inclusive — midnight of period start day
  end: Date;     // exclusive — midnight of next period start day
  label: string; // e.g. "יוני 2026"
}
```

Logic when `monthStartDay === 1`:
- `start` = first day of the calendar month containing `referenceDate`, at 00:00:00 local time.
- `end` = first day of the next calendar month, at 00:00:00 local time.
- `label` = Hebrew month name + year (use `date-fns/locale/he` with `format(start, 'MMMM yyyy', { locale: he })`).

Logic when `monthStartDay === 15`:
- If `referenceDate.getDate() >= 15`: `start` = 15th of current calendar month; `end` = 15th of next calendar month.
- If `referenceDate.getDate() < 15`: `start` = 15th of previous calendar month; `end` = 15th of current calendar month.
- `label` = Hebrew month name + year of the `start` date.

An expense belongs to a period if: `expense.date >= start (YYYY-MM-DD)` and `expense.date < end (YYYY-MM-DD)`. Compare as ISO date strings (lexicographic comparison is safe for YYYY-MM-DD format).

### `getProgressColor(percent: number): string` — `src/utils/getProgressColor.ts`

```
percent < 50   → '#10b981'  (green)
percent < 90   → '#f59e0b'  (yellow)
percent >= 90  → '#ef4444'  (red)
```

Input is clamped: if `percent > 100`, treat as 100 for colour purposes but display the real value in the bar.

### `generateId(): string` — `src/utils/generateId.ts`

Use `crypto.randomUUID()` if available (React Native Hermes on SDK 51 exposes it). Fallback: `Date.now().toString(36) + Math.random().toString(36).slice(2)`.

### `dateHelpers.ts` — `src/utils/dateHelpers.ts`

- `getMonthLabel(date: Date): string` — returns Hebrew month + year string, same logic as `getBudgetPeriod` label.
- `getDaysElapsed(period: BudgetPeriod, today: Date): number` — number of days from `period.start` up to and including `today`, capped at total period length. Used for daily-average calculation of the current period.
- `getTotalDays(period: BudgetPeriod): number` — total calendar days in the period (for completed past months).
- `formatExpenseDate(isoDate: string, createdAt: string): string` — formats display string for expense rows: `"15/06 14:32"` (DD/MM HH:mm). Uses the `date` field for the day and `createdAt` for the time.

---

## 8. RTL Configuration

RTL is configured once at app startup before any component renders.

In `App.tsx`, before the component definition (at module top level):

```typescript
import { I18nManager } from 'react-native';

if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  // On first launch this triggers a reload via Updates.reloadAsync()
}
```

Additionally set in `app.json`:
```json
{
  "expo": {
    "extra": {},
    "userInterfaceStyle": "light"
  }
}
```

Specific RTL rules the frontend developer must apply throughout:
- All `flexDirection` rows default to RTL-aware `row` (React Native respects `I18nManager.isRTL` for row direction automatically).
- `textAlign` for all Hebrew text: `'right'`.
- Icons that imply direction (back arrow, navigation arrows) must be mirrored: use `transform: [{ scaleX: -1 }]` on the arrow icon, or use the RTL-specific Ionicons name (`chevron-forward` for visual "back" in RTL, since the list is reversed).
- `paddingStart` / `paddingEnd` instead of `paddingLeft` / `paddingRight` for layout spacing that must flip with RTL.
- The FAB (floating action button) is positioned in the bottom-right corner. In RTL, "bottom-right" visually is `bottom: 24, left: 24` (because RTL flips the reading direction, but the FAB should remain at the visual bottom-right of the screen — keep it at `right: 24` in physical coordinates so it matches the brief).
- The settings icon ⚙️ is positioned at the top-left visually, which in RTL physical coordinates is `left: 16` on screen (this is already the "start" side in RTL, which is the visual right — confirm: the brief says "פינה השמאלית העליונה" = top-left visual corner, which in RTL is the `start` side = use `start: 16` or `left: 16`).

---

## 9. Screen-by-Screen Feature List

Features are numbered and atomic. Each is independently testable.

### Screen 1 — HomeScreen (`src/screens/HomeScreen.tsx`)

1. On focus, loads all expenses and settings from AsyncStorage via `useExpenses` and `useSettings` hooks.
2. Computes the current budget period using `getBudgetPeriod(settings.monthStartDay, new Date())`.
3. Displays page title: `"💰 תקציב [חודש] [שנה]"` using `getBudgetPeriod` label, with the monthly budget amount in large bold numerals below it.
4. Displays an animated `ProgressBar` component showing `(totalSpent / monthlyBudget) * 100` percent, coloured by `getProgressColor`.
5. Below the progress bar, displays `"הוצאת: X ₪"` (left/start side) and `"נשאר: Y ₪"` (right/end side) in the same row. "נשאר" may be negative if over budget — display negative value without special formatting beyond the sign.
6. Displays section header `"📅 הוצאות אחרונות"`.
7. Displays the 5 most recent expenses (by `createdAt` descending) as `ExpenseItem` rows, each showing formatted date+time, description, and formatted amount.
8. Displays a `"📊 היסטוריה"` button that navigates to HistoryScreen.
9. Displays a circular FAB with `"+"` at bottom-right (physical `right: 24, bottom: 24`) that navigates to AddExpenseScreen.
10. Displays a ⚙️ icon button at top-left (visual) that navigates to SettingsScreen.
11. Each `ExpenseItem` in the recent list supports swipe-right to reveal a red delete button; pressing it shows a native `Alert.alert` confirmation dialog; confirming calls `deleteExpense(id)` and refreshes the list.

### Screen 2 — AddExpenseScreen (`src/screens/AddExpenseScreen.tsx`)

12. Displays a back button `"→ חזרה"` at top-left that calls `navigation.goBack()`.
13. Displays the title `"הוצאה חדשה"`.
14. Renders a large centred numeric `TextInput` for the amount, with `keyboardType="numeric"` and placeholder `"0"`. Prefix `₪` is displayed as static text to the left of the input.
15. Renders a `TextInput` for the description with placeholder `"פחית קולה ביילו"` and label `"על מה?"`.
16. Renders a date selector defaulting to today's date. On press, opens the OS native date picker (`@react-native-community/datetimepicker`). The selected date is displayed as `DD/MM/YYYY`.
17. Pressing `"💾 שמירה"` validates: amount must be a positive number greater than zero. If amount is 0 or empty, show a non-blocking inline warning text `"נא להזין סכום גדול מ-0"` and do not save.
18. If valid, calls `addExpense({ amount, description, date })` and then `navigation.goBack()`.
19. Description field is optional — if empty, save with description as empty string `""`.

### Screen 3 — SettingsScreen (`src/screens/SettingsScreen.tsx`)

20. Displays a back button `"→ חזרה"` at top-left.
21. Displays the title `"הגדרות"`.
22. Renders a `TextInput` labelled `"תקציב חודשי (₪)"` pre-filled with current `settings.monthlyBudget`, `keyboardType="numeric"`.
23. Renders a dropdown/picker labelled `"תאריך תחילת חודש"` with exactly two options: `"1 לחודש"` and `"15 לחודש"`. Implemented as two styled pressable buttons acting as a segmented control (no external picker library needed).
24. Pressing `"✅ שמירה"` validates: budget must be a positive integer > 0. If invalid, show inline warning. If valid, calls `saveSettings({ monthlyBudget, monthStartDay })` and calls `navigation.goBack()`.

### Screen 4 — HistoryScreen (`src/screens/HistoryScreen.tsx`)

25. Displays a back button `"→ חזרה"` at top-left.
26. Displays the title `"📊 היסטוריה חודשית"`.
27. Maintains local state `selectedDate: Date` initialised to `new Date()` (current month).
28. Renders `MonthNavigator` component: pressing the left arrow (`‹`) sets `selectedDate` to the same day of the previous month; pressing the right arrow (`›`) sets it to the same day of the next month. Navigating forward past today is allowed (will show empty data).
29. Computes the budget period for `selectedDate` using `getBudgetPeriod(settings.monthStartDay, selectedDate)`.
30. Filters `expenses` to those whose `date` falls within the computed period.
31. Renders a `SummaryCard` showing: total spent this period, monthly budget, `ProgressBar`, and percentage utilisation text.
32. Renders the full filtered expense list, sorted descending by `createdAt`, as `ExpenseItem` rows (each showing date+time, description, amount). Swipe-to-delete is also active here and deletes from the global expenses array.
33. Renders `InsightsBox` at the bottom with:
    - Largest single expense: description + formatted amount. If no expenses, shows `"אין הוצאות בחודש זה"`.
    - Daily average: `totalSpent / getDaysElapsed(period, today)` for current period, or `totalSpent / getTotalDays(period)` for past periods. Formatted with `formatCurrency`.
34. If the filtered expense list is empty, shows a centred placeholder text `"אין הוצאות לחודש זה"` instead of the list and insights box.

---

## 10. Component Specifications

### `ProgressBar` — `src/components/ProgressBar.tsx`

Props:
```typescript
{
  percent: number;        // 0–100+, raw value
  color: string;          // from getProgressColor
  animated?: boolean;     // default true — animates fill on mount using Animated.timing
}
```
- Width fills parent. Height: 20px. Border radius: 10px.
- Background track colour: `#e5e7eb` (light grey).
- Fill is a child `View` with `width: \`${Math.min(percent, 100)}%\`` and the given `color`.
- Animated: on mount, width animates from 0 to final value over 600ms with `Easing.out(Easing.quad)`.
- Does not overflow the track even if percent > 100 (clamp visual width to 100%).

### `ExpenseItem` — `src/components/ExpenseItem.tsx`

Props:
```typescript
{
  expense: Expense;
  onDelete: (id: string) => void;
}
```
- Renders a card row: date+time (right-aligned, grey small), description (bold, main text), amount (formatted, coloured `#10b981` green for positive).
- Swipe gesture: use `Animated.event` on `PanResponder` or `react-native-gesture-handler`'s `Swipeable`. On swipe-right past 60px threshold, reveal a red delete button labelled `"מחק"`. Pressing it shows `Alert.alert('מחיקה', 'האם למחוק הוצאה זו?', [...])` with Cancel / Confirm options. Confirm calls `onDelete`.

### `MonthNavigator` — `src/components/MonthNavigator.tsx`

Props:
```typescript
{
  label: string;          // e.g. "יוני 2026"
  onPrev: () => void;
  onNext: () => void;
}
```
- Row layout: `‹` button — `label` centred — `›` button.
- Arrow buttons are 44x44 hit-area minimum.

### `SummaryCard` — `src/components/SummaryCard.tsx`

Props:
```typescript
{
  totalSpent: number;
  budget: number;
  percent: number;
}
```
- Renders a rounded card (border-radius 16, shadow) with gradient background (expo-linear-gradient from `#1e3a5f` to `#2d6a4f` or a calm dark blue — the exact gradient is the frontend developer's aesthetic choice within a dark/rich palette).
- Shows total spent large, budget small below, then `ProgressBar`, then percent text.

### `InsightsBox` — `src/components/InsightsBox.tsx`

Props:
```typescript
{
  largestExpense: Expense | null;
  dailyAverage: number;
}
```
- Light blue background (`#bfdbfe` or `#dbeafe`), border-radius 12, padding 16.
- Two lines of text as specified in the brief.

---

## 11. Color Constants — `src/constants/colors.ts`

```
PROGRESS_GREEN:   '#10b981'
PROGRESS_YELLOW:  '#f59e0b'
PROGRESS_RED:     '#ef4444'
BACKGROUND:       '#f9fafb'
CARD_BACKGROUND:  '#ffffff'
TEXT_PRIMARY:     '#111827'
TEXT_SECONDARY:   '#6b7280'
TEXT_MUTED:       '#9ca3af'
BORDER:           '#e5e7eb'
DELETE_RED:       '#ef4444'
INSIGHTS_BG:      '#dbeafe'
INSIGHTS_TEXT:    '#1e40af'
FAB_COLOR:        '#2563eb'
```

---

## 12. No API Endpoints

This application is fully offline. There are no HTTP requests, no REST endpoints, no GraphQL, no WebSockets, and no external network calls of any kind. All data operations go through AsyncStorage exclusively. Any mention of "API" in this document refers to hook function APIs, not network APIs.

---

## 13. Non-Functional Requirements

**Persistence:** All AsyncStorage writes are awaited and wrapped in try/catch. If a write fails (device storage full), show a `Alert.alert` with the message `"שגיאה בשמירת הנתונים"`. Data is never held only in memory without a corresponding AsyncStorage write.

**Performance with 1000+ records:** Expense lists in HomeScreen are capped at 5 items (no virtualisation needed). HistoryScreen uses a `FlatList` (not `ScrollView`) for the expense list to ensure only visible rows are rendered. `FlatList` must have `keyExtractor={item => item.id}` and `removeClippedSubviews={true}`.

**Validation:** All validation is inline (no validation library). Rules are: amount > 0 and is a finite number; budget > 0 and is a positive integer. Date picker enforces valid dates via the OS widget.

**Error handling:** Every `async` function in hooks wraps its body in try/catch and logs errors to `console.error`. User-visible errors use `Alert.alert`. No error boundaries are needed for this scope.

**No network permission** is requested in `app.json`. The `android.permissions` array must be empty (or omit the key entirely).

**Environment variables:** None required. There are no API keys or secrets.

**Orientation:** Portrait only. Set `"orientation": "portrait"` in `app.json`.

**Minimum OS versions:** iOS 15+, Android 8+ (API level 26+). These are Expo SDK 51 defaults and require no special configuration.

---

## 14. Out of Scope

The following are explicitly not part of this iteration and must not be implemented:

- User accounts, login, signup, or any authentication
- Cloud sync or backup to any external service (Firebase, iCloud, Google Drive, etc.)
- Push notifications or reminders
- Multiple currencies or currency conversion
- Categories / tags / labels for expenses
- Budget per category
- Charts or graphs (bar charts, pie charts) — the progress bar is the only visual metric
- Export to CSV, PDF, or any file format
- Import of existing expense data
- Multiple budget periods or custom date ranges beyond the start-day configuration
- Dark mode
- Recurring expenses
- Multi-language support (English translations, etc.) — Hebrew only
- Tablet layout or landscape mode
- Unit tests or integration tests
- CI/CD pipeline or any deployment configuration beyond `expo start`

---

## Open Questions

None. All ambiguities in the brief have been resolved with explicit decisions above. The `monthStartDay === 15` budget period logic (specifically which calendar month's label to display) is defined in Section 7 as: use the label of the `start` date's month.
