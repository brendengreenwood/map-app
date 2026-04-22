/** Lightweight validation helpers for API input */

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isOptionalString(v: unknown): v is string | undefined {
  return v === undefined || v === null || typeof v === 'string';
}

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isOptionalNumber(v: unknown): v is number | undefined | null {
  return v === undefined || v === null || isFiniteNumber(v);
}

export function isValidLng(v: unknown): v is number {
  return isFiniteNumber(v) && v >= -180 && v <= 180;
}

export function isValidLat(v: unknown): v is number {
  return isFiniteNumber(v) && v >= -90 && v <= 90;
}

export function isOptionalLng(v: unknown): boolean {
  return v === undefined || v === null || isValidLng(v);
}

export function isOptionalLat(v: unknown): boolean {
  return v === undefined || v === null || isValidLat(v);
}

export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === 'string');
}

/** Sanitize a string: trim and enforce max length */
export function sanitize(v: string, maxLength = 500): string {
  return v.trim().slice(0, maxLength);
}

/** Sanitize an array of strings */
export function sanitizeArray(v: string[], maxItems = 50, maxLength = 200): string[] {
  return v.slice(0, maxItems).map((s) => sanitize(s, maxLength)).filter(Boolean);
}
