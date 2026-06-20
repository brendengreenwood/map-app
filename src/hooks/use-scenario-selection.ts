import { useCallback, useEffect, useRef, useState } from 'react';
import type { Filter } from '@/lib/selection-math';
import type { PushZone } from '@/hooks/use-map-selection';

/**
 * Persisted selection state for a single scenario.
 *
 * Versioning: bump VERSION when the shape changes so old payloads are ignored.
 */
const VERSION = 2;
const STORAGE_PREFIX = 'scenario-selection';

function storageKey(scenarioId: string): string {
  return `${STORAGE_PREFIX}:v${VERSION}:${scenarioId}`;
}

interface PersistedShape {
  pushZones: PushZone[];
  filters: Filter[];
}

function loadFromStorage(scenarioId: string): PersistedShape | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(scenarioId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedShape;
    if (!Array.isArray(parsed.pushZones) || !Array.isArray(parsed.filters)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(scenarioId: string, shape: PersistedShape): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(scenarioId), JSON.stringify(shape));
  } catch {
    // Ignore quota / privacy-mode failures.
  }
}

export interface UseScenarioSelectionResult {
  pushZones: PushZone[];
  filters: Filter[];
  addPushZone: (zone: PushZone) => void;
  removePushZone: (id: string) => void;
  addFilter: (filter: Filter) => void;
  updateFilter: (id: string, patch: Partial<Filter>) => void;
  removeFilter: (id: string) => void;
  clearAll: () => void;
  hydrated: boolean;
}

export function useScenarioSelection(scenarioId: string): UseScenarioSelectionResult {
  // Eagerly hydrate so first paint already reflects persisted state.
  const initialRef = useRef<{ shape: PersistedShape; hydrated: boolean } | null>(null);
  if (initialRef.current === null) {
    const stored = loadFromStorage(scenarioId);
    initialRef.current = stored
      ? { shape: stored, hydrated: true }
      : { shape: { pushZones: [], filters: [] }, hydrated: false };
  }

  const [pushZones, setPushZones] = useState<PushZone[]>(initialRef.current.shape.pushZones);
  const [filters, setFilters] = useState<Filter[]>(initialRef.current.shape.filters);
  const [hydrated] = useState<boolean>(initialRef.current.hydrated);

  useEffect(() => {
    saveToStorage(scenarioId, { pushZones, filters });
  }, [scenarioId, pushZones, filters]);

  const addPushZone = useCallback((zone: PushZone) => {
    setPushZones((prev) => [...prev, zone]);
  }, []);

  const removePushZone = useCallback((id: string) => {
    setPushZones((prev) => prev.filter((z) => z.id !== id));
  }, []);

  const addFilter = useCallback((filter: Filter) => {
    setFilters((prev) => [...prev, filter]);
  }, []);

  const updateFilter = useCallback((id: string, patch: Partial<Filter>) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? ({ ...f, ...patch } as Filter) : f))
    );
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setPushZones([]);
    setFilters([]);
  }, []);

  return {
    pushZones,
    filters,
    addPushZone,
    removePushZone,
    addFilter,
    updateFilter,
    removeFilter,
    clearAll,
    hydrated,
  };
}
