import type { ProducerGeo } from './api';

// ───────────────────────────────────────────────────────────────────────────
// Filters
// ───────────────────────────────────────────────────────────────────────────

/**
 * A single filter applied to the post-zones producer set.
 *
 * New filter types are added by:
 *   1. extending this union
 *   2. adding a branch in `producerMatchesFilter`
 *   3. registering a card component in `producer-selection/filter-cards`
 */
export type Filter = LastContactFilter;

export interface LastContactFilter {
  id: string;
  type: 'last_contact';
  /** 'more_than' = exclude producers contacted MORE THAN N days ago (i.e. cold).
   *  'less_than' = exclude producers contacted LESS THAN N days ago (i.e. recently warm). */
  op: 'more_than' | 'less_than';
  days: number;
}

export type FilterType = Filter['type'];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns `true` if the producer should be KEPT (passes the filter), `false`
 * if the producer should be REMOVED by this filter.
 *
 * Filter semantics:
 *   last_contact / more_than / 30  → KEEP producers contacted within 30 days;
 *                                     REMOVE producers contacted more than 30 days ago.
 *   last_contact / less_than / 30  → KEEP producers contacted more than 30 days ago;
 *                                     REMOVE producers contacted less than 30 days ago.
 *
 * Producers with no `last_contacted_at` are treated as "infinitely long ago":
 *   - more_than 30 → REMOVED (treat as cold)
 *   - less_than 30 → KEPT   (treat as cold)
 */
export function producerMatchesFilter(
  p: ProducerGeo,
  f: Filter,
  now: Date
): boolean {
  switch (f.type) {
    case 'last_contact': {
      const iso = p.last_contacted_at;
      const lastMs = iso ? Date.parse(iso) : Number.NaN;
      // Time since contact in days. NaN/null → +Infinity (very cold).
      const daysSince = Number.isNaN(lastMs)
        ? Number.POSITIVE_INFINITY
        : (now.getTime() - lastMs) / DAY_MS;
      if (f.op === 'more_than') {
        // Keep producers with daysSince ≤ f.days (recently in contact).
        return daysSince <= f.days;
      }
      // less_than: keep producers with daysSince ≥ f.days (cold producers).
      return daysSince >= f.days;
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Zones
// ───────────────────────────────────────────────────────────────────────────

/**
 * A zone supplied to `computeSelection`. The baseline is just another zone
 * with `producerIds: null` (count unknown until the contour system lands).
 */
export interface ZoneInput {
  id: string;
  label: string;
  /** null → unknown (e.g. baseline before contour math exists). */
  producerIds: Set<string> | null;
}

export interface ZoneRow {
  id: string;
  label: string;
  /** Net-new producers contributed by this zone. null when count unknown. */
  delta: number | null;
  /** Running union size after this zone. null when any prior or current row is unknown. */
  runningTotal: number | null;
}

export interface FilterRow {
  id: string;
  type: FilterType;
  /** Producers this specific filter removed from the running set. */
  delta: number;
  /** Running set size after this filter was applied. */
  runningTotal: number;
}

export interface SelectionResult {
  zoneRows: ZoneRow[];
  filterRows: FilterRow[];
  /** Running total after all zones (before any filtering). null if any zone is unknown. */
  selectedByArea: number | null;
  /** Sum of all filter deltas (always ≥ 0). */
  removedByFilters: number;
  /** Final producer id set after zones ∪ then filters applied sequentially. */
  finalIds: Set<string>;
  /** Final count: |finalIds|, or null when selectedByArea is null and no filters are applied. */
  finalCount: number | null;
}

/**
 * Compute the full selection breakdown.
 *
 * Zones contribute *net-new* ids (each row's delta is its contribution beyond
 * the union of all prior zones). Filters then apply sequentially in display
 * order, and each filter's delta is what *it specifically* removed.
 */
export function computeSelection(
  zones: ZoneInput[],
  filters: Filter[],
  producers: ProducerGeo[],
  now: Date
): SelectionResult {
  // ── Zones ─────────────────────────────────────────────────────────────
  const union = new Set<string>();
  let unknownEncountered = false;
  const zoneRows: ZoneRow[] = [];

  for (const z of zones) {
    if (z.producerIds == null) {
      unknownEncountered = true;
      zoneRows.push({ id: z.id, label: z.label, delta: null, runningTotal: null });
      continue;
    }
    let delta = 0;
    for (const pid of z.producerIds) {
      if (!union.has(pid)) {
        union.add(pid);
        delta += 1;
      }
    }
    zoneRows.push({
      id: z.id,
      label: z.label,
      delta,
      runningTotal: unknownEncountered ? null : union.size,
    });
  }

  const selectedByArea = unknownEncountered ? null : union.size;

  // ── Filters (sequential) ──────────────────────────────────────────────
  // Build a producer lookup once.
  const byId = new Map<string, ProducerGeo>();
  for (const p of producers) byId.set(p.id, p);

  let running = union;
  let removedByFilters = 0;
  const filterRows: FilterRow[] = [];

  for (const f of filters) {
    const next = new Set<string>();
    let removed = 0;
    for (const pid of running) {
      const p = byId.get(pid);
      // If the producer is missing from the dataset, drop it (safety).
      if (!p) {
        removed += 1;
        continue;
      }
      if (producerMatchesFilter(p, f, now)) {
        next.add(pid);
      } else {
        removed += 1;
      }
    }
    running = next;
    removedByFilters += removed;
    filterRows.push({
      id: f.id,
      type: f.type,
      delta: removed,
      runningTotal: running.size,
    });
  }

  const finalCount =
    selectedByArea == null && filters.length === 0 ? null : running.size;

  return {
    zoneRows,
    filterRows,
    selectedByArea,
    removedByFilters,
    finalIds: running,
    finalCount,
  };
}
