import type { ProducerGeo } from './api';

export type AccountType = 'primary' | 'associated';

export interface FilterState {
  /** Account types currently allowed. Empty set → nothing eligible. */
  accountTypes: Set<AccountType>;
  /** If set, producers spotted within this many days are excluded. */
  excludeSpottedWithinDays: number | null;
  /** If set, producers contacted within this many days are excluded. */
  excludeContactedWithinDays: number | null;
  /** Originator ids currently in scope. Producers with null originator are always in scope. */
  enabledOriginatorIds: Set<string>;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  accountTypes: new Set<AccountType>(['primary', 'associated']),
  excludeSpottedWithinDays: null,
  excludeContactedWithinDays: null,
  enabledOriginatorIds: new Set<string>(),
};

const DAY_MS = 24 * 60 * 60 * 1000;

function withinDays(iso: string | null, days: number, now: Date): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return now.getTime() - t <= days * DAY_MS;
}

/** A producer is eligible if it passes every active filter. */
export function isEligible(p: ProducerGeo, f: FilterState, now: Date): boolean {
  // Account type — null treated as primary so legacy rows aren't surprise-excluded.
  const at = (p.account_type ?? 'primary') as AccountType;
  if (!f.accountTypes.has(at)) return false;

  // Recently spotted exclusion
  if (f.excludeSpottedWithinDays != null && withinDays(p.last_spotted_at, f.excludeSpottedWithinDays, now)) {
    return false;
  }

  // Recently contacted exclusion
  if (f.excludeContactedWithinDays != null && withinDays(p.last_contacted_at, f.excludeContactedWithinDays, now)) {
    return false;
  }

  // Originator scope — unassigned producers always pass; otherwise must be in enabled set.
  if (p.originator_id != null && !f.enabledOriginatorIds.has(p.originator_id)) {
    return false;
  }

  return true;
}

export function eligibleIds(producers: ProducerGeo[], f: FilterState, now: Date): Set<string> {
  const ids = new Set<string>();
  for (const p of producers) {
    if (isEligible(p, f, now)) ids.add(p.id);
  }
  return ids;
}
