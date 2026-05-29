/** Lightweight validation helpers for API input */

/** Sanitize a string: trim and enforce max length */
export function sanitize(v: string, maxLength = 500): string {
  return v.trim().slice(0, maxLength);
}

/** Sanitize an array of strings */
export function sanitizeArray(v: string[], maxItems = 50, maxLength = 200): string[] {
  return v.slice(0, maxItems).map((s) => sanitize(s, maxLength)).filter(Boolean);
}
