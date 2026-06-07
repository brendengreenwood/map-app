import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import { mdiLoading } from '@mdi/js';
import { useUsers } from '@/hooks/use-users';
import { useConfigureMap } from '@/hooks/use-configure-map';
import { useScenarioMarket } from '@/hooks/use-scenario-market';
import { MapSelectionTopBar, type MapSelectionTab } from '@/components/map-selection-top-bar';
import { MarketSetupPanel } from '@/components/market-setup-panel';
import { ConfigureCompetitorsPanel } from '@/components/configure-competitors-panel';
import {
  fetchConfigureCompetitors,
  type CompetitiveZone,
  type ConfigureCompetitor,
} from '@/lib/api';
import { computeZones, type ZoneParty } from '@/lib/competitive-zones';
import { DEFAULT_FACILITY, SCENARIO_ID, SCENARIO_TITLE } from '@/lib/scenario';

const FACILITY_OPTIONS = [
  { id: DEFAULT_FACILITY.id, name: DEFAULT_FACILITY.name },
];

const FACILITY_COLOR = '#1f3b0f';
/** Stable hash → indexed competitor color. Keeps zones colored deterministically. */
const COMPETITOR_PALETTE = [
  '#c0392b', '#8e44ad', '#2980b9', '#16a085', '#d35400',
  '#7f8c8d', '#27ae60', '#2c3e50', '#e67e22', '#e84393',
];

function competitorColor(_id: string, index: number): string {
  return COMPETITOR_PALETTE[index % COMPETITOR_PALETTE.length];
}

export default function MapConfigurePage() {
  const navigate = useNavigate();
  const { resolvedTheme } = useUsers();
  const containerRef = useRef<HTMLDivElement>(null);

  const { market, setSetup, setPricing, setCompetitorBid } = useScenarioMarket(SCENARIO_ID);

  const [competitors, setCompetitors] = useState<ConfigureCompetitor[]>([]);
  const [zones, setZones] = useState<CompetitiveZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const facility = useMemo(() => {
    // For v1 there's only Cargill Sidney; ready for additional facilities later.
    return {
      id: DEFAULT_FACILITY.id,
      name: DEFAULT_FACILITY.name,
      lng: DEFAULT_FACILITY.lng,
      lat: DEFAULT_FACILITY.lat,
    };
  }, []);

  const {
    setCompetitors: setMapCompetitors,
    setZones: setMapZones,
    flyToCompetitor,
  } = useConfigureMap({
    containerRef,
    theme: resolvedTheme,
    facility,
  });

  // Fetch competitors whenever setup driving inputs change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchConfigureCompetitors({
      elevatorId: market.setup.facilityId,
      contractCode: market.setup.contractCode,
      date: market.setup.lookbackDate,
    })
      .then((res) => {
        if (cancelled) return;
        setCompetitors(res.competitors);
        setLoading(false);
        // Stale zones are no longer meaningful once the underlying market shifts.
        setZones([]);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load competitors');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [market.setup.facilityId, market.setup.contractCode, market.setup.lookbackDate]);

  // Push competitors to the map whenever they change OR an override flips.
  useEffect(() => {
    // Apply overrides to the rendered list so the map labels match the panel.
    const overridden = competitors.map((c) => ({
      ...c,
      posted: c.id in market.competitorBidOverrides ? market.competitorBidOverrides[c.id] : c.posted,
    }));
    setMapCompetitors(overridden);
  }, [competitors, market.competitorBidOverrides, setMapCompetitors]);

  // Push zones to the map whenever they change.
  useEffect(() => {
    setMapZones(zones);
  }, [zones, setMapZones]);

  // Auto-populate posted bid from competitor data when nothing user-authored exists yet.
  // We do this only once per (contract, facility) combination — if the user has
  // touched the posted field, we leave it alone.
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${market.setup.facilityId}|${market.setup.contractCode}|${market.setup.lookbackDate}`;
    if (seededRef.current === key) return;
    if (competitors.length === 0) return;
    seededRef.current = key;
    // No "merchant" row exists in this demo data; use the closest competitor's
    // posted as a starting point so the field isn't 0.
    if (market.pricing.postedCents === 0 && competitors[0].posted != null) {
      setPricing({ postedCents: competitors[0].posted });
    }
  }, [
    competitors,
    market.setup.facilityId,
    market.setup.contractCode,
    market.setup.lookbackDate,
    market.pricing.postedCents,
    setPricing,
  ]);

  const handleMapZones = useCallback(() => {
    if (competitors.length === 0) return;
    // Merchant facility participates as a party at the configured posted bid.
    const merchantParty: ZoneParty = {
      id: 'merchant',
      name: DEFAULT_FACILITY.name,
      color: FACILITY_COLOR,
      lng: facility.lng,
      lat: facility.lat,
      postedCents: market.pricing.postedCents,
    };
    const competitorParties: ZoneParty[] = competitors
      .map((c, i) => {
        const posted = c.id in market.competitorBidOverrides
          ? market.competitorBidOverrides[c.id]
          : c.posted;
        if (posted == null) return null;
        return {
          id: c.id,
          name: c.name,
          color: competitorColor(c.id, i),
          lng: c.lng,
          lat: c.lat,
          postedCents: posted,
        } satisfies ZoneParty;
      })
      .filter((p): p is ZoneParty => p !== null);

    const next = computeZones([merchantParty, ...competitorParties], {
      distanceCostCentsPerMile: market.pricing.distanceCostCentsPerMile,
    });
    setZones(next);
  }, [competitors, facility, market.competitorBidOverrides, market.pricing]);

  const handleClearZones = useCallback(() => setZones([]), []);

  const canMapZones = competitors.length > 0 && market.setup.facilityId !== '';

  const handleTabChange = (tab: MapSelectionTab) => {
    if (tab === 'select') {
      navigate('/map/selection');
    }
  };

  const handleSave = () => {
    toast.success('Market configuration saved', {
      description: `${competitors.length} competitors · ${zones.length} zones mapped.`,
    });
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <MapSelectionTopBar
        scenarioTitle={SCENARIO_TITLE}
        activeTab="configure"
        onTabChange={handleTabChange}
        onBack={() => navigate('/')}
        onSave={handleSave}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* Map column */}
        <div className="relative min-w-0 flex-1">
          <div ref={containerRef} className="h-full w-full" />

          {/* Market setup panel — floats top-left */}
          <div className="absolute top-4 left-4 z-10">
            <MarketSetupPanel
              setup={market.setup}
              pricing={market.pricing}
              facilities={FACILITY_OPTIONS}
              onSetupChange={setSetup}
              onPricingChange={setPricing}
              onMapZones={handleMapZones}
              canMapZones={canMapZones}
              zonesMapped={zones.length > 0}
              onClearZones={handleClearZones}
            />
          </div>

          {loading && (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-border bg-background/90 px-4 py-2 text-xs text-muted-foreground shadow-md backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <Icon path={mdiLoading} className="size-4 animate-spin" />
                Loading competitors…
              </span>
            </div>
          )}

          {error && (
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-destructive bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Right rail: competitors panel */}
        <aside className="hidden w-80 flex-col overflow-hidden border-l border-border md:flex">
          <ConfigureCompetitorsPanel
            competitors={competitors}
            overrides={market.competitorBidOverrides}
            loading={loading}
            onBidChange={setCompetitorBid}
            onFlyTo={flyToCompetitor}
          />
        </aside>
      </div>
    </div>
  );
}
