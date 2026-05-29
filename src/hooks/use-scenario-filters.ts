import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_FILTER_STATE,
  type AccountType,
  type FilterState,
} from '@/lib/producer-filters';

interface PersistedShape {
  accountTypes: AccountType[];
  excludeSpottedWithinDays: number | null;
  excludeContactedWithinDays: number | null;
  enabledOriginatorIds: string[];
}

const VERSION = 1;
const STORAGE_PREFIX = 'mapSelection:filters';

function storageKey(scenarioId: string): string {
  return `${STORAGE_PREFIX}:${scenarioId}:v${VERSION}`;
}

function loadFromStorage(scenarioId: string): FilterState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(scenarioId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedShape;
    return {
      accountTypes: new Set(parsed.accountTypes),
      excludeSpottedWithinDays: parsed.excludeSpottedWithinDays,
      excludeContactedWithinDays: parsed.excludeContactedWithinDays,
      enabledOriginatorIds: new Set(parsed.enabledOriginatorIds),
    };
  } catch {
    return null;
  }
}

function saveToStorage(scenarioId: string, f: FilterState): void {
  if (typeof window === 'undefined') return;
  const payload: PersistedShape = {
    accountTypes: [...f.accountTypes],
    excludeSpottedWithinDays: f.excludeSpottedWithinDays,
    excludeContactedWithinDays: f.excludeContactedWithinDays,
    enabledOriginatorIds: [...f.enabledOriginatorIds],
  };
  try {
    window.localStorage.setItem(storageKey(scenarioId), JSON.stringify(payload));
  } catch {
    // Ignore quota / privacy-mode failures.
  }
}

export interface UseScenarioFiltersResult {
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  toggleAccountType: (t: AccountType) => void;
  setSpottedWindow: (days: number | null) => void;
  setContactedWindow: (days: number | null) => void;
  toggleOriginator: (id: string) => void;
  selectAllOriginators: (ids: string[]) => void;
  clearAllOriginators: () => void;
  resetFilters: () => void;
  /** Whether persisted state has been loaded; pre-hydration we use defaults. */
  hydrated: boolean;
}

export function useScenarioFilters(scenarioId: string): UseScenarioFiltersResult {
  // Eagerly hydrate from storage so first paint already reflects persisted state.
  const initialRef = useRef<{ state: FilterState; hydrated: boolean } | null>(null);
  if (initialRef.current === null) {
    const stored = loadFromStorage(scenarioId);
    initialRef.current = stored
      ? { state: stored, hydrated: true }
      : { state: { ...DEFAULT_FILTER_STATE, accountTypes: new Set(DEFAULT_FILTER_STATE.accountTypes), enabledOriginatorIds: new Set() }, hydrated: false };
  }

  const [filters, setFiltersState] = useState<FilterState>(initialRef.current.state);
  const [hydrated, setHydrated] = useState<boolean>(initialRef.current.hydrated);

  // Persist on every change, but not before we've decided whether to seed defaults
  // with originator ids (handled by caller via selectAllOriginators).
  useEffect(() => {
    saveToStorage(scenarioId, filters);
  }, [scenarioId, filters]);

  const setFilters = useCallback((next: FilterState) => {
    setFiltersState(next);
    setHydrated(true);
  }, []);

  const toggleAccountType = useCallback((t: AccountType) => {
    setFiltersState((prev) => {
      const next = new Set(prev.accountTypes);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return { ...prev, accountTypes: next };
    });
    setHydrated(true);
  }, []);

  const setSpottedWindow = useCallback((days: number | null) => {
    setFiltersState((prev) => ({ ...prev, excludeSpottedWithinDays: days }));
    setHydrated(true);
  }, []);

  const setContactedWindow = useCallback((days: number | null) => {
    setFiltersState((prev) => ({ ...prev, excludeContactedWithinDays: days }));
    setHydrated(true);
  }, []);

  const toggleOriginator = useCallback((id: string) => {
    setFiltersState((prev) => {
      const next = new Set(prev.enabledOriginatorIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, enabledOriginatorIds: next };
    });
    setHydrated(true);
  }, []);

  const selectAllOriginators = useCallback((ids: string[]) => {
    setFiltersState((prev) => ({ ...prev, enabledOriginatorIds: new Set(ids) }));
    setHydrated(true);
  }, []);

  const clearAllOriginators = useCallback(() => {
    setFiltersState((prev) => ({ ...prev, enabledOriginatorIds: new Set() }));
    setHydrated(true);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({
      accountTypes: new Set(DEFAULT_FILTER_STATE.accountTypes),
      excludeSpottedWithinDays: null,
      excludeContactedWithinDays: null,
      enabledOriginatorIds: new Set(),
    });
    setHydrated(true);
  }, []);

  return {
    filters,
    setFilters,
    toggleAccountType,
    setSpottedWindow,
    setContactedWindow,
    toggleOriginator,
    selectAllOriginators,
    clearAllOriginators,
    resetFilters,
    hydrated,
  };
}
