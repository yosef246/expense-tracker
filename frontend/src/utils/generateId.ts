/**
 * generateId(): string
 *
 * Generates a unique ID for a new expense record.
 * Attempts crypto.randomUUID() (available on React Native Hermes SDK 51+).
 * Falls back to a timestamp + random string combination that is sufficiently
 * unique for single-user local storage usage.
 */
export function generateId(): string {
  // Hermes on Expo SDK 51 exposes crypto.randomUUID()
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp (base-36) + random suffix
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 9) +
    '-' +
    Math.random().toString(36).slice(2, 9)
  );
}
