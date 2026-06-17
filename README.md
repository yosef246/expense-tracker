# מעקב הוצאות — Expense Tracker

אפליקציה אישית למעקב הוצאות חודשי בעברית. ללא שרת, ללא התחברות, ללא סנכרון — כל הנתונים שמורים על המכשיר בלבד.

A personal, offline-only Hebrew expense tracker for iOS and Android. No server, no login, no cloud sync. All data lives on-device via AsyncStorage.

---

## Tech Stack

- **React Native 0.74** via **Expo SDK 51** (managed workflow)
- **TypeScript 5.x**
- **React Navigation 6** — native stack, no tabs
- **AsyncStorage** — sole persistence layer, two keys: `"expenses"` and `"settings"`
- **expo-linear-gradient**, **expo-updates**, **@expo/vector-icons** (Ionicons)
- **date-fns 3.x** — date formatting and period calculations
- **react-native-gesture-handler 2.x** — swipe-to-delete
- **@react-native-community/datetimepicker** — native OS date picker

---

## Project Structure

```
expense-tracker/
├── frontend/          — Expo / React Native app (the entire app lives here)
│   ├── App.tsx        — Entry point: RTL init, NavigationContainer
│   ├── app.json       — Expo config (portrait, no network permissions)
│   ├── package.json
│   └── src/
│       ├── constants/ — Color tokens, storage keys, default settings
│       ├── types/     — TypeScript interfaces: Expense, Settings, BudgetPeriod
│       ├── utils/     — formatCurrency, getBudgetPeriod, getProgressColor, generateId, dateHelpers
│       ├── hooks/     — useExpenses, useSettings
│       ├── components/— ProgressBar, ExpenseItem, MonthNavigator, SummaryCard, InsightsBox
│       └── screens/   — HomeScreen, AddExpenseScreen, SettingsScreen, HistoryScreen
└── tests/             — Standalone TypeScript test files (formatCurrency, budgetPeriod)
```

---

## Prerequisites

- **Node.js 18+** (Node 20 LTS recommended)
- **npm** (bundled with Node — no yarn/pnpm needed)
- **Expo CLI** — install once globally:
  ```bash
  npm install -g expo-cli
  ```
- **Expo Go** on your phone:
  - iPhone: [App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107779)
  - Android: [Google Play — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Installation

```bash
cd C:\Users\User\outputs\expense-tracker\frontend
npm install
```

---

## הרצה על הטלפון — Running on Your Phone

**This is the main way to use the app.** There is no web build and no simulator required.

1. Make sure your phone and computer are on the **same WiFi network**.

2. Start the Expo development server:
   ```bash
   cd C:\Users\User\outputs\expense-tracker\frontend
   npx expo start
   ```

3. A QR code appears in the terminal.

4. **iPhone:** Open the Camera app, point it at the QR code, then tap the Expo Go banner that appears.

5. **Android:** Open the Expo Go app, tap **"Scan QR code"**, then scan the code.

6. The app loads on your phone.

### First-launch RTL note

On the very first install, the app will reload itself **once automatically**. This is intentional — it activates the Hebrew right-to-left layout system-wide. After that one reload the app starts normally every time. If you see a white screen for a second on first launch, this is why.

---

## תכונות האפליקציה — App Features

- **מסך בית** — תקציב חודשי עם בר התקדמות צבעוני (ירוק / צהוב / אדום), סה"כ הוצאות, יתרה, ו-5 הוצאות אחרונות
- **הוספת הוצאה** — סכום, תיאור (אופציונלי), תאריך; שמירה חוזרת למסך הבית
- **מחיקת הוצאה** — סוואייפ ימינה על שורה → כפתור מחיקה אדום + אישור
- **היסטוריה חודשית** — ניווט חודש-חודש, סיכום תקציב, רשימת הוצאות, תובנות (הוצאה גדולה ביותר + ממוצע יומי)
- **הגדרות** — שינוי תקציב חודשי ויום תחילת חודש (1 או 15)

כל הסכומים מוצגים בשקל ישראלי (₪). האפליקציה כתובה כולה בעברית עם פריסת RTL מלאה.

---

## Running Tests

```bash
cd C:\Users\User\outputs\expense-tracker\tests
npm install
npm test
```

Runs two test files sequentially via `ts-node`:
- `formatCurrency.test.ts` — currency formatting edge cases
- `budgetPeriod.test.ts` — budget period calculation for `monthStartDay` 1 and 15

Exit code 0 means all pass.

---

## Environment Variables

No environment variables are required. This app makes no network requests and has no API keys or secrets. The `.env` file in `frontend/` exists as a placeholder for future use and can remain empty.

---

## Data Model

All data is stored in AsyncStorage under two keys:

| Key | Contents |
|---|---|
| `"expenses"` | JSON array of `{ id, amount, description, date, createdAt }` |
| `"settings"` | JSON object `{ monthlyBudget: number, monthStartDay: 1 \| 15 }` |

Default settings on first launch: `monthlyBudget: 2000`, `monthStartDay: 1`.

AsyncStorage data is **not encrypted**. On a rooted device another app could read it. For personal daily expense logging this is acceptable.

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design: data model, utility function specs, RTL configuration rules, screen-by-screen feature list, and component prop interfaces.

---

## Known Issues

The following medium-severity issues were identified in the test audit and were not fixed in this iteration (out of scope):

- **BUG-007** — ProgressBar animation starts from the current bar position on subsequent data changes rather than from 0%, as the spec requires on each screen focus. Cosmetic only.
- **BUG-008** — HomeScreen and HistoryScreen re-sort the already-sorted expenses array on every render (O(n log n) wasted work). Violates API contract invariant 3. Noticeable on low-end devices with 1,000+ expenses.
- **BUG-009** — SettingsScreen budget validation accepts inputs like `"2000abc"` (silently truncated to `2000` by `parseInt`). The `Number.isInteger` guard in the same validation block is dead code and provides no protection.
- **BUG-010** — `formatCurrency(NaN)` displays `"NaN ₪"` instead of a fallback. Can surface if AsyncStorage returns a corrupted expense record with a non-numeric amount.
- **EC-003** — Multiple expense rows can be swiped open simultaneously. The spec requires that opening one row closes any other open row.

See [TEST_REPORT.md](./TEST_REPORT.md) for the full audit including all critical/high bugs (which are fixed), low-severity findings, and the complete issue table.

---

## What's Next

- **Categories / tags** — the architecture explicitly defers expense categorisation; adding a `category` field to the `Expense` type and a filter UI in HistoryScreen is the most-requested natural extension
- **Export to CSV** — AsyncStorage data is plain JSON; a one-time export via `expo-sharing` + `expo-file-system` is straightforward and would make backup possible without a server
- **ProgressBar animation fix (BUG-007)** — reset `animatedWidth` to 0 before each `Animated.timing` call so the wipe-from-zero intro plays on every screen focus, not just on mount
- **Budget input hardening (BUG-009)** — replace `parseInt` with a `^\d+$` regex guard before parsing so entries like `"2000abc"` are rejected at the validation step
- **Cloud backup (optional)** — iCloud (iOS) or Google Drive (Android) via `expo-file-system` + a user-initiated export/import flow, without requiring a custom server
