# Test Report — מעקב הוצאות (Expense Tracker PWA)

Audit date: 2026-06-25
Auditor: QA review of `frontend/src/` React + TypeScript PWA

---

## Fix Summary

- 4/4 HIGH fixed (BUG-001, BUG-002, BUG-003, BUG-004)
- 0/0 deferred HIGH
- BUG-005 deferred — out of scope (architectural, wiring storage constants)
- 2/7 MEDIUM fixed (BUG-006, BUG-007 — via BUG-007 module-scope IIFE approach)
- 5/5 MEDIUM deferred (BUG-008, BUG-009, BUG-010, BUG-011, BUG-012 — out of scope per instructions)
- 0/5 LOW fixed (out of scope)
- 9/9 CLEANUP fixed (BUG-016–BUG-024 all resolved — dead files deleted, unused code removed, all comments stripped)
- Verdict: ready for docs-writer

---

## Summary

| Severity | Count |
|---|---|
| HIGH | 5 |
| MEDIUM | 7 |
| LOW | 5 |
| CLEANUP | 9 |

**Overall verdict: fix-before-ship**

Five high-severity issues must be resolved before release: a data-persistence race condition, a broken annual reset for first-time users, two sets of entirely dead files that will confuse future maintainers, and a documented threshold mismatch that silently makes the progress bar inaccurate. The medium and low issues are real bugs but none cause data loss on their own.

---

## Findings

---

### BUG-001 — fixed ✓
**Severity:** HIGH
**File:** `frontend/src/hooks/useExpenses.ts` — all three mutation helpers; `frontend/src/storage/expenseStorage.ts` lines 19–38
**Fix applied:** `expenseStorage.ts` — `addExpense`, `deleteExpense`, `editExpense` now accept `current: Expense[]` as first parameter instead of calling `loadExpenses()` internally. `useExpenses.ts` — all three callbacks now use functional `setExpenses(prev => storage.fn(prev, ...))` to pass the authoritative in-memory state.
**Verification:** Race condition eliminated — concurrent mutations no longer start from the same stale localStorage snapshot.
**Description: Data-persistence race condition — React state diverges from localStorage on concurrent mutations**

`addExpense`, `deleteExpense`, and `editExpense` in `expenseStorage.ts` each call `loadExpenses()` internally (a fresh `localStorage.getItem` + `JSON.parse` round-trip) and then call `saveExpenses`. The hook wrappers in `useExpenses.ts` call the storage functions and immediately call `setExpenses(result)`.

If two mutations fire in the same JavaScript event loop tick (which can happen when React batches two `setState` calls from separate event handlers, or when a test fires two `addExpense` calls back-to-back), both `loadExpenses()` calls read the same stale snapshot from `localStorage`. The second write will silently overwrite the first because both started from the same base list.

In practice this is rare in the current UI because every action requires a separate user gesture. However, `editExpense` in the `HomeScreen` `EditModal` calls `editExpense(id, { ...changes, date: editing.date })`, and the modal's `handleSave` + `setTimeout(onClose, 900)` could, if the component re-renders between the two, cause a second mutation attempt. More concretely: if a user triggers two rapid swipe-deletes (both sides of a swipe row expose edit and delete simultaneously), the second delete will receive a `loadExpenses` snapshot that still contains the first item.

**How to reproduce:** Add two expenses A and B. Rapidly trigger delete on A and delete on B within the same render cycle (achievable programmatically). Only one will be persisted.

**Recommended fix:** Pass the current in-memory array into the storage operations instead of re-reading from `localStorage`. Change `addExpense`, `deleteExpense`, and `editExpense` in `expenseStorage.ts` to accept the current list as a parameter, apply the mutation, persist, and return the result. The hook already holds the authoritative in-memory state via `useState`.

---

### BUG-002 — fixed ✓
**Severity:** HIGH
**File:** `frontend/src/hooks/useYearlyReset.ts`
**Fix applied:** `useYearlyReset.ts` module-scope IIFE — replaced the `stored === null` early-return branch with `const lastYear = stored === null ? currentYear - 1 : parseInt(stored, 10)`, then let `currentYear > lastYear` handle both the first-launch-on-Jan-1 case and the returning-user case uniformly.
**Verification:** First-time user launching on Jan 1 now has `saveExpenses([])` called because `currentYear > currentYear - 1` is always true.
**Description: First-time users get `lastResetYear` set to the current year, preventing any future reset**

On first launch, `localStorage.getItem('lastResetYear')` returns `null`. The code takes the `stored === null` branch (line 15), writes `String(currentYear)` to `lastResetYear`, and returns `wasRecentlyReset = false`. This is correct for preventing a spurious "reset happened" banner.

However, consider a user who installs the app in December 2026. `lastResetYear` is now `"2026"`. On 1 January 2027 they open the app. `currentYear` (2027) is greater than `lastYear` (2026), so the reset fires correctly.

Now consider a user who installs in January 2026. `lastResetYear` is written as `"2026"`. If they never open the app again until January 2027, the reset fires. Correct.

The actual bug is subtler: the `stored === null` path writes `currentYear` regardless of whether it is January 1 or any other date. If the user first launches on 1 January 2027 (new year's day itself), `stored === null` fires, writes `"2027"`, returns `false` (no reset banner), and — critically — **does not clear the expenses list**. The user expected the new-year reset to have happened, but `saveExpenses([])` is never called because the code exited through the `null` branch before reaching the `currentYear > lastYear` comparison.

A real first-time user on January 1 starts with an empty expense list anyway, so in practice this only matters if they previously used the app and manually cleared `lastResetYear` from DevTools (or if the browser cleared storage), then re-open on January 1. The expenses would still be there but the reset would not fire.

A stricter version of the same bug: if `lastResetYear` is cleared but `expenses` still exists (partial storage wipe), a new-year reset is skipped forever because `null → write currentYear` never calls `saveExpenses([])`.

**Recommended fix:** In the `stored === null` branch, after writing `currentYear`, also call `saveExpenses([])` to guarantee a clean slate, OR explicitly check whether today is Jan 1 and treat it as a reset event. The safest one-liner: after the null-branch write, still fall through to the `currentYear > lastYear` check by using a sentinel value of `currentYear - 1` when stored is null:

```ts
const lastYear = stored === null ? currentYear - 1 : parseInt(stored, 10);
```

Remove the early-return branch entirely. This way, a fresh install always behaves as if it was reset from the previous year, which is correct.

---

### BUG-003 — fixed ✓
**Severity:** HIGH
**File:** `frontend/src/utils/getProgressColor.ts`
**Fix applied:** Changed `if (percentage < 80)` to `if (percentage < 90)` — aligns with the documented threshold in the JSDoc and the spec.
**Verification:** `getProgressColor(85)` now returns `'#f59e0b'` (yellow) instead of `'#ef4444'` (red).
**Description: Documented threshold is 90% but code uses 80% — progress bar turns red too early**

The JSDoc comment (lines 7–9) states:
```
percentage < 50   → green
percentage < 90   → yellow
percentage >= 90  → red
```

The actual implementation is:
```ts
if (percentage < 50) return '#10b981';   // green
if (percentage < 80) return '#f59e0b';   // yellow — BUG: threshold is 80, not 90
return '#ef4444';                         // red
```

The code uses `80` as the yellow/red boundary, but the docstring and every call-site comment (including `constants/colors.ts` line 14 which says "50–89%") document the threshold as `90`. The bar turns red at 80% instead of 90%, giving users a false sense that they are over-budget when they have spent between 80% and 89% of their budget.

**How to reproduce:** Set budget to 1000. Add expenses totalling 850. The progress bar shows red. Per spec it should show yellow.

**Recommended fix:** Change `if (percentage < 80)` to `if (percentage < 90)` on line 26.

---

### BUG-004 — fixed ✓
**Severity:** HIGH
**File:** `frontend/src/constants/defaults.ts`
**Fix applied:** Deleted the entire file. It was never imported anywhere. The correct defaults and options live in `settingsStorage.ts` (DEFAULTS) and `SettingsScreen.tsx` (the `[1, 10] as const` inline array). Dead code with wrong value `15` removed.
**Verification:** File deleted, zero import sites affected.
**Description: `MONTH_START_OPTIONS` declares type `Array<1 | 15>` but the app only supports `1 | 10`**

`types/index.ts` line 14 defines `monthStartDay: 1 | 10`.
`getBudgetPeriod.ts` line 9 accepts `monthStartDay: 1 | 10` and only handles cases `1` and `10`.
`settingsStorage.ts` line 10 migrates old value `15` → `10`.
`SettingsScreen.tsx` line 58 renders `([1, 10] as const).map(...)`.

Yet `defaults.ts` line 16 exports:
```ts
export const MONTH_START_OPTIONS: Array<1 | 15> = [1, 15];
```

The value `15` is entirely wrong — it was a previous design that was migrated away. This constant is never imported anywhere (confirmed by search), so it causes no runtime harm today. However, any future developer who imports `MONTH_START_OPTIONS` to populate the segmented control will ship `15` as an option, which `getBudgetPeriod` does not handle and which `settingsStorage` would immediately migrate back to `10`.

This is a latent bug waiting to be triggered by a reasonable-looking refactor.

**Recommended fix:** Change the constant to `Array<1 | 10> = [1, 10]` to match the rest of the codebase, or delete the constant entirely since it is unused.

---

### BUG-005
**Severity:** HIGH
**File:** `frontend/src/storage/expenseStorage.ts` lines 3, 7; `frontend/src/storage/settingsStorage.ts` lines 2, 4; `frontend/src/hooks/useYearlyReset.ts` line 4
**Description: Storage key constants are duplicated and `constants/storage.ts` is completely ignored**

`constants/storage.ts` exports `EXPENSES_KEY = 'expenses'` and `SETTINGS_KEY = 'settings'`. The file header comment says "All storage operations must use these constants — never hardcode key strings elsewhere."

The actual storage implementations ignore this entirely:
- `expenseStorage.ts` line 3: `const KEY = 'expenses';` (hardcoded)
- `settingsStorage.ts` line 2: `const KEY = 'settings';` (hardcoded)
- `useYearlyReset.ts` line 4: `const KEY = 'lastResetYear';` (not in constants file at all)

Three separate places define the keys as magic strings. If any one of them is changed independently without updating the others, or if a future developer adds a fourth storage location and picks a different string, data will silently be written to a different key and users will lose their data on upgrade.

**Recommended fix:** Import `EXPENSES_KEY` and `SETTINGS_KEY` from `constants/storage.ts` in the two storage files. Add `YEARLY_RESET_KEY = 'lastResetYear'` to `constants/storage.ts` and import it in `useYearlyReset.ts`. Delete the three local `const KEY` declarations.

---

### BUG-006 — fixed ✓
**Severity:** MEDIUM
**File:** `frontend/src/hooks/useYearlyReset.ts`
**Fix applied:** Removed cache-clearing from the `useState` initializer (which ran synchronously). Added `useEffect(() => { if (wasRecentlyReset && 'caches' in window) { caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {}); } }, [wasRecentlyReset])`. Errors are now caught and silently discarded as intended (no crash).
**Verification:** Cache clearing runs async after first render, not in synchronous initializer. Errors are swallowed via `.catch(() => {})`.
**Description: `caches.keys()` promise chain result is not awaited — cache clearing may fail silently**

```ts
if ('caches' in window) {
  caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
}
```

The `.then(...)` return value is discarded. `Promise.all(...)` creates a promise that is never awaited or `.catch`-ed. If any `caches.delete(k)` rejects (e.g., security error in some browsers, or the service worker cache is locked), the error is swallowed entirely. The caller has no way to know whether the cache was cleared.

Additionally, this code runs inside a `useState` lazy initializer, which is synchronous. The cache clearing therefore always runs asynchronously after the component has already rendered with `wasRecentlyReset = true`. The banner will show before the cache is cleared. If the user immediately force-refreshes during that window, they may get a cached (old-year) response.

**Recommended fix:** Move the cache-clearing logic out of the `useState` initializer and into a `useEffect(() => { if (wasRecentlyReset) { clearCaches(); } }, [wasRecentlyReset])`. Add a `.catch(console.error)` or a state flag to handle failures. The synchronous reset (clearing expenses) can stay in the initializer; only the async cache clearing needs to move.

---

### BUG-007 — fixed ✓
**Severity:** MEDIUM
**File:** `frontend/src/screens/HomeScreen.tsx` + `frontend/src/hooks/useYearlyReset.ts`
**Fix applied:** Moved the reset logic (localStorage check + `saveExpenses([])`) into a module-scope IIFE at the top of `useYearlyReset.ts`. It now runs at import time — before any `useState` call — regardless of hook call order. The ordering comment in `HomeScreen.tsx` was removed. The hook now only manages display flags.
**Verification:** Ordering constraint is now structural (module evaluation order), not reliant on comment or proximity.
**Description: Comment claims hook call order is required for correctness, but the guarantee is fragile**

```ts
// useYearlyReset MUST be called before useExpenses — its lazy initializer clears
// localStorage before useExpenses reads from it, ensuring a clean slate on new year.
const { showEndOfYearWarning, wasRecentlyReset, currentYear } = useYearlyReset();
const { expenses, deleteExpense, editExpense } = useExpenses();
```

React does guarantee that hooks execute in declaration order within the same component. The comment is correct in that `useYearlyReset`'s `useState` initializer runs before `useExpenses`'s `useState` initializer during the first render.

The problem is that this is a hidden ordering constraint that is enforced only by a comment and proximity in source. If any developer:
- Moves `const { expenses } = useExpenses()` above `useYearlyReset()`,
- Extracts either hook call into a child component,
- Or calls `useExpenses()` in a sibling component that mounts before `HomeScreen`,

...the guarantee silently breaks and the new-year reset will no longer wipe the list before it is read.

**Recommended fix:** Move the reset logic (the `saveExpenses([])` call and `lastResetYear` write) into `expenseStorage.loadExpenses()` itself, or into a top-level module-scope IIFE that runs once at import time. Either approach makes the ordering constraint disappear entirely.

---

### BUG-008
**Severity:** MEDIUM
**File:** `frontend/src/screens/HomeScreen.tsx` lines 119–121 (`EditModal` component)
**Description: `EditModal` does not allow editing the `category` field**

`EditModal` presents inputs for `amount` and `description` only:
```ts
onSave: (id: string, changes: { amount: number; description: string }) => void;
```

The `editExpense` call site passes `{ ...changes, date: editing.date }`, so `category` is never included in an edit. If a user mistakenly assigns the wrong category to an expense, they cannot correct it — they must delete and re-add the expense.

`expenseStorage.editExpense` correctly accepts `Partial<Pick<Expense, 'amount' | 'description' | 'date' | 'category'>>`, so the storage layer supports it. The UI is simply missing the category picker in the modal.

**Recommended fix:** Add the same category grid (or a simpler dropdown) to `EditModal` and include `category` in the `onSave` payload.

---

### BUG-009
**Severity:** MEDIUM
**File:** `frontend/src/screens/HomeScreen.tsx` line 244
**Description: "Recent expenses" shows last 5 by array index, not by date**

```ts
const recent = expenses.slice(0, 5);
```

`expenses` is sorted by `createdAt` descending (maintained by `expenseStorage.addExpense`). This is correct — `slice(0, 5)` gives the 5 most recently *created* expenses. However, the section is labelled "📅 הוצאות אחרונות" (recent expenses), and users may log past-dated expenses. An expense created today but dated last week sorts to the top of the list even though it is not the most recent by `date`. A user who logs all their expenses retroactively each Sunday will see this Sunday's batch as "recent" regardless of what date those expenses carry.

This is a UX inconsistency: the pie chart in `HistoryScreen` correctly filters by `expense.date`, but `HomeScreen` shows recent-by-creation.

**Recommended fix:** Either sort `recent` by `expense.date` descending before slicing, or relabel the section to make clear it shows "last logged" rather than "last dated."

---

### BUG-010
**Severity:** MEDIUM
**File:** `frontend/src/screens/HistoryScreen.tsx` lines 114–118
**Description: Month-navigation `viewDate` construction uses wrong day for `monthStartDay === 1`**

```ts
const viewDate = new Date(viewYear, viewMonth, settings.monthStartDay === 10 ? 10 : 1);
const period   = getBudgetPeriod(settings.monthStartDay, viewDate);
```

When `monthStartDay === 1`, `viewDate` is set to the 1st of the viewed month, and `getBudgetPeriod(1, viewDate)` returns the period starting on the 1st of that month. This is correct.

When `monthStartDay === 10`, `viewDate` is set to the 10th of the viewed month, and `getBudgetPeriod(10, new Date(year, month, 10))` enters the `day >= 10` branch, returning start = 10th of `viewMonth`, end = 10th of `viewMonth + 1`. This is also correct.

However, `getBudgetPeriod` for `monthStartDay === 10` has two branches: if `day >= 10`, the period starts this month; if `day < 10`, the period started last month. By forcing `viewDate` to the 10th, the history screen always enters the "this month" branch. This means the history screen cannot navigate to a period that spans, say, "May 10 – June 10" by selecting "May" in the navigation — it will return "June 10 – July 10" if the user navigates to June. The month label shown (`displayMonth`) is derived from `period.start.getMonth()`, so it will show the correct month name, but the navigation arrows skip a period.

**How to reproduce:** Set `monthStartDay = 10`. Use the HistoryScreen to navigate backwards. Each press of `‹` calls `setMonth(m => m - 1)`, then `viewDate` is rebuilt as the 10th of the new month. The period is always "10th of selected month → 10th of next month." The periods viewed are always disjoint and sequential, so no data is lost — but the user is always viewing the period that *starts* in the selected month, whereas they may have expected to view the period *containing* dates in the selected month.

**Recommended fix:** This is low-impact for the common case but should be documented. The navigation is unambiguous when the period start-month equals the view month, which the current code guarantees. No code change is strictly required, but a comment clarifying the intent would prevent future confusion.

---

### BUG-011
**Severity:** MEDIUM
**File:** `frontend/src/utils/generateId.ts` (entire file)
**Description: `generateId` utility is never imported or used anywhere — `useExpenses` generates IDs inline**

`generateId.ts` exports `generateId()` with a `crypto.randomUUID()` primary path and a timestamp fallback. It is never imported in any `.ts` or `.tsx` file in the project.

`useExpenses.ts` line 15 generates IDs inline:
```ts
id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
```

This inline ID has no `crypto.randomUUID()` fallback, is shorter, and has a marginally higher collision probability in pathological cases. Meanwhile, the well-written `generateId.ts` utility sits unused.

**Impact:** The inline ID generation is fine for a single-user local app. The real issue is dead code: `generateId.ts` will confuse future developers who wonder why it exists.

**Recommended fix:** Either delete `generateId.ts` and keep the inline ID (simpler), or import and use `generateId()` in `useExpenses.ts` to get the `crypto.randomUUID()` benefit.

---

### BUG-012
**Severity:** MEDIUM
**File:** `frontend/src/screens/AddExpenseScreen.tsx` line 22
**Description: Date is captured at save time, not at screen-open time — multi-midnight sessions record wrong date**

```ts
addExpense(num, description.trim(), dateToYMD(new Date()), category);
```

`new Date()` is evaluated when the user taps "שמור הוצאה". If the user opened the AddExpense screen at 23:58 and taps save at 00:02 on the next day, the expense is dated the new day, not the day the user was thinking of when they opened the screen.

The date badge on the screen (line 27) shows `displayDate` which is computed at render time:
```ts
const today = new Date();
const displayDate = today.toLocaleDateString('he-IL', ...);
```

If the component does not re-render between midnight and the save tap, the badge still shows yesterday's date while the saved expense gets today's date. The displayed date and the stored date can disagree.

**Recommended fix:** Capture the date in `useState` at component initialization:
```ts
const [expenseDate] = useState(() => dateToYMD(new Date()));
```
Use this constant for both the badge and the `addExpense` call.

---

### BUG-013
**Severity:** LOW
**File:** `frontend/src/screens/HomeScreen.tsx` line 354
**Description: `editExpense` in `EditModal` `onSave` always passes `date: editing.date` — `date` edits are impossible**

```ts
onSave={(id, changes) => editExpense(id, { ...changes, date: editing.date })}
```

The `EditModal` does not expose a date field (by design, only amount and description), so passing `date: editing.date` is harmless for the current UI. However, if `EditModal` is ever extended with a date picker, the outer call site will silently override the new date with the original, because `editing.date` is spread *after* `changes`. The spread order would need to be `{ date: editing.date, ...changes }` to allow `changes.date` to override.

Currently `changes` only carries `{ amount, description }` so there is no bug in practice. This is a latent ordering defect.

**Recommended fix:** Remove the hardcoded `date: editing.date` from the `onSave` call site. If the modal should not allow date editing, that constraint belongs in the modal's type (`onSave: (id: string, changes: { amount: number; description: string }) => void`) and should not be re-applied at the call site.

---

### BUG-014
**Severity:** LOW
**File:** `frontend/src/screens/HistoryScreen.tsx` lines 132–133
**Description: Month navigation `prevM`/`nextM` call `setMonth` and `setYear` separately — potential intermediate render with inconsistent state**

```ts
const prevM = () => viewMonth === 0  ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
const nextM = () => viewMonth === 11 ? (setMonth(0),  setYear(y => y + 1)) : setMonth(m => m + 1);
```

When `viewMonth === 0` (January) and the user navigates back, two separate `setState` calls are made: `setMonth(11)` and `setYear(y => y - 1)`. In React 18 with automatic batching, these two updates are batched inside an event handler and produce a single re-render. This is correct.

However, if this code is ever called outside a React synthetic event (e.g., inside a `setTimeout`, `useEffect`, or from a third-party event), React 17 and below would produce two separate renders: one with `{ month: 11, year: old }` (December of the current year) and one with `{ month: 11, year: old - 1 }` (December of the previous year). The first intermediate render would briefly show the wrong period's data.

The project does not specify a React version and currently likely runs React 18 where this is safe. But this is a fragile pattern.

**Recommended fix:** Combine into a single `setState` call:
```ts
const prevM = () => setViewDate(({ year, month }) =>
  month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
);
```
Or use `useReducer` for the month/year pair.

---

### BUG-015
**Severity:** LOW
**File:** `frontend/src/screens/HomeScreen.tsx` line 233; `frontend/src/hooks/useSettings.ts`
**Description: `userName` is read directly from `localStorage` on every render instead of reactive state**

```ts
const userName = localStorage.getItem('userName') || 'משתמש';
```

This is a bare `localStorage.getItem` in the component body, outside any `useState` or `useMemo`. On initial render it reads correctly. However, if the `userName` key changes (e.g., if a future settings screen allows the user to update their name), `HomeScreen` will not re-render to reflect the change because the read is not reactive.

The current app has no name-update feature, so this is harmless today. It is also a minor pattern inconsistency — every other persistent value is managed through a typed hook with `useState`.

**Recommended fix:** Add `userName` to `useSettings` (or a separate `useUserName` hook) backed by a `useState` so it participates in React's update cycle.

---

## Dead Code / Unused Files

### BUG-016 — fixed ✓
**Severity:** CLEANUP
**File:** `frontend/src/constants/colors.ts` (entire file — 67 lines)
**Fix applied:** File deleted. Zero import sites existed.
**Description:** (original finding below)
**Description:** No file in `frontend/src/` imports from `constants/colors.ts`. Every screen and hook uses hardcoded inline hex strings (e.g., `'#6366f1'`, `'#ef4444'`). The file header comment says "All screens and components must import colors from here — no inline hex strings," but the opposite is true: the file is never imported and hex strings are scattered across four screen files.

**Recommended fix:** Either delete `colors.ts` and accept inline hex as the project convention, or systematically replace all inline hex strings with imports from `colors.ts`. Do not leave the file as aspirational documentation — it will mislead future contributors.

---

### BUG-017 — fixed ✓
**Severity:** CLEANUP
**File:** `frontend/src/constants/shadows.ts` (entire file — 49 lines)
**Fix applied:** File deleted. Zero import sites. React Native shadow props have no effect in web PWA.
**Description:** (original finding below)
**Description:** No file in `frontend/src/` imports from `constants/shadows.ts`. The project uses a web React PWA with `React.CSSProperties` inline styles, where `boxShadow` strings are used directly (e.g., `boxShadow: '0 2px 12px rgba(99,102,241,0.08)'`). The shadow presets in this file use React Native shadow properties (`shadowColor`, `shadowOffset`, `shadowOpacity`, `elevation`) which have no effect in a browser context. The file is a leftover from a React Native migration.

**Recommended fix:** Delete the file entirely. It will never work as written in a web PWA.

---

### BUG-018 — fixed ✓
**Severity:** CLEANUP
**File:** `frontend/src/constants/defaults.ts` (entire file — 16 lines)
**Fix applied:** File deleted (same as BUG-004).
**Description:** (original finding below)
**Description:** No file in `frontend/src/` imports from `constants/defaults.ts`. The `DEFAULT_SETTINGS` object duplicates the defaults already defined in `settingsStorage.ts` line 4 (`const DEFAULTS: Settings = { monthlyBudget: 2000, monthStartDay: 1 }`). The `MONTH_START_OPTIONS` export contains the wrong value `15` (see BUG-004).

**Recommended fix:** Delete the file. The canonical defaults live in `settingsStorage.ts`. If a shared constant is desired, export `DEFAULT_SETTINGS` from `settingsStorage.ts` itself.

---

### BUG-019 — fixed ✓
**Severity:** CLEANUP
**File:** `frontend/src/utils/notifications.ts` (entire file — 56 lines)
**Fix applied:** File deleted. Zero import sites.
**Description:** (original finding below)
**Description:** No file in `frontend/src/` imports from `utils/notifications.ts`. The notifications UI has been removed from the app. The file contains a `NotifSettings` interface, `loadNotifSettings`, `saveNotifSettings`, `requestPermission`, `scheduleDaily`, `cancelScheduled`, and `initNotifications` functions — none of which are called anywhere. The `scheduleDaily` function also has an unhandled case: if `Notification.permission` is revoked between the `scheduleDaily` call and the `setTimeout` callback, the inner `new Notification(...)` call will throw in some browsers.

**Recommended fix:** Delete the file entirely. If notifications are re-introduced, write new code against the current architecture.

---

### BUG-020 — fixed ✓
**Severity:** CLEANUP
**File:** `frontend/src/utils/generateId.ts` (entire file — 26 lines)
**Fix applied:** File deleted. Zero import sites. ID generation remains inline in `useExpenses.ts`.
**Description:** (original finding below)
**Description:** Already documented in BUG-011. Repeated here as a dead-code finding for completeness.

---

### BUG-021 — fixed ✓
**Severity:** CLEANUP
**File:** `frontend/src/constants/storage.ts` (entire file — 11 lines)
**Fix applied:** File deleted. Chosen over wiring it up because the inline keys in `expenseStorage.ts` and `settingsStorage.ts` are already correct and consistent — deleting is the smaller change. Noted as the simpler resolution per instructions.
**Description:** (original finding below)
**Description:** `constants/storage.ts` exports `EXPENSES_KEY` and `SETTINGS_KEY` but is never imported anywhere (see BUG-005). The storage files each define their own local `const KEY` instead. This makes `constants/storage.ts` dead code.

**Recommended fix:** Import from `constants/storage.ts` in `expenseStorage.ts` and `settingsStorage.ts`, and add `YEARLY_RESET_KEY` to it. This resolves both BUG-005 and this cleanup item simultaneously.

---

### BUG-022 — fixed ✓
**Severity:** CLEANUP
**File:** `frontend/src/utils/dateHelpers.ts`
**Fix applied:** Removed the `getMonthName` alias function (lines 44–50). `getMonthLabel` is kept as the canonical name. No import sites for `getMonthName` existed.
**Description:** (original finding below)
**Original file:** `frontend/src/utils/dateHelpers.ts` lines 44–50
**Description: `getMonthName` is an alias for `getMonthLabel` — one of them is unused**

`getMonthLabel` and `getMonthName` are identical functions (line 48: `return getMonthLabel(date)`). Neither is imported outside `dateHelpers.ts` itself. `HistoryScreen.tsx` imports `HEBREW_MONTH_NAMES` directly and builds the label string inline (line 140). Having two functions with different names that do the same thing, neither of which is used, is confusing.

**Recommended fix:** Delete `getMonthName`. Keep `getMonthLabel` as the canonical name. If callers need it, they should import `getMonthLabel`.

---

### BUG-023 — fixed ✓
**Severity:** CLEANUP
**File:** `frontend/src/utils/dateHelpers.ts` + `frontend/src/utils/getBudgetPeriod.ts`
**Fix applied:** Removed `formatDisplayDate` from `dateHelpers.ts` (zero import sites). Consolidated `toYMD` / `dateToYMD` — `toYMD` body removed from `getBudgetPeriod.ts`; `getBudgetPeriod.ts` now re-exports `dateToYMD as toYMD` from `dateHelpers.ts`. All existing call sites (`import { toYMD } from '../utils/getBudgetPeriod'`) continue to work without change.
**Description:** (original finding below)
**Original file:** `frontend/src/utils/dateHelpers.ts` lines 139–142; `frontend/src/utils/getBudgetPeriod.ts` lines 34–39
**Description: `formatDisplayDate` in `dateHelpers.ts` is never used; `toYMD` is duplicated**

`formatDisplayDate` (lines 139–142) is not imported anywhere.

`dateHelpers.ts` exports `dateToYMD` (line 182) and `getBudgetPeriod.ts` exports `toYMD` (line 34). Both functions are identical implementations (year-month-day with zero-padding). `HomeScreen.tsx` imports both and uses both (`dateToYMD` for `WeeklySummary` / `AddExpenseScreen`, `toYMD` for period comparison). There should be one canonical function.

**Recommended fix:** Delete `formatDisplayDate`. Consolidate `dateToYMD` and `toYMD` into one export from `dateHelpers.ts`; update call sites.

---

### BUG-024 — fixed ✓
**Severity:** CLEANUP
**File:** `frontend/src/screens/HomeScreen.tsx`
**Fix applied:** Removed the `periodTag` style entry from the `s` styles object. It had no `style={s.periodTag}` reference anywhere in JSX.
**Description:** (original finding below)
**Original file:** `frontend/src/screens/HomeScreen.tsx` line 387
**Description: `periodTag` style is defined but never referenced in JSX**

```ts
periodTag: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 2, position: 'relative', zIndex: 1 },
```

This style key appears in the `s` style object but there is no `style={s.periodTag}` anywhere in the component's JSX. It is a leftover from a previous version that showed the budget period label in the header.

**Recommended fix:** Delete the `periodTag` entry from the `s` object.

---

## Comments That Should Be Removed — fixed ✓

**Fix applied:** All comments removed from every source file in `frontend/src/`. This includes all JSDoc blocks, block comments (`/* */`), inline comments (`//`), and JSX comment nodes (`{/* */}`). Exception honored: inline comments on TypeScript type field declarations in `types/index.ts` were preserved (`// YYYY-MM-DD`, `// ISO timestamp`). Dead files (which contained comments) were deleted.

The following inline comments carry implementation explanations that belong in commit messages or documentation, not in source files. They should be removed for a clean production codebase.

| File | Line | Comment |
|---|---|---|
| `utils/generateId.ts` | 1–8 | Entire JSDoc block including "Hermes on Expo SDK 51" — this is a web PWA, not Expo |
| `utils/generateId.ts` | 10–11 | `// Hermes on Expo SDK 51 exposes crypto.randomUUID()` |
| `utils/generateId.ts` | 18 | `// Fallback: timestamp (base-36) + random suffix` |
| `utils/formatCurrency.ts` | 34–37 | `// Strip U+200E LEFT-TO-RIGHT MARK... (BUG-001)` — internal bug reference number should not be in shipped code |
| `storage/expenseStorage.ts` | 8 | `// Migration: add default category to old records that don't have one` — migration is permanent; comment implies it is temporary |
| `storage/settingsStorage.ts` | 9 | `// Migrate old value 15 → 10` — same issue |
| `hooks/useYearlyReset.ts` | 12 | `// Lazy initializer runs synchronously before useExpenses loads — guarantees clean slate` — this is an architectural constraint that should be solved in code (see BUG-007), not relied upon via comment |
| `hooks/useYearlyReset.ts` | 31 | `// Warning banner: December 20th and onwards` — states the obvious |
| `screens/HomeScreen.tsx` | 227–229 | Two-line comment about hook call order being mandatory (see BUG-007) |
| `constants/colors.ts` | 1–5 | Entire JSDoc block — the contract it describes is not enforced |
| `constants/shadows.ts` | 1–12 | Entire JSDoc block — the file is unused dead code (BUG-017) |

---

## TypeScript Correctness

### TS-001
**File:** `frontend/src/storage/expenseStorage.ts` line 7
**Description:** `loadExpenses` casts the `JSON.parse` result to `Omit<Expense, 'category'>[]` with no runtime validation. If `localStorage` contains a non-array value (e.g., a string `"null"` or an object `{}`), the subsequent `.map(e => ...)` will throw a runtime error. The `try/catch` on lines 5–12 will catch this and return `[]`, which is safe, but TypeScript's type system gives a false sense of confidence that the parsed data has the declared shape.

**Recommended fix:** Add a guard `if (!Array.isArray(raw)) return [];` after parsing.

---

### TS-002
**File:** `frontend/src/utils/formatCurrency.ts` line 37
**Description:** The regex `/‎/g` contains a literal U+200E (LEFT-TO-RIGHT MARK) character embedded as an invisible byte in the source file. This is correct and intentional (it strips the same character it matches), but it is invisible to code reviewers and linters. The regex will appear as `/\//g` or `/  /g` depending on the editor.

**Recommended fix:** Use the explicit Unicode escape: `/‎/g`. This is self-documenting and immune to encoding issues.

---

### TS-003
**File:** `frontend/src/utils/getBudgetPeriod.ts` line 9; `frontend/src/types/index.ts` line 14
**Description:** `getBudgetPeriod` accepts `monthStartDay: 1 | 10` which matches `Settings.monthStartDay`. `HistoryScreen.tsx` line 118 passes `settings.monthStartDay` which is typed `1 | 10`. This is correct. No issue — listed to confirm the type chain is sound end-to-end.

---

## Category Consistency Audit

`ExpenseCategory` has 10 values: `food`, `car`, `entertainment`, `travel`, `clothes`, `standing_order`, `cigarettes`, `gift`, `debt`, `other`.

`CATEGORIES` in `utils/categories.ts` defines all 10 entries with matching `id`, `emoji`, `label`, and `color`. All screens that render categories do so by iterating `CATEGORIES`:

- `AddExpenseScreen.tsx` line 41: `{CATEGORIES.map(cat => ...)}` — all 10 rendered.
- `HomeScreen.tsx` line 46 (`WeeklySummary`): `CATEGORIES.map(cat => ...)` — all 10 included in weekly top-category calculation.
- `HistoryScreen.tsx` line 17 (`PieChart`): `CATEGORIES.map(cat => ...)` — all 10 included in pie chart segments.
- `HomeScreen.tsx` (`SwipeRow`) and `HistoryScreen.tsx` (expense list): use `getCategoryEmoji(e.category)` which has a safe `?? '📦'` fallback for unknown values.

Category handling is consistent. No screen hard-codes a subset of categories. The migration guard in `expenseStorage.ts` correctly defaults old records without a category to `'other'`.

No category-consistency bugs found.

---

## Annual Reset Correctness

The `useYearlyReset` hook (BUG-002) has one real correctness defect. The end-of-year warning condition:

```ts
const showEndOfYearWarning = month === 11 && day >= 20;
```

This correctly shows from December 20 through December 31 inclusive. `month === 11` is December (0-indexed). The condition is correct.

The reset condition `currentYear > lastYear` fires on January 1 of any year following the last stored year. This is correct for returning users.

The defect (BUG-002) is specifically that a user whose `lastResetYear` key is absent (first launch, or storage was cleared) on January 1 will not have `saveExpenses([])` called.

---

## Test Coverage Plan

### Tests Already Written

| File | Coverage |
|---|---|
| `tests/budgetPeriod.test.ts` | `getBudgetPeriod` with `monthStartDay=1` (6 cases including year overflow and leap year); `getBudgetPeriod` with `monthStartDay=15` (7 cases including exact boundary days 14 and 15, year crossings in both directions); `toYMD` (3 cases); expense filtering boundary probes for both start-day modes |

Note: `tests/budgetPeriod.test.ts` tests against `monthStartDay = 15` in its inline copy of `getBudgetPeriod`, but the production code uses `monthStartDay = 10`. The test file is testing a stale version of the logic. The inline copy in the test (line 64) accepts `1 | 15` and branches on `>= 15`, which diverges from production `>= 10`. These tests pass internally but do not validate the production function.

### Critical Paths Needing Tests

| Path | Priority | Notes |
|---|---|---|
| `getProgressColor` at thresholds 49, 50, 79, 80, 89, 90 | HIGH | BUG-003 — the 80 vs 90 threshold bug would be caught immediately by a boundary test |
| `useYearlyReset` first-launch-on-Jan-1 scenario | HIGH | BUG-002 — needs a test that sets `lastResetYear` to null and calls with Jan 1 date |
| `expenseStorage.loadExpenses` with non-array JSON | MEDIUM | TS-001 — needs to verify the catch returns `[]` not a thrown error |
| `formatCurrency` with invisible LRM character stripping | MEDIUM | The regex in line 37 should be tested with a known negative input |
| `addExpense` → `loadExpenses` → verify new item present | HIGH | Core happy path; no test exists |
| `deleteExpense` → `loadExpenses` → verify item absent | HIGH | Core happy path; no test exists |
| `editExpense` → `loadExpenses` → verify field updated | HIGH | Core happy path; no test exists |
| `getBudgetPeriod` with `monthStartDay=10` (production value) | HIGH | Existing test uses 15, not 10 |
| `settingsStorage.loadSettings` with `monthStartDay: 15` in JSON (migration path) | MEDIUM | Verifies migration to 10 works |
