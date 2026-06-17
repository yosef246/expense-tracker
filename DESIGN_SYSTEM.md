# DESIGN_SYSTEM.md — Personal Expense Tracker (מעקב הוצאות אישי)

> Hebrew-only · RTL · React Native (Expo SDK 51) · StyleSheet only (no Tailwind/NativeWind)
> All values are implementation-ready. No Tailwind config is generated because ARCHITECTURE.md
> confirms plain React Native `StyleSheet` is the styling system.

---

## 1. Design Direction

The app targets a single Israeli professional who wants zero-friction daily expense logging. The
visual language is **clean, modern, "dark-hero / light-content" personal finance** — think the
aesthetic of Splitwise or the Israeli banking apps (Pepper, Max), but stripped of all
enterprise chrome. A rich deep-blue-to-navy gradient anchors the brand and gives the dashboard
header the weight of a "status" surface (this is the number you live by). Everything below the
header lives on a near-white background with white cards, generous spacing, and restrained colour
accents. Colour is used functionally: green means healthy, amber means watch out, red means
over-budget. There are no decorative illustrations, no confetti, no gradients in body text.
Border radii are generous (16 px on cards, 28 px on the FAB) to match the iOS/Material
"friendly productivity" feel. Typography is a single weight family with clear size jumps between
the hero amount display and body copy. The closest reference is **Splitwise + Pepper Bank** for
hierarchy, and **Linear** for restraint in chrome and whitespace.

Dark mode is out of scope (see ARCHITECTURE.md §14).

---

## 2. Color Palette

All hex values are final. Use these exact tokens in `src/constants/colors.ts`.

### Brand / Gradient

```
gradient-start          #1a1a2e   — deepest navy (top of header gradient)
gradient-mid            #16213e   — dark blue (mid-point, optional stop)
gradient-end            #0f3460   — rich blue (bottom of header gradient, SummaryCard)
```

The LinearGradient for the HomeScreen header and SummaryCard background uses
`['#1a1a2e', '#16213e', '#0f3460']` top-to-bottom (vertical, `start={x:0,y:0} end={x:0,y:1}`).

### Background / Surface

```
bg-page                 #f9fafb   — app background (all screens)
bg-card                 #ffffff   — card surfaces (ExpenseItem, form fields, segmented control)
bg-card-elevated        #ffffff   — same white, differentiated by shadow only
bg-input                #ffffff   — text inputs
bg-section-header       transparent
```

### Text

```
text-primary            #1a1a2e   — headings, amounts, main body
text-secondary          #6b7280   — secondary labels, descriptions
text-muted              #9ca3af   — date/time metadata, placeholders
text-on-dark            #ffffff   — any text rendered on the gradient surfaces
text-on-dark-secondary  rgba(255,255,255,0.70)  — subdued labels on dark gradient
```

### Semantic / Functional

```
progress-green          #10b981   — 0–49% budget utilisation fill
progress-yellow         #f59e0b   — 50–89% budget utilisation fill
progress-red            #ef4444   — 90–100%+ budget utilisation fill
progress-track          #e5e7eb   — empty track background

success                 #10b981
success-bg              #d1fae5

warning                 #f59e0b
warning-bg              #fef9c3

danger                  #ef4444
danger-bg               #fee2e2

amount-positive         #10b981   — expense amounts in ExpenseItem rows
delete-red              #ef4444   — swipe-reveal delete button background
delete-text             #ffffff   — text on delete button
```

### Insights Box

```
insights-bg             #eff6ff   — soft blue panel background
insights-border         #bfdbfe   — 1px border for definition
insights-text           #1d4ed8   — label text and values inside InsightsBox
```

### Segmented Control (SettingsScreen)

```
segment-active-bg       #1a1a2e   — selected option fill
segment-active-text     #ffffff
segment-inactive-bg     #ffffff
segment-inactive-text   #6b7280
segment-border          #e5e7eb
```

### Interactive

```
fab-gradient-start      #2563eb
fab-gradient-end        #1d4ed8
focus-ring              rgba(37,99,235,0.30)   — 3 px spread
divider                 #f3f4f6
border-default          #e5e7eb
border-strong           #d1d5db
```

### Skeleton / Loading

```
skeleton-base           #e5e7eb
skeleton-highlight      #f3f4f6
```

---

## 3. Typography

React Native does not load web fonts by default. Use the **system font stack** with explicit
`fontFamily` only if Expo's `expo-font` is used. For this project, use the device system font
(San Francisco on iOS, Roboto on Android) with explicit `fontWeight` values. This requires zero
font loading and renders correctly for Hebrew text on both platforms.

```
fontFamily: undefined (system default — SF Pro on iOS, Roboto on Android)
```

If the product owner later wants a custom font, `expo-font` + `Heebo` (Google Fonts, supports
Hebrew) is the recommended upgrade path. All font-size and weight values below are compatible
with a Heebo swap.

### Type Scale

| Token          | fontSize | lineHeight | fontWeight | color (default)   | Usage                              |
|----------------|----------|------------|------------|-------------------|------------------------------------|
| hero-amount    | 48       | 56         | '700'      | text-primary      | Budget amount on HomeScreen        |
| screen-title   | 24       | 32         | '700'      | text-primary      | Page titles ("הוספת הוצאה חדשה")   |
| section-header | 18       | 26         | '600'      | text-primary      | "הוצאות אחרונות", card headings    |
| body           | 16       | 24         | '400'      | text-primary      | Expense description, form labels   |
| body-bold      | 16       | 24         | '600'      | text-primary      | Emphasized body, amounts in cards  |
| body-sm        | 14       | 20         | '400'      | text-secondary    | Budget label under hero amount     |
| caption        | 13       | 18         | '400'      | text-muted        | Date + time metadata in rows       |
| caption-bold   | 13       | 18         | '600'      | text-primary      | Badge labels                       |
| amount-hero    | 36       | 44         | '700'      | text-on-dark      | Total spent inside SummaryCard     |
| amount-body    | 16       | 24         | '600'      | amount-positive   | Expense amounts in ExpenseItem     |
| warning-text   | 13       | 18         | '400'      | danger (#ef4444)  | Inline validation messages         |
| on-dark-label  | 14       | 20         | '400'      | text-on-dark-sec  | Subdued labels on gradient cards   |

### Text Alignment

All Hebrew text: `textAlign: 'right'` throughout.
Centred exceptions: MonthNavigator label, percentage utilisation text below ProgressBar,
empty-state placeholder text, and the hero budget amount on HomeScreen.

---

## 4. Spacing and Layout

Spacing scale (multiples of 4):

```
sp-1     4
sp-2     8
sp-3     12
sp-4     16
sp-5     20
sp-6     24
sp-8     32
sp-10    40
sp-12    48
sp-16    64
```

### Layout Constants

```
screen-horizontal-padding    20     Applied as paddingHorizontal on screen root ScrollView/View
screen-vertical-padding-top  16     Below SafeAreaView top inset
card-padding                 16     Internal padding for all card components
card-margin-bottom           12     Gap between stacked cards
section-gap                  24     Vertical gap between major page sections
form-field-gap               16     Gap between label and input, between input rows
header-height                56     Custom header row height (BackHeader, HomeScreen header)
fab-size                     56     Width and height of FAB circle
fab-bottom                   24     Physical bottom offset from safe area
fab-right                    24     Physical right offset from screen edge
progress-bar-height          20     As specified in ARCHITECTURE.md §10
progress-bar-radius          10     Half of height (fully rounded ends)
```

---

## 5. Radii, Shadows, Borders

### Border Radii

```
radius-sm         4     Segmented control active indicator pill, small badges
radius-md         8     Input fields, date selector row
radius-lg         12    InsightsBox, swipe-reveal delete button, small cards
radius-card       16    SummaryCard, main white cards
radius-fab        28    FAB (56/2 = perfect circle)
radius-full       9999  Tags or fully-rounded pills if needed
```

### Shadows

All shadow values are declared in React Native's cross-platform split style — apply BOTH the
iOS block and the Android `elevation` on the same `StyleSheet` object. React Native selects
the correct properties per platform.

#### Card shadow (white cards: ExpenseItem, SummaryCard outer wrapper)

```javascript
// iOS
shadowColor: '#1a1a2e',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.08,
shadowRadius: 8,
// Android
elevation: 3,
```

#### Elevated card shadow (SummaryCard, modals — slightly more lift)

```javascript
// iOS
shadowColor: '#1a1a2e',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.12,
shadowRadius: 12,
// Android
elevation: 6,
```

#### FAB shadow

```javascript
// iOS
shadowColor: '#1d4ed8',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.35,
shadowRadius: 10,
// Android
elevation: 8,
```

#### No-shadow (flat) style

Used for: InsightsBox (background-only differentiation), SegmentedControl.

```javascript
shadowColor: 'transparent',
shadowOffset: { width: 0, height: 0 },
shadowOpacity: 0,
shadowRadius: 0,
elevation: 0,
```

### Borders

```
Input default border:      1px, #e5e7eb  (border-default)
Input focused border:      2px, #2563eb  (brand)
Input error border:        2px, #ef4444  (danger)
Card border:               none (shadow only)
InsightsBox border:        1px, #bfdbfe  (insights-border)
Segmented control border:  1px, #e5e7eb  (border-default), radius-md on outer container
Divider line:              1px, #f3f4f6  (divider), used between ExpenseItem rows
```

---

## 6. Component Styles

All measurements are in density-independent points (dp/pt). React Native uses these directly.

---

### HomeScreen Header Gradient

The top section of HomeScreen — from the top safe-area edge down through the budget amount
display — is a full-width `LinearGradient` from `expo-linear-gradient`.

```javascript
// expo-linear-gradient props
colors={['#1a1a2e', '#16213e', '#0f3460']}
start={{ x: 0, y: 0 }}
end={{ x: 0, y: 1 }}
// Dimensions
width: '100%'
paddingTop: safeAreaInsets.top + 16   // flush against status bar + breathing room
paddingBottom: 24
paddingHorizontal: 20

// Header row inside gradient
flexDirection: 'row'
alignItems: 'center'
justifyContent: 'space-between'
marginBottom: 16

// Budget title text (physical-right, reading-start)
fontSize: 16
fontWeight: '600'
color: 'rgba(255,255,255,0.85)'
textAlign: 'right'

// Hero budget amount below header row
fontSize: 48
fontWeight: '700'
color: '#ffffff'
textAlign: 'center'
letterSpacing: -1   // tight tracking on large numerals
```

---

### ProgressBar

```javascript
// Outer track container
height: 20
borderRadius: 10
backgroundColor: '#e5e7eb'
overflow: 'hidden'   // clips the fill child to rounded corners
width: '100%'

// Fill child (Animated.View)
height: '100%'       // fills track height
borderRadius: 10     // same as track
backgroundColor: color  // '#10b981' | '#f59e0b' | '#ef4444' from getProgressColor()
// width is an Animated.Value, driven by Animated.timing (see §5 Animation)

// Percentage text below bar
fontSize: 14
fontWeight: '600'
color: text-on-dark-secondary  // rgba(255,255,255,0.70) when inside SummaryCard
textAlign: 'center'
marginTop: 6
```

Color thresholds (implemented in `getProgressColor`):

```
percent < 50   → #10b981
percent < 90   → #f59e0b
percent >= 90  → #ef4444
```

---

### SummaryCard

The SummaryCard is a `LinearGradient` rounded card — no white background, the gradient IS
the card background. It uses the same colour stops as the page header gradient.

```javascript
// Gradient card container
colors={['#1e3a5f', '#16213e']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}   // diagonal gradient for visual interest
borderRadius: 16
padding: 20
marginHorizontal: 20
marginBottom: 16
// Shadow (elevated card)
shadowColor: '#1a1a2e'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.20
shadowRadius: 12
elevation: 6

// Total spent label (small, on-dark secondary)
fontSize: 13
fontWeight: '400'
color: 'rgba(255,255,255,0.65)'
textAlign: 'right'
marginBottom: 4

// Total spent amount (hero, on-dark)
fontSize: 36
fontWeight: '700'
color: '#ffffff'
textAlign: 'right'
marginBottom: 12

// Budget label below hero amount
fontSize: 13
fontWeight: '400'
color: 'rgba(255,255,255,0.60)'
textAlign: 'right'
marginBottom: 12

// ProgressBar — rendered inside card, full card content width
marginBottom: 8

// Spent / Remaining row
flexDirection: 'row'
justifyContent: 'space-between'
marginTop: 4
// Each label text:
fontSize: 13
fontWeight: '500'
color: 'rgba(255,255,255,0.80)'
// Remaining text (same style; negative values show minus sign, no special colour change)
```

---

### ExpenseItem

The ExpenseItem renders as a white card. The swipe-to-delete reveals a red panel on the
physical-left (trailing) side by translating the card content via `Animated.Value`.

```javascript
// Outer swipeable container
backgroundColor: '#ef4444'   // delete button colour always behind
borderRadius: 12
marginHorizontal: 20
marginBottom: 8
overflow: 'hidden'

// Delete reveal button (absolutely positioned, physical-left/trailing side)
position: 'absolute'
top: 0, bottom: 0, left: 0
width: 80
backgroundColor: '#ef4444'
justifyContent: 'center'
alignItems: 'center'
// "מחק" label:
fontSize: 14
fontWeight: '700'
color: '#ffffff'

// Card content row (Animated.View that slides)
backgroundColor: '#ffffff'
borderRadius: 12
padding: 14
flexDirection: 'row'
alignItems: 'center'
justifyContent: 'space-between'
// Card shadow
shadowColor: '#1a1a2e'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.07
shadowRadius: 6
elevation: 2

// Date + time cluster (physical-right, reading-start)
fontSize: 13
fontWeight: '400'
color: '#9ca3af'
textAlign: 'right'
// Sub-label line-height gives breathing room between date and any wrapping

// Description text (centre / flex-1)
fontSize: 16
fontWeight: '500'
color: '#1a1a2e'
textAlign: 'right'
flex: 1
marginHorizontal: 12

// Amount (physical-left, trailing)
fontSize: 16
fontWeight: '600'
color: '#10b981'
textAlign: 'left'   // physical left — the amount anchors to the trailing edge in RTL
```

---

### MonthNavigator

```javascript
// Container row
flexDirection: 'row'
alignItems: 'center'
justifyContent: 'space-between'
paddingHorizontal: 20
paddingVertical: 12
backgroundColor: '#ffffff'
borderBottomWidth: 1
borderBottomColor: '#f3f4f6'

// Arrow buttons (both "›" and "‹")
width: 44
height: 44
justifyContent: 'center'
alignItems: 'center'
borderRadius: 22          // circle hit area
backgroundColor: 'transparent'
// Icon: Ionicons "chevron-forward" or "chevron-back" at 22px
// Apply transform: [{ scaleX: -1 }] as needed for RTL direction logic (see ARCHITECTURE.md §8)

// Arrow icon style
fontSize: 22             // Ionicons size
color: '#1a1a2e'

// Label text (centred)
fontSize: 18
fontWeight: '600'
color: '#1a1a2e'
textAlign: 'center'
flex: 1
```

---

### InsightsBox

```javascript
// Container
backgroundColor: '#eff6ff'
borderWidth: 1
borderColor: '#bfdbfe'
borderRadius: 12
padding: 16
marginHorizontal: 20
marginTop: 8
marginBottom: 24

// Line 1 — largest expense
fontSize: 14
fontWeight: '500'
color: '#1d4ed8'
textAlign: 'right'
marginBottom: 6

// Line 2 — daily average
fontSize: 14
fontWeight: '400'
color: '#1d4ed8'
textAlign: 'right'

// Empty state (single line, no largestExpense)
fontSize: 14
fontWeight: '400'
color: '#6b7280'
textAlign: 'center'
```

---

### BackHeader

Used on AddExpenseScreen, SettingsScreen, HistoryScreen.

```javascript
// Container row
flexDirection: 'row'
alignItems: 'center'
height: 56
paddingHorizontal: 20
backgroundColor: '#f9fafb'   // matches page background; no border

// Back button (physical-right = reading-start in RTL)
flexDirection: 'row'
alignItems: 'center'
minWidth: 44
minHeight: 44
justifyContent: 'center'
paddingEnd: 8

// "→" arrow icon (Ionicons "arrow-forward" at 20px, or text glyph)
// In RTL: arrow-forward points physically right = visually "go back to start"
// No transform needed when using arrow-forward glyph in RTL context
fontSize: 20   // if using Ionicons
color: '#2563eb'

// "חזרה" label next to arrow
fontSize: 16
fontWeight: '600'
color: '#2563eb'
textAlign: 'right'
marginStart: 4   // gap between icon and text

// Screen title (remaining space, right-aligned or centred)
flex: 1
fontSize: 20
fontWeight: '700'
color: '#1a1a2e'
textAlign: 'center'
paddingEnd: 64   // compensates for back button width to keep title truly centred
```

---

### AmountInput

The large centred amount entry used in AddExpenseScreen.

```javascript
// Input section wrapper
alignItems: 'center'
paddingVertical: 32
paddingHorizontal: 20

// Row containing "₪" prefix and the TextInput
flexDirection: 'row'
alignItems: 'center'
justifyContent: 'center'

// "₪" static prefix text (physical-left of the input in RTL layout)
fontSize: 28
fontWeight: '700'
color: '#9ca3af'
marginEnd: 8

// TextInput
fontSize: 48
fontWeight: '700'
color: '#1a1a2e'
textAlign: 'center'
minWidth: 120
borderBottomWidth: 2
borderBottomColor: '#e5e7eb'
paddingVertical: 4
// focused border: borderBottomColor '#2563eb'
// error border:   borderBottomColor '#ef4444'
// keyboardType: 'numeric'
// autoFocus: true

// Inline warning text (below the row)
fontSize: 13
fontWeight: '400'
color: '#ef4444'
textAlign: 'center'
marginTop: 8
// visibility: conditional on showWarning prop
```

The description TextInput (standard, below the amount section):

```javascript
// Label above field
fontSize: 14
fontWeight: '500'
color: '#6b7280'
textAlign: 'right'
marginBottom: 6

// Input
backgroundColor: '#ffffff'
borderWidth: 1
borderColor: '#e5e7eb'
borderRadius: 8
paddingHorizontal: 14
paddingVertical: 12
fontSize: 16
fontWeight: '400'
color: '#1a1a2e'
textAlign: 'right'
// focused: borderColor '#2563eb', borderWidth 2
```

---

### DateSelector

```javascript
// Label
fontSize: 14
fontWeight: '500'
color: '#6b7280'
textAlign: 'right'
marginBottom: 6

// Tappable row
flexDirection: 'row'
alignItems: 'center'
justifyContent: 'space-between'
backgroundColor: '#ffffff'
borderWidth: 1
borderColor: '#e5e7eb'
borderRadius: 8
paddingHorizontal: 14
paddingVertical: 12
// pressed state: backgroundColor '#f9fafb'

// Date display text (physical-right, reading-start)
fontSize: 16
fontWeight: '400'
color: '#1a1a2e'
textAlign: 'right'
flex: 1

// Calendar icon (physical-left, trailing)
// Ionicons "calendar-outline" at 20px, color '#9ca3af'
marginStart: 8
```

The native OS date picker (DateTimePicker from `@react-native-community/datetimepicker`) is not
styled. It uses the OS-provided chrome (iOS bottom sheet spinner, Android calendar dialog).

---

### SegmentedControl (SettingsScreen — month-start day picker)

```javascript
// Outer container
flexDirection: 'row'
borderRadius: 8
borderWidth: 1
borderColor: '#e5e7eb'
backgroundColor: '#ffffff'
overflow: 'hidden'
marginTop: 8

// Each segment (two equal-width Pressable buttons)
flex: 1
paddingVertical: 12
alignItems: 'center'
justifyContent: 'center'

// Active segment
backgroundColor: '#1a1a2e'
// Active text
fontSize: 15
fontWeight: '600'
color: '#ffffff'

// Inactive segment
backgroundColor: '#ffffff'
// Inactive text
fontSize: 15
fontWeight: '400'
color: '#6b7280'

// Divider between segments
borderStartWidth: 1
borderStartColor: '#e5e7eb'
// Applied to the second (left) segment only
```

---

### FAB (Floating Action Button)

```javascript
// Absolute position
position: 'absolute'
bottom: 24                // from safe-area bottom edge
right: 24                 // physical right — stays bottom-right in RTL
zIndex: 100

// Circle container (LinearGradient)
// expo-linear-gradient:
colors={['#2563eb', '#1d4ed8']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
width: 56
height: 56
borderRadius: 28          // perfect circle
justifyContent: 'center'
alignItems: 'center'
// Shadow
shadowColor: '#1d4ed8'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.40
shadowRadius: 10
elevation: 8

// "+" label (or Ionicons "add" icon)
fontSize: 28
fontWeight: '300'
color: '#ffffff'
lineHeight: 32
textAlign: 'center'
// Using Ionicons "add-outline" at 28px is preferred over text "+"
```

---

### Primary Action Button (Save / History / Full-width CTA)

Used for: "💾 שמירה", "✅ שמירה" (Settings), "📊 היסטוריה".

```javascript
// Container
backgroundColor: '#1a1a2e'
borderRadius: 12
paddingVertical: 16
paddingHorizontal: 20
alignItems: 'center'
justifyContent: 'center'
marginHorizontal: 20
marginTop: 12

// Label
fontSize: 16
fontWeight: '600'
color: '#ffffff'
textAlign: 'center'

// Pressed state
backgroundColor: '#16213e'   // slightly lighter navy

// Disabled / loading state
opacity: 0.6

// Loading label variation
// "שומר…" — same style, opacity 0.6
```

---

### Section Header Text

```javascript
fontSize: 18
fontWeight: '600'
color: '#1a1a2e'
textAlign: 'right'
paddingHorizontal: 20
paddingTop: 20
paddingBottom: 10
```

---

### Error Banner (inline, top of screen)

Used when AsyncStorage read fails on HomeScreen.

```javascript
// Banner container
backgroundColor: '#fee2e2'
paddingHorizontal: 20
paddingVertical: 12
flexDirection: 'row'
justifyContent: 'space-between'
alignItems: 'center'

// Error message text
fontSize: 14
fontWeight: '400'
color: '#dc2626'
textAlign: 'right'
flex: 1

// "נסה שנית" retry link (physical-left)
fontSize: 14
fontWeight: '600'
color: '#dc2626'
textDecorationLine: 'underline'
marginStart: 12
```

---

### Inline Warning Text (form validation)

```javascript
fontSize: 13
fontWeight: '400'
color: '#ef4444'
textAlign: 'right'
marginTop: 6
// accessibilityLiveRegion: 'polite'
```

---

### Empty State Placeholder Text

```javascript
fontSize: 15
fontWeight: '400'
color: '#9ca3af'
textAlign: 'center'
paddingVertical: 32
paddingHorizontal: 40
lineHeight: 22
```

---

### Skeleton Loading Rows

```javascript
// Each skeleton row (replaces ExpenseItem during load)
backgroundColor: '#e5e7eb'
borderRadius: 12
height: 64
marginHorizontal: 20
marginBottom: 8
overflow: 'hidden'

// Shimmer highlight (Animated.View inside, slide from right to left)
position: 'absolute'
top: 0, bottom: 0
width: 120
backgroundColor: '#f3f4f6'
opacity: 0.7
// Animate translateX from 300 → -120, looping, 1200ms linear
```

---

### Settings Form Row (label + input pair)

```javascript
// Section wrapper
paddingHorizontal: 20
marginBottom: 20

// Label
fontSize: 14
fontWeight: '500'
color: '#6b7280'
textAlign: 'right'
marginBottom: 6

// Input field (budget amount)
backgroundColor: '#ffffff'
borderWidth: 1
borderColor: '#e5e7eb'
borderRadius: 8
paddingHorizontal: 14
paddingVertical: 14
fontSize: 18
fontWeight: '600'
color: '#1a1a2e'
textAlign: 'right'
// focused: borderColor '#2563eb', borderWidth 2
```

---

## 7. Iconography

**Icon set:** `@expo/vector-icons` — **Ionicons** subset. This is already bundled with Expo SDK 51
and covers all required icons with no additional installation.

### Icon Registry

| Use case                          | Ionicons name             | Size | Color                     |
|-----------------------------------|---------------------------|------|---------------------------|
| Settings gear (HomeScreen header) | `settings-outline`        | 24   | `rgba(255,255,255,0.85)`  |
| FAB plus                          | `add-outline`             | 28   | `#ffffff`                 |
| Back arrow (BackHeader)           | `arrow-forward-outline`   | 22   | `#2563eb`                 |
| Month prev arrow (MonthNavigator) | `chevron-back-outline`    | 22   | `#1a1a2e`                 |
| Month next arrow (MonthNavigator) | `chevron-forward-outline` | 22   | `#1a1a2e`                 |
| Calendar (DateSelector)           | `calendar-outline`        | 20   | `#9ca3af`                 |
| History nav (section label)       | (emoji `📊` in text)       | —    | —                         |

### RTL Transform Rule

Icons that imply direction (back arrow, chevron arrows in MonthNavigator) must be evaluated per
context. With `I18nManager.forceRTL(true)` active, React Native mirrors the entire layout. Test
each arrow on a physical device or RTL simulator. Apply `transform: [{ scaleX: -1 }]` only where
the icon glyph points in the physically wrong direction after RTL flip. The `arrow-forward-outline`
icon on BackHeader (points physically right = "return to start" in RTL) should NOT be flipped.

### Icon + Text Pairing

When an icon appears inline with a label (e.g., BackHeader "→ חזרה"):

```javascript
// Row containing icon + text
flexDirection: 'row'
alignItems: 'center'
gap: 4   // 4px between icon and text
```

Solo icons (settings gear, calendar): no gap needed. Minimum 44×44 tap area wrapper always.

### Standard Sizes

```
16px — small inline decorative icons (rare)
20px — calendar, small action icons inside rows
22px — navigation arrows (MonthNavigator, BackHeader)
24px — header icons (settings gear)
28px — FAB icon
```

---

## 8. Motion and Animation

### Philosophy

All motion is functional — it communicates state change, not decoration. Total duration budget
per interaction is under 350 ms. No looping animations except the skeleton shimmer.

### Specifications

#### ProgressBar fill animation

```javascript
// Animated.timing config
duration: 600           // ms — gives weight to the "how am I doing" moment
easing: Easing.out(Easing.quad)
useNativeDriver: false  // required because width (layout property) is animated
// Animated.Value: from 0 → Math.min(percent, 100) (as a percentage string via interpolation)
// Use interpolate to map 0–100 value to '0%'–'100%' for width
```

#### Screen transitions

React Navigation 6 native stack default: native iOS slide-from-right (push) / slide-to-right
(pop). No custom `animation` prop is needed. This is RTL-aware: React Navigation respects
`I18nManager.isRTL` and reverses slide direction automatically on RTL devices.

#### Swipe-to-delete reveal

```javascript
// PanResponder / Swipeable
// Reveal animation: spring, not timing — gives physical feel
spring friction: 8
spring tension: 40
// Snap-back (below threshold): same spring
// Snap-open (above threshold): same spring to locked-open position (translateX = 80)
```

#### Delete row removal (after confirm)

```javascript
// Animated.timing collapsing the row height
duration: 220
easing: Easing.out(Easing.ease)
// Animate height → 0 and opacity → 0 simultaneously
// useNativeDriver: false (height is a layout property)
```

#### Skeleton shimmer

```javascript
// Looping Animated.loop around Animated.timing
duration: 1200
easing: Easing.linear
// Translates a highlight strip from right edge to left edge of the skeleton rectangle
// useNativeDriver: true (translate is compositable)
```

#### Button pressed feedback

```javascript
// React Native Pressable onPressIn/onPressOut
// Scale the button down very slightly on press
// Animated.timing: duration 80ms, to scaleX/scaleY 0.97
// Animated.timing: duration 80ms back to 1.0 on release
// useNativeDriver: true
```

#### MonthNavigator label swap

No animation by default (synchronous state update). If a cross-fade is added later:

```javascript
duration: 150
easing: Easing.out(Easing.ease)
// Opacity 1 → 0 (old label) then 0 → 1 (new label)
```

### No-animation List

The following explicitly have NO animation: form field appearance, inline warning text
appearance/disappearance (appears/hides instantly), InsightsBox render, screen header render.

---

## 9. StyleSheet Snippets

These are the exact values a developer drops into `StyleSheet.create({})`. Comments reference
the token names from sections above.

### colors.ts constants file

```typescript
// src/constants/colors.ts

export const GRADIENT_START = '#1a1a2e';
export const GRADIENT_MID   = '#16213e';
export const GRADIENT_END   = '#0f3460';

export const PROGRESS_GREEN  = '#10b981';
export const PROGRESS_YELLOW = '#f59e0b';
export const PROGRESS_RED    = '#ef4444';
export const PROGRESS_TRACK  = '#e5e7eb';

export const BACKGROUND      = '#f9fafb';
export const CARD_BACKGROUND = '#ffffff';

export const TEXT_PRIMARY    = '#1a1a2e';
export const TEXT_SECONDARY  = '#6b7280';
export const TEXT_MUTED      = '#9ca3af';
export const TEXT_ON_DARK    = '#ffffff';
export const TEXT_ON_DARK_2  = 'rgba(255,255,255,0.70)';

export const AMOUNT_POSITIVE = '#10b981';
export const DELETE_RED      = '#ef4444';

export const INSIGHTS_BG     = '#eff6ff';
export const INSIGHTS_BORDER = '#bfdbfe';
export const INSIGHTS_TEXT   = '#1d4ed8';

export const SEGMENT_ACTIVE_BG   = '#1a1a2e';
export const SEGMENT_ACTIVE_TEXT = '#ffffff';
export const SEGMENT_INACTIVE_BG = '#ffffff';
export const SEGMENT_INACTIVE_TEXT = '#6b7280';

export const FAB_GRADIENT_START = '#2563eb';
export const FAB_GRADIENT_END   = '#1d4ed8';

export const BORDER_DEFAULT  = '#e5e7eb';
export const BORDER_STRONG   = '#d1d5db';
export const BORDER_FOCUS    = '#2563eb';
export const BORDER_ERROR    = '#ef4444';
export const DIVIDER         = '#f3f4f6';

export const SKELETON_BASE      = '#e5e7eb';
export const SKELETON_HIGHLIGHT = '#f3f4f6';
```

### Typography snippet

```typescript
// src/constants/typography.ts

import { StyleSheet } from 'react-native';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_ON_DARK, TEXT_ON_DARK_2 } from './colors';

export const typography = StyleSheet.create({
  heroAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 56,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'right',
    lineHeight: 32,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'right',
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: TEXT_PRIMARY,
    textAlign: 'right',
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'right',
    lineHeight: 24,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '400',
    color: TEXT_SECONDARY,
    textAlign: 'right',
    lineHeight: 20,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_MUTED,
    textAlign: 'right',
    lineHeight: 18,
  },
  amountHero: {
    fontSize: 36,
    fontWeight: '700',
    color: TEXT_ON_DARK,
    textAlign: 'right',
    lineHeight: 44,
  },
  amountBody: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'left',
    lineHeight: 24,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#ef4444',
    textAlign: 'right',
    lineHeight: 18,
  },
  onDarkLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: TEXT_ON_DARK_2,
    textAlign: 'right',
    lineHeight: 20,
  },
});
```

### Card shadow snippet (cross-platform)

```typescript
// src/constants/shadows.ts

import { Platform } from 'react-native';

export const cardShadow = Platform.select({
  ios: {
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: {
    elevation: 3,
  },
  default: {},
});

export const elevatedShadow = Platform.select({
  ios: {
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  android: {
    elevation: 6,
  },
  default: {},
});

export const fabShadow = Platform.select({
  ios: {
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  android: {
    elevation: 8,
  },
  default: {},
});
```

### ProgressBar animation snippet

```typescript
// Inside ProgressBar.tsx — Animated width

const animatedWidth = useRef(new Animated.Value(0)).current;
const clampedPercent = Math.min(percent, 100);

useEffect(() => {
  Animated.timing(animatedWidth, {
    toValue: clampedPercent,
    duration: 600,
    easing: Easing.out(Easing.quad),
    useNativeDriver: false,
  }).start();
}, [clampedPercent]);

const widthInterpolated = animatedWidth.interpolate({
  inputRange: [0, 100],
  outputRange: ['0%', '100%'],
  extrapolate: 'clamp',
});

// Usage in render:
// <Animated.View style={[styles.fill, { width: widthInterpolated, backgroundColor: color }]} />
```

### FAB StyleSheet snippet

```typescript
fab: {
  position: 'absolute',
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: 28,
  justifyContent: 'center',
  alignItems: 'center',
  // Shadow applied via fabShadow from shadows.ts (spread operator)
  zIndex: 100,
},
// The View inside FAB is a LinearGradient:
// colors={['#2563eb', '#1d4ed8']} start={{x:0,y:0}} end={{x:1,y:1}}
// Same width/height/borderRadius as the outer View
```

---

## 10. RTL Visual Rules Summary

This section collects all RTL-specific visual decisions in one place for the developer.

```
textAlign: 'right'        — on every Text element displaying Hebrew content
                            Exception: amount text in ExpenseItem trailing position (textAlign: 'left')
                            Exception: centred elements (empty state, % text, MonthNavigator label)

paddingStart / paddingEnd — use instead of paddingLeft / paddingRight for layout spacing that must
                            flip with RTL (e.g., horizontal padding on asymmetric rows)

flexDirection: 'row'      — React Native respects I18nManager.isRTL; row items naturally flow
                            right-to-left. No special RTL row needed.

FAB position              — physical right: 24, physical bottom: 24
                            (stays at visual bottom-right regardless of RTL)

Settings gear position    — top of HomeScreen gradient header, physical left: 16
                            (this is the visual "end" side in RTL = top-left visual corner as briefed)

BackHeader back button    — physical right side (reading-start in RTL)
                            Uses arrow-forward-outline icon (points right = return to start)

MonthNavigator arrows     — "›" on physical right (next month), "‹" on physical left (prev month)
                            Test arrow glyphs on device; apply scaleX: -1 only if glyph is wrong

Swipe-to-delete           — user swipes physical left → right (toward reading start)
                            Delete button revealed on physical left (trailing/end side of row)
```

---

## 11. Spacing Reference Card

Quick-reference for the developer when building layouts:

```
Screen edge padding (H):      20px    paddingHorizontal: 20
Screen top padding:            16px    below SafeAreaView inset
Card internal padding:         16–20px  padding: 16 (standard), 20 (SummaryCard)
Card bottom margin:            12px    marginBottom: 12
Section gap (between blocks):  24px    marginBottom: 24
Form field gap (label→input):   6px    marginBottom: 6
Form section gap (field→field): 20px   marginBottom: 20
Header row height:             56px    height: 56
FAB safe-area offset:          24px    bottom: 24, right: 24
Progress bar height:           20px    height: 20
Progress bar radius:           10px    borderRadius: 10
InsightsBox padding:           16px    padding: 16
Button vertical padding:       16px    paddingVertical: 16
Button radius:                 12px    borderRadius: 12
Card radius:                   16px    borderRadius: 16
Input radius:                   8px    borderRadius: 8
FAB radius:                    28px    borderRadius: 28 (56/2)
Icon + text gap:                4px    gap: 4 (or marginStart: 4)
Min tap target:                44px    minWidth/minHeight: 44
```
