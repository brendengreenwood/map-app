import { useCallback, useEffect, useRef, useState } from 'react';
import type { MarketSetup, PricingSpread } from '@/lib/api';
import { DEFAULT_FACILITY } from '@/lib/scenario';

/** Inline edits to a competitor's posted bid, keyed by competitor id. Bids in cents. */
export type CompetitorBidOverrides = Record<string, number>;

export interface MarketState {
  setup: MarketSetup;
  pricing: PricingSpread;
  competitorBidOverrides: CompetitorBidOverrides;
}

interface PersistedShape {
  setup: MarketSetup;
  pricing: PricingSpread;
  competitorBidOverrides: CompetitorBidOverrides;
}

const VERSION = 1;
const STORAGE_PREFIX = 'mapConfigure:market';

function storageKey(scenarioId: string): string {
  return `${STORAGE_PREFIX}:${scenarioId}:v${VERSION}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_STATE: MarketState = {
  setup: {
    facilityId: DEFAULT_FACILITY.id,
    commodity: 'corn',
    contractCode: 'Z26',
    lookbackDate: todayIso(),
  },
  pricing: {
    postedCents: 0,
    maxCents: 0,
    leewayCents: 0,
    distanceCostCentsPerMile: 7,
  },
  competitorBidOverrides: {},
};

function loadFromStorage(scenarioId: string): MarketState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(scenarioId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedShape;
    return {
      setup: parsed.setup,
      pricing: parsed.pricing,
      competitorBidOverrides: parsed.competitorBidOverrides ?? {},
    };
  } catch {
    return null;
  }
}

function saveToStorage(scenarioId: string, m: MarketState): void {
  if (typeof window === 'undefined') return;
  const payload: PersistedShape = {
    setup: m.setup,
    pricing: m.pricing,
    competitorBidOverrides: m.competitorBidOverrides,
  };
  try {
    window.localStorage.setItem(storageKey(scenarioId), JSON.stringify(payload));
  } catch {
    // Ignore quota / privacy-mode failures.
  }
}

export interface UseScenarioMarketResult {
  market: MarketState;
  setSetup: (patch: Partial<MarketSetup>) => void;
  setPricing: (patch: Partial<PricingSpread>) => void;
  setCompetitorBid: (competitorId: string, cents: number | null) => void;
  resetCompetitorBids: () => void;
  hydrated: boolean;
}

export function useScenarioMarket(scenarioId: string): UseScenarioMarketResult {
  const initialRef = useRef<{ state: MarketState; hydrated: boolean } | null>(null);
  if (initialRef.current === null) {
    const stored = loadFromStorage(scenarioId);
    initialRef.current = stored
      ? { state: stored, hydrated: true }
      : { state: DEFAULT_STATE, hydrated: false };
  }

  const [market, setMarket] = useState<MarketState>(initialRef.current.state);
  const [hydrated, setHydrated] = useState<boolean>(initialRef.current.hydrated);

  useEffect(() => {
    saveToStorage(scenarioId, market);
  }, [scenarioId, market]);

  const setSetup = useCallback((patch: Partial<MarketSetup>) => {
    setMarket((prev) => ({ ...prev, setup: { ...prev.setup, ...patch } }));
    setHydrated(true);
  }, []);

  const setPricing = useCallback((patch: Partial<PricingSpread>) => {
    setMarket((prev) => ({ ...prev, pricing: { ...prev.pricing, ...patch } }));
    setHydrated(true);
  }, []);

  const setCompetitorBid = useCallback((competitorId: string, cents: number | null) => {
    setMarket((prev) => {
      const next = { ...prev.competitorBidOverrides };
      if (cents === null) delete next[competitorId];
      else next[competitorId] = cents;
      return { ...prev, competitorBidOverrides: next };
    });
    setHydrated(true);
  }, []);

  const resetCompetitorBids = useCallback(() => {
    setMarket((prev) => ({ ...prev, competitorBidOverrides: {} }));
    setHydrated(true);
  }, []);

  return { market, setSetup, setPricing, setCompetitorBid, resetCompetitorBids, hydrated };
}
