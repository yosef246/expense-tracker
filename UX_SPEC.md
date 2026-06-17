# UX_SPEC.md — Personal Expense Tracker (מעקב הוצאות אישי)

> Hebrew-only, RTL, offline, 4 screens, portrait-only.
> All physical-side references below use the convention:
> **physical-left = the left edge of the device as held in portrait**.
> Because RTL is active, the reading "start" side is the physical-right edge.
> Wherever a distinction matters, both the visual intent (in Hebrew UX terms)
> and the physical coordinate are stated explicitly.

---

## 1. User Personas

### Persona A — The Daily Logger (the primary user)
Yosef is a salaried professional who wants a zero-friction way to record every cash or card purchase the moment it happens. He does not want to sign up for anything or hand his data to a third party. He opens the app, taps "+", types the amount, optionally names it, and closes the app — all in under ten seconds. He checks the progress bar once or twice a day to know roughly how much budget headroom he has left this month. He reviews last month's spending perhaps once a week from the History screen when he is curious about patterns. He expects everything to be in Hebrew and all numbers to be in shekels.

### Persona B — The Retrospective Reviewer
This is the same user in a different mode: sitting down at the end of the month, paging through History, looking at the biggest expense and the daily average to decide whether to adjust the budget. He uses the MonthNavigator arrows to compare two or three past months. He does not need charts — the progress bar percentage and the two insight lines are sufficient. He may want to delete a duplicate entry he accidentally logged twice.

### Persona C — The First-Time Setter
On first launch, or after a salary change, the user visits Settings to set the monthly budget amount and to choose whether his budget month starts on the 1st or the 15th (common for people paid mid-month). He does this once and then rarely returns to Settings. The form must be extremely simple: one number field, one two-option toggle.

---

## 2. Primary User Flows

### Flow 1 — App First Launch (cold start, no data)

1. Device opens the app. `App.tsx` runs RTL initialisation. If RTL was not already forced, the app reloads once automatically — the user sees a brief white flash, then the Home screen appears correctly in RTL.
2. `useExpenses` reads `"expenses"` from AsyncStorage — key is absent, default `[]` is written and returned.
3. `useSettings` reads `"settings"` from AsyncStorage — key is absent, default `{ monthlyBudget: 2000, monthStartDay: 1 }` is written and returned.
4. HomeScreen renders in its empty state (see Screen Inventory for empty-state detail).
5. Budget period label shows current Hebrew month and year.
6. Progress bar shows 0%, green colour.
7. "הוצאות אחרונות" section shows the empty-state placeholder message.

### Flow 2 — Add an Expense (happy path)

1. User is on HomeScreen.
2. User taps the circular FAB "+" at the physical bottom-right corner.
3. App pushes AddExpenseScreen onto the stack with a native slide animation.
4. The amount input is focused automatically; the numeric keyboard appears.
5. User types an amount (e.g., "8.90").
6. User optionally taps the description field and types a label (e.g., "פחית קולה ביילו"). Hebrew keyboard appears.
7. User optionally taps the date field to change the date (defaults to today). OS native date picker appears as a modal sheet. User picks a date and confirms.
8. User taps "💾 שמירה".
9. App validates: amount is parsed as a float, checked > 0. Validation passes.
10. `addExpense` is called; a UUID and `createdAt` timestamp are generated; the record is appended and persisted to AsyncStorage.
11. `navigation.goBack()` is called. AddExpenseScreen is popped. HomeScreen comes back into focus.
12. HomeScreen's `useFocusEffect` fires, calling `reload()`. The new expense appears in the "הוצאות אחרונות" list, the progress bar updates, and the spent/remaining row updates.

### Flow 3 — Add an Expense (invalid amount)

1. User reaches AddExpenseScreen (same as Flow 2, steps 1–4).
2. User taps "💾 שמירה" without entering an amount (field shows placeholder "0") OR types "0".
3. Validation fails: amount is 0 or empty.
4. An inline warning text "נא להזין סכום גדול מ-0" appears directly below the amount input. No dialog, no shake — just the soft inline text.
5. The data is NOT saved. The screen stays open. The user corrects the amount and tries again.
6. Once a valid amount is entered and save is tapped again, the warning text disappears and the flow continues as Flow 2 from step 9.

### Flow 4 — Delete an Expense from HomeScreen

1. User is on HomeScreen, looking at the 5 recent expenses.
2. User swipes a finger from left to right (physical direction) across an expense row — in RTL, this is a swipe toward the "start" side, which is the conventional "swipe-right" gesture.
3. As the finger moves past the 60 px threshold, the row slides to reveal a red "מחק" button on the physical-left side of the row (the trailing side in RTL, which is visually behind the row as it slides open).
4. User taps "מחק".
5. A native `Alert.alert` dialog appears with title "מחיקה", message "האם למחוק הוצאה זו?", and two buttons: "ביטול" (cancel, left button) and "מחק" (confirm, right button, styled destructively).
6. Edge: if user taps "ביטול" or taps outside the dialog, the row snaps back to its closed position. Nothing is deleted.
7. If user taps "מחק": `deleteExpense(id)` is called; AsyncStorage is updated; the row is removed from the list with a short collapse animation; totals on HomeScreen refresh immediately.

### Flow 5 — Delete an Expense from HistoryScreen

1. User is on HistoryScreen viewing a past month's full expense list.
2. Steps 2–7 from Flow 4 apply identically.
3. After deletion, the filtered expense list, the SummaryCard totals, and the InsightsBox all recalculate and re-render for the currently displayed month.
4. If deleting the last expense in that month, the list transitions to the empty state ("אין הוצאות לחודש זה") and the InsightsBox is hidden.

### Flow 6 — Navigate to History and Browse Months

1. User is on HomeScreen.
2. User taps "📊 היסטוריה" button.
3. HistoryScreen is pushed onto the stack. It initialises with `selectedDate = new Date()` (current month).
4. The MonthNavigator shows the current Hebrew month and year, centred between two arrow buttons.
5. User taps the "‹" (right-pointing in RTL display, navigates to previous month in time). In physical terms, the arrow on the physical-right side of the label goes to an earlier month.
   - `selectedDate` is set to the same calendar day of the previous month.
   - The budget period for the new date is computed.
   - The expense list, SummaryCard, and InsightsBox update to reflect that month.
6. User taps "›" (left-pointing in RTL display, navigates to next month in time).
   - Same update logic. Navigating into a future month with no data shows the empty state.
7. User taps the back button at the top to return to HomeScreen. No data changes are made by browsing.

### Flow 7 — Change Settings

1. User is on HomeScreen.
2. User taps the ⚙️ icon at the physical top-left corner (the visual top-left in RTL, which is the `start` side).
3. SettingsScreen is pushed onto the stack.
4. The monthly budget field is pre-filled with the current value (default: 2000).
5. The month-start segmented control shows which day is currently selected (1 or 15) with the active segment visually distinguished.
6. User edits the budget amount and/or toggles the month-start day.
7. User taps "✅ שמירה".
8. Validation: budget must be a positive integer > 0. If the field is empty or zero or non-numeric, an inline warning "נא להזין תקציב חיובי" appears below the field. Save is blocked.
9. If valid: `saveSettings` is called; AsyncStorage is updated. `navigation.goBack()` is called.
10. HomeScreen comes back into focus. `useFocusEffect` reloads both expenses and settings. The progress bar and spent/remaining figures recalculate against the new budget. The budget period may shift if `monthStartDay` changed.
11. Edge: user taps back without saving — changes are discarded, original settings remain.

---

## 3. Screen Inventory

---

### HomeScreen — מסך הבית

**Route name:** `Home` (initial screen)
**Auth required:** No (no auth exists in this app)
**Purpose:** The primary dashboard. Shows the current month's budget health at a glance, the 5 most recent expenses, and acts as the navigation hub.

#### Layout (RTL, top to bottom)

**Header row** (horizontal, full width, vertically centred):
- Physical-right side: budget title text — "💰 תקציב [חודש] [שנה]" — right-aligned, primary text style.
- Physical-left side: ⚙️ icon button, 44×44 minimum tap area, navigates to SettingsScreen.
- The header row uses `flexDirection: 'row'` with RTL semantics so the title is at the reading-start (physical right) and the icon at the reading-end (physical left).

**Budget amount display** (below header):
- Large, bold, centred numeric display of the monthly budget in shekels. Example: "2,000 ₪".
- This is a static label derived from `settings.monthlyBudget`, not the amount spent.

**SummaryCard** (below budget amount, full-width card with gradient background):
- Inside the card, from top to bottom:
  - Total spent this period, large text: e.g. "הוצאת: 840 ₪".
  - ProgressBar component: full width of the card, 20 px tall, colour driven by percentage.
  - Spent / remaining row: two labels side by side across the full card width.
    - Physical-right: "הוצאת: X ₪" — right-aligned.
    - Physical-left: "נשאר: Y ₪" — left-aligned.
    - If over-budget, "נשאר" displays a negative number (e.g., "נשאר: -120 ₪"). No special colour change beyond what the progress bar already communicates.
  - Utilisation percentage text, centred below the bar: e.g., "42%".

**Section header** (below SummaryCard):
- Text: "📅 הוצאות אחרונות", right-aligned, secondary text style.

**Recent expenses list** (below section header):
- At most 5 `ExpenseItem` rows, sorted descending by `createdAt`.
- Each row: see ExpenseItem component spec in Section 5.
- Swipe-to-delete is active on each row (see Flow 4).
- This is a non-scrolling list (`map`, not `FlatList`), since it is capped at 5 items.

**History button** (below expense list):
- Full-width or near-full-width pressable button labelled "📊 היסטוריה".
- Centred text. Navigates to HistoryScreen.

**FAB** (floating, overlaid on the screen):
- Circular button, minimum 56×56, labelled "+".
- Physical position: `bottom: 24, right: 24` (physical bottom-right corner).
- Renders above all scroll content via absolute positioning.
- Navigates to AddExpenseScreen.

#### Empty state (no expenses in current period)
- SummaryCard still renders, showing 0 ₪ spent, 0% bar (green), remaining = full budget.
- The "הוצאות אחרונות" section header is still visible.
- Below it, instead of expense rows, a single centred placeholder text: "עדיין אין הוצאות החודש. לחץ + כדי להוסיף."
- The history button and FAB remain visible and functional.

#### Loading state
- While `useExpenses` or `useSettings` is loading (`isLoading: true`), show skeleton placeholder rows in place of the expense list: 5 grey rounded rectangles of the same height as expense rows, with a subtle pulse animation.
- The progress bar shows at 0% width during load (before the animated fill kicks in).

#### Error state
- If AsyncStorage read fails on focus, show an inline banner at the top of the screen: "שגיאה בטעינת הנתונים" with a "נסה שנית" (retry) tappable label on the physical-left side. Tapping retry calls `reload()`.

---

### AddExpenseScreen — הוספת הוצאה

**Route name:** `AddExpense`
**Auth required:** No
**Purpose:** A focused, minimal form for logging a single expense. Opened from the HomeScreen FAB.

#### Layout (RTL, top to bottom)

**Header row** (horizontal, full width):
- Physical-right side: back button "→ חזרה" (the arrow visually points right in RTL, meaning "return"). 44×44 minimum tap area. Calls `navigation.goBack()`.
- Physical-left side: screen title "הוצאה חדשה", right-aligned text (reading start = physical right — NOTE: in this row the title is centred or right-aligned; the back button is at the physical-right edge, the title follows it toward centre).
- Clarification of physical positions: back arrow button is at physical-right. Title "הוצאה חדשה" is centred in the remaining space or centred across the full row. There is nothing at physical-left in the header.

**Amount input section** (below header, centred on screen):
- A static "₪" symbol displayed to the physical-left of the input (in RTL reading order, the symbol is the suffix, but visually it can sit inline left of the large number field to mimic a currency prefix common in Israeli apps — match BRIEF.md which says the ₪ prefix is static text to the left of the input).
- A large numeric `TextInput` centred on screen. `keyboardType="numeric"`. Placeholder: "0". Font size large (≥ 48 sp). Text centred within the input.
- Inline warning text (conditionally visible): "נא להזין סכום גדול מ-0" — appears directly below the amount input, centred, in a warning/error text style. Hidden by default; shown after a failed save attempt.

**Description input section** (below amount):
- Label: "על מה?" — right-aligned above the field.
- `TextInput`, full width, `keyboardType="default"`. Placeholder: "פחית קולה ביילו". `textAlign: 'right'`.
- No character counter is shown, but internally capped at 200 characters.

**Date selector row** (below description):
- Label: "תאריך" — right-aligned above the control.
- A tappable display row showing the selected date formatted as `DD/MM/YYYY`, right-aligned.
- A small calendar icon on the physical-left side of the row (trailing side in RTL).
- Tapping anywhere on the row opens the OS native date picker. iOS shows a modal spinner; Android shows a calendar dialog.
- Default value: today's date. After user picks a date from the native picker, the formatted date string updates.

**Save button** (below date selector, above keyboard or at bottom of screen):
- Full-width primary button labelled "💾 שמירה".
- Remains visible when keyboard is open (use `KeyboardAvoidingView` so the form scrolls up and the save button stays accessible).

#### Empty state
Not applicable — this screen starts with blank inputs by design.

#### Validation state
- Amount = 0 or empty: inline warning shown below the amount field. Save button remains visible and tappable (the warning is the only feedback — no button disable).
- Amount = valid positive number: warning is hidden (or cleared if it was previously shown).

#### Loading state
- After tapping "💾 שמירה" and before `addExpense` resolves: the save button shows a brief disabled/loading state (e.g., label changes to "שומר…") to prevent double-tap. Since AsyncStorage writes are fast, this is only a brief moment.

---

### SettingsScreen — הגדרות

**Route name:** `Settings`
**Auth required:** No
**Purpose:** Allows the user to configure monthly budget amount and the day the budget month begins.

#### Layout (RTL, top to bottom)

**Header row:**
- Physical-right: back button "→ חזרה", 44×44 tap area, calls `navigation.goBack()`.
- Centre or physical-left: screen title "הגדרות", right-aligned text.

**Monthly budget field** (below header):
- Label: "תקציב חודשי (₪)" — right-aligned.
- `TextInput`, `keyboardType="numeric"`, pre-filled with `settings.monthlyBudget` (default: "2000"). `textAlign: 'right'`.
- Inline warning (conditionally visible): "נא להזין תקציב חיובי" — appears directly below the field. Hidden by default.

**Month-start day selector** (below budget field):
- Label: "תאריך תחילת חודש" — right-aligned.
- A segmented control implemented as two side-by-side pressable buttons:
  - Right button (physical-right, reading-start in RTL): "1 לחודש"
  - Left button (physical-left, reading-end in RTL): "15 לחודש"
  - The currently selected option has a visually distinct active state (filled background or border). The inactive option is muted.
  - Only one option can be active at a time. Tapping an option makes it active immediately (local UI state only; not persisted until Save is tapped).

**Save button** (below selector, near bottom):
- Full-width primary button labelled "✅ שמירה".

#### Empty / Loading state
- On mount, settings are read from AsyncStorage. If loading is slow, the fields show their default values (2000, day 1) until the real values arrive, then update. In practice this is instantaneous.

#### Error state
- If save fails due to AsyncStorage write error: `Alert.alert("שגיאה בשמירת הנתונים")` is shown. The screen stays open.

---

### HistoryScreen — היסטוריה חודשית

**Route name:** `History`
**Auth required:** No
**Purpose:** Lets the user browse any past or current month's full expense list, see budget utilisation, and review spending insights.

#### Layout (RTL, top to bottom)

**Header row:**
- Physical-right: back button "→ חזרה", 44×44 tap area, calls `navigation.goBack()`.
- Centre/remaining space: screen title "📊 היסטוריה חודשית", right-aligned or centred.

**MonthNavigator** (below header, full width):
- A horizontal row, three zones:
  - Physical-right: "›" arrow button (advances to next month in time), 44×44 tap area. In RTL, this arrow points left visually (physical-right side) and moves the calendar forward.
  - Centre: month and year label, e.g. "יוני 2026", centred text.
  - Physical-left: "‹" arrow button (goes to previous month in time), 44×44 tap area. In RTL, this arrow points right visually (physical-left side) and moves the calendar backward.
- RTL note: Because the month label reads right-to-left in mental model, "next month" (future) is associated with the physical-right arrow and "previous month" (past) with the physical-left arrow. This matches the RTL number-line convention. The arrow glyphs themselves may need `scaleX: -1` transforms to point in the correct physical direction.

**SummaryCard** (below MonthNavigator, full-width card with gradient):
- Same structure as HomeScreen SummaryCard:
  - Total spent for the selected period, large text.
  - ProgressBar with colour logic.
  - Spent / remaining labels row (physical-right = spent, physical-left = remaining).
  - Percentage utilisation text.
- Over-budget state: ProgressBar fills to 100% visually, colour is red (#ef4444). The percentage text shows the real value (e.g., "112%") even though the bar is capped at full width.

**Full expense list** (below SummaryCard):
- `FlatList` of all `ExpenseItem` rows for the selected month, sorted descending by `createdAt` (newest first).
- `keyExtractor={item => item.id}`, `removeClippedSubviews={true}`.
- Swipe-to-delete is active (Flow 5).
- Each row: see ExpenseItem component spec.

**InsightsBox** (below expense list, at the bottom of scrollable content):
- Only rendered when at least one expense exists in the selected period.
- Two lines of text:
  - Line 1: "ההוצאה הגדולה ביותר: [description] ([amount] ₪)" — right-aligned.
  - Line 2: "ממוצע יומי: [dailyAverage] ₪" — right-aligned.
- Light blue background panel, border-radius 12, padding 16.

#### Empty state (no expenses in selected period)
- SummaryCard still renders (0 ₪ spent, 0% bar, remaining = full budget).
- Instead of the expense list and InsightsBox, a single centred placeholder text: "אין הוצאות לחודש זה".
- The MonthNavigator remains fully functional so the user can navigate to a month that has data.

#### Loading state
- On first mount, while `useExpenses` loads: show skeleton rows in the FlatList area (same as HomeScreen loading state). SummaryCard shows 0 values.

---

## 4. Component Hierarchy

Components are listed with their props interface (in plain language, no code), which screens use them, and any behaviour notes.

---

### ProgressBar
**Used by:** HomeScreen (inside SummaryCard), HistoryScreen (inside SummaryCard)
**Props:** percentage value (raw number, 0 to 100+), fill colour string
**Behaviour:**
- Container: full parent width, fixed 20 px height, light grey track, border-radius 10.
- Fill child: width = `min(percent, 100)%` so it never overflows the track.
- On mount, animates from 0% to final width over 600 ms (ease-out).
- If percent > 100, visual fill is 100% width but the real number is displayed in text outside the bar. The bar itself does not overflow.

---

### ExpenseItem
**Used by:** HomeScreen (recent list, up to 5 items), HistoryScreen (full FlatList)
**Props:** expense object (id, amount, description, date, createdAt), onDelete callback
**Layout (RTL row):**
- Physical-right cluster: date+time string (e.g., "15/06 14:32"), small, muted grey text, right-aligned.
- Centre/physical-left cluster: description text, bold, main colour, right-aligned.
- Physical-left (trailing end): formatted amount, e.g. "8.90 ₪", green colour (#10b981), left-aligned or end-aligned.
- The whole row is a card with slight shadow or border separator beneath it.
**Swipe gesture:**
- Finger drags from physical-left toward physical-right (in RTL gesture terms this is "swipe right" = swipe toward reading-start).
- Past 60 px, the row content slides, revealing a red "מחק" button on the physical-left (trailing) side.
- Releasing below threshold snaps row back. Releasing above threshold locks row open to reveal the delete button.
- Tapping "מחק" triggers `Alert.alert` confirmation dialog.
- Tapping elsewhere on an open row (not the delete button) snaps it closed.

---

### MonthNavigator
**Used by:** HistoryScreen only
**Props:** label string (Hebrew month + year), onPrev callback, onNext callback
**Layout:** Three-zone horizontal row:
- Physical-right: forward-time arrow button ("›"), 44×44 hit area, calls `onNext`.
- Centre: label text, centred, bold.
- Physical-left: back-time arrow button ("‹"), 44×44 hit area, calls `onPrev`.
**Note:** Arrow icons that imply direction must be mirrored with `scaleX: -1` if using standard Ionicons chevrons, to ensure the glyph points in the physically correct direction after RTL is applied.

---

### SummaryCard
**Used by:** HomeScreen, HistoryScreen
**Props:** totalSpent (number), budget (number), percent (number)
**Layout (top to bottom, inside a rounded card with gradient background):**
- Total spent: large bold amount text, right-aligned.
- Budget label: smaller secondary text showing budget amount, right-aligned.
- ProgressBar component (full card width).
- Spent / remaining row: "הוצאת: X ₪" physical-right — "נשאר: Y ₪" physical-left.
- Percentage text centred below the bar.
**Negative remaining:** if `totalSpent > budget`, "נשאר" shows a negative number formatted normally (e.g., "נשאר: -150 ₪"). No additional colour change on the text.

---

### InsightsBox
**Used by:** HistoryScreen only (hidden in empty state)
**Props:** largestExpense (Expense object or null), dailyAverage (number)
**Layout:**
- Light blue background panel, border-radius 12, padding 16.
- Line 1: "ההוצאה הגדולה ביותר: [description] ([amount] ₪)" — right-aligned. If `largestExpense` is null, renders "אין הוצאות בחודש זה" and hides line 2.
- Line 2: "ממוצע יומי: [dailyAverage] ₪" — right-aligned. Formatted with `formatCurrency`.

---

### BackHeader
**Used by:** AddExpenseScreen, SettingsScreen, HistoryScreen
**Props:** title string, onBack callback
**Layout:**
- Horizontal row, full width.
- Physical-right: back button "→ חזרה" (arrow glyph + label text). 44×44 minimum tap area. Calls `onBack`.
- Remaining space: title text, right-aligned or centred.
**Note:** The "→" arrow glyph visually points right (physical-right direction) in RTL to indicate "return" — because in RTL, going back is toward the reading-start = physical-right. The icon may need `scaleX: -1` if using a standard left-pointing chevron.

---

### AmountInput
**Used by:** AddExpenseScreen, SettingsScreen (budget field shares the numeric pattern)
**Props:** value string, onChange callback, placeholder string, showWarning boolean, warningText string
**Layout:**
- Optional leading label (e.g., "על מה?") above the field, right-aligned.
- Input row: static "₪" text on physical-left side + large numeric `TextInput` occupying the rest of the width. `textAlign: 'right'`. `keyboardType: 'numeric'`.
- Inline warning text below the field, shown only when `showWarning` is true.

---

### DateSelector
**Used by:** AddExpenseScreen only
**Props:** selectedDate (Date), onChange callback
**Layout:**
- Label "תאריך" right-aligned above the row.
- Tappable row: formatted date string (DD/MM/YYYY) right-aligned + calendar icon on physical-left.
- Tapping opens OS native date picker. On confirm, `onChange` is called with the new Date.

---

### SegmentedControl
**Used by:** SettingsScreen (month-start day picker)
**Props:** options (array of strings), selectedIndex (number), onChange callback
**Layout:**
- Two equal-width buttons in a row.
- Physical-right button: first option ("1 לחודש").
- Physical-left button: second option ("15 לחודש").
- Active segment: filled background or strong border. Inactive: muted.
- Only one segment active at a time.

---

### FAB (Floating Action Button)
**Used by:** HomeScreen only
**Props:** onPress callback, label string ("+")
**Layout:**
- Absolutely positioned: `bottom: 24, right: 24` (physical coordinates — stays at visual bottom-right in RTL).
- Circular, minimum 56×56. The "+" label is centred inside.
- Renders above all other content via `zIndex` or `elevation`.

---

## 5. Navigation Map

```
App launch
    └── HomeScreen  (initial route, always shown first)
            │
            ├── FAB "+"               → AddExpenseScreen
            │       └── "💾 שמירה" (success)  → goBack() → HomeScreen (data refreshes)
            │       └── "→ חזרה"              → goBack() → HomeScreen (no data change)
            │
            ├── ⚙️ icon (top-left)    → SettingsScreen
            │       └── "✅ שמירה" (success)  → goBack() → HomeScreen (settings + data refresh)
            │       └── "→ חזרה"              → goBack() → HomeScreen (no data change)
            │
            └── "📊 היסטוריה" button → HistoryScreen
                    │  (MonthNavigator ‹/› stays within HistoryScreen, no route change)
                    └── "→ חזרה"              → goBack() → HomeScreen
```

All navigation is stack-based push/pop. There are no tabs, no drawers, no modals with separate routes. The only modals are the OS native date picker (not a route) and `Alert.alert` dialogs (not routes).

`useFocusEffect` on HomeScreen ensures that every time the stack pops back to Home, expenses and settings are re-read from AsyncStorage so totals are always current.

---

## 6. Interaction Details

### Form Validation Timing

**AddExpenseScreen — amount field:**
- Validation fires only on tapping "💾 שמירה" (on-submit), not on blur.
- Rationale: validating on blur would show a warning the instant the user moves to the description field, which is premature and annoying. The user is still building the entry.
- Once the warning is visible (after a failed save), it clears automatically as soon as the user edits the amount field (on-change).

**SettingsScreen — budget field:**
- Same pattern: validate on submit only, clear warning on any change to the field.

### Optimistic Updates vs. Wait-for-Server

All data operations are local (AsyncStorage). There is no network round-trip. The UX approach is:
- **Wait for write, then navigate:** `addExpense` and `deleteExpense` are awaited before calling `goBack()` or removing the row from state. The wait is imperceptibly short (< 50 ms typical).
- **Save button loading state:** on "💾 שמירה" tap, the button label changes to "שומר…" and becomes non-tappable for the duration of the async write. This prevents double-saves.
- **Delete row:** the row is removed from local state immediately after the `Alert.alert` confirm is tapped (the UI removes it before the AsyncStorage write resolves, since failure is extremely unlikely and the UX benefit of instant removal outweighs the edge case). If the write fails, the row reappears and an `Alert.alert("שגיאה בשמירת הנתונים")` is shown.

### Confirmation Dialogs

Only one action requires a confirmation dialog: **deleting an expense**.
- Triggered by: tapping the red "מחק" button revealed by swipe-right on any `ExpenseItem` row.
- Dialog: `Alert.alert` (native OS dialog).
  - Title: "מחיקה"
  - Message: "האם למחוק הוצאה זו?"
  - Buttons: "ביטול" (cancel, safe action, positioned as the first/top button on iOS) and "מחק" (destructive confirm).
- All other actions (save expense, save settings) do not require confirmation.
- Settings changes do not require confirmation on discard (tapping back simply discards local state without a dialog).

### Swipe-to-Delete Gesture

- Gesture direction: physical left-to-right swipe on the item row.
- Threshold: 60 px of horizontal travel.
- Below threshold on release: row snaps back (spring animation).
- Above threshold on release: row locks open, red "מחק" button is fully visible on the physical-left (trailing) side.
- While any row is open, tapping anywhere outside that row's delete button closes the open row.
- Only one row can be in the open (delete revealed) state at a time. Opening a new row auto-closes any previously open row.

### Month Picker Arrows

- "›" (physical-right arrow in MonthNavigator): moves `selectedDate` one month forward.
- "‹" (physical-left arrow in MonthNavigator): moves `selectedDate` one month backward.
- There is no minimum or maximum boundary — the user can navigate to any month. Past months with no data show the empty state. Future months also show the empty state.
- Each arrow tap is an immediate synchronous state update (no animation on the label swap, or a brief cross-fade at most).

### Keyboard Behaviour

- AddExpenseScreen: `KeyboardAvoidingView` wraps the form so that when the numeric keyboard appears, the save button and date field remain reachable by scrolling.
- Amount input: focused automatically on screen mount (`autoFocus`). Numeric keyboard appears immediately.
- SettingsScreen: budget field is not auto-focused (the user may just want to change the day toggle without touching the keyboard).
- All numeric inputs: `returnKeyType="done"` closes the keyboard.

### No Keyboard Shortcuts

This is a mobile-only app. No hardware keyboard shortcuts are specified.

### Mobile-Specific Behaviour

- Portrait-only. Landscape is locked out via `app.json` `"orientation": "portrait"`.
- No responsive breakpoints — there is only one layout target (phone portrait).
- Safe area insets: all screens use `SafeAreaView` (or equivalent padding) to avoid content being hidden behind the device notch, home indicator, or status bar.
- The FAB is positioned at `bottom: 24, right: 24` from the safe area bottom edge, not from the physical screen edge.
- The native date picker renders as a bottom sheet modal on iOS and a dialog on Android — no custom styling needed for the picker itself.

### Currency Display Rules

Across all screens where a shekel amount is displayed:
- Whole integers: no decimal places, thousands comma. Example: "1,240 ₪".
- Fractional amounts: exactly 2 decimal places, thousands comma. Example: "8.90 ₪".
- Negative amounts (over-budget remaining): prefixed with minus sign. Example: "-120 ₪".
- The "₪" symbol always appears with a space before it: "200 ₪", not "200₪".

### Data Persistence Error Handling

- If any AsyncStorage write fails: `Alert.alert` with "שגיאה בשמירת הנתונים". The user is informed but not navigated away. They can try again.
- If any AsyncStorage read fails: the inline error banner appears on HomeScreen (see Screen Inventory). On other screens, the data may show as empty/default, and the banner is shown at the top.

---

## 7. Accessibility Notes

The following accessibility requirements apply to every screen and component.

1. **All interactive elements have accessible labels.** Every button, icon button, and input has an `accessibilityLabel` prop in Hebrew describing its function. Example: the ⚙️ icon button has `accessibilityLabel="פתיחת הגדרות"`. The FAB "+" has `accessibilityLabel="הוספת הוצאה חדשה"`.

2. **All form fields have visible labels.** No input is labelled by placeholder text alone. Every `TextInput` has a visible label rendered above it. The `accessibilityLabel` on the input includes the label text.

3. **Error messages are announced via `aria-live` equivalent.** Inline warning texts (e.g., "נא להזין סכום גדול מ-0") are wrapped with `accessibilityLiveRegion="polite"` so screen readers announce them when they appear, without the user navigating to them.

4. **`Alert.alert` dialogs** are natively accessible on both iOS and Android — focus is automatically transferred to the dialog by the OS. No additional accessibility work needed.

5. **Focus order is logical.** On AddExpenseScreen: amount input → description input → date selector → save button. On SettingsScreen: budget input → segmented control → save button. This matches the visual top-to-bottom RTL reading order.

6. **Tab/focus navigation works for all interactive elements.** Swipe-to-delete must also be accessible: the `ExpenseItem` component provides an additional `accessibilityAction` of `"delete"` so screen-reader users can delete without performing the swipe gesture.

7. **Colour is never the sole indicator.** The progress bar colour changes (green/yellow/red) are reinforced by the percentage number text displayed below the bar. An over-budget state is additionally communicated by a negative "נשאר" value.

8. **Minimum tap target size of 44×44 points** is maintained for all buttons and icon buttons, including the MonthNavigator arrows and the back button.

9. **RTL-aware reading order.** Because `I18nManager.forceRTL(true)` is set, React Native's accessibility tree is already in RTL order. No manual `accessibilityViewIsModal` overrides are needed for the main screens. Verify on a physical device that VoiceOver (iOS) and TalkBack (Android) read elements right-to-left.

10. **Text scaling.** All text uses relative sizing (via the style system without `allowFontScaling={false}`) so that users who increase system font size in accessibility settings have a readable experience. The large amount input may clip at very large font scales — acceptable given the personal-use scope.

---

## Summary

This UX specification covers **4 screens** (HomeScreen, AddExpenseScreen, SettingsScreen, HistoryScreen), **7 user flows** (first launch, add expense happy path, add expense invalid, delete from home, delete from history, browse history months, change settings), and **9 reusable components** (ProgressBar, ExpenseItem, MonthNavigator, SummaryCard, InsightsBox, BackHeader, AmountInput, DateSelector, SegmentedControl — plus the FAB as a standalone component, bringing the total to 10). Every screen is tied to features defined in ARCHITECTURE.md Sections 9 and 10, and no screen has been invented without a corresponding feature. The spec is written exclusively for RTL Hebrew layout, with explicit physical-side coordinates stated wherever left/right could be ambiguous.
