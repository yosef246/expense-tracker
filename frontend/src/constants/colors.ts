/**
 * Color tokens for the expense tracker app.
 * Source of truth: DESIGN_SYSTEM.md §2 and §9.
 * All screens and components must import colors from here — no inline hex strings.
 */

// --- Brand / Gradient ---
export const GRADIENT_START = '#1a1a2e'; // deepest navy (header top)
export const GRADIENT_MID   = '#16213e'; // dark blue (mid-point)
export const GRADIENT_END   = '#0f3460'; // rich blue (header bottom)

// --- Progress / Semantic ---
export const PROGRESS_GREEN  = '#10b981'; // 0–49% budget utilisation
export const PROGRESS_YELLOW = '#f59e0b'; // 50–89% budget utilisation
export const PROGRESS_RED    = '#ef4444'; // 90%+ budget utilisation
export const PROGRESS_TRACK  = '#e5e7eb'; // empty track background

// --- Background / Surface ---
export const BACKGROUND      = '#f9fafb'; // app background (all screens)
export const CARD_BACKGROUND = '#ffffff'; // card surfaces

// --- Text ---
export const TEXT_PRIMARY   = '#1a1a2e'; // headings, amounts, main body
export const TEXT_SECONDARY = '#6b7280'; // secondary labels, descriptions
export const TEXT_MUTED     = '#9ca3af'; // date/time metadata, placeholders
export const TEXT_ON_DARK   = '#ffffff'; // text on gradient surfaces
export const TEXT_ON_DARK_2 = 'rgba(255,255,255,0.70)'; // subdued on gradient

// --- Functional ---
export const AMOUNT_POSITIVE = '#10b981'; // expense amounts in rows
export const DELETE_RED      = '#ef4444'; // swipe-reveal delete button background
export const DELETE_TEXT     = '#ffffff'; // text on delete button

// --- Success / Warning / Danger ---
export const SUCCESS    = '#10b981';
export const SUCCESS_BG = '#d1fae5';
export const WARNING    = '#f59e0b';
export const WARNING_BG = '#fef9c3';
export const DANGER     = '#ef4444';
export const DANGER_BG  = '#fee2e2';

// --- Insights Box ---
export const INSIGHTS_BG     = '#eff6ff';
export const INSIGHTS_BORDER = '#bfdbfe';
export const INSIGHTS_TEXT   = '#1d4ed8';

// --- Segmented Control (SettingsScreen month-start picker) ---
export const SEGMENT_ACTIVE_BG    = '#1a1a2e';
export const SEGMENT_ACTIVE_TEXT  = '#ffffff';
export const SEGMENT_INACTIVE_BG  = '#ffffff';
export const SEGMENT_INACTIVE_TEXT = '#6b7280';

// --- FAB ---
export const FAB_GRADIENT_START = '#2563eb';
export const FAB_GRADIENT_END   = '#1d4ed8';

// --- Borders & Dividers ---
export const BORDER_DEFAULT = '#e5e7eb';
export const BORDER_STRONG  = '#d1d5db';
export const BORDER_FOCUS   = '#2563eb';
export const BORDER_ERROR   = '#ef4444';
export const DIVIDER        = '#f3f4f6';

// --- Skeleton Loading ---
export const SKELETON_BASE      = '#e5e7eb';
export const SKELETON_HIGHLIGHT = '#f3f4f6';
