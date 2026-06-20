import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mdiLoading, mdiPlus, mdiMinus } from '@mdi/js';
import { useUsers } from '@/hooks/use-users';
import { useScenarioMap, CARGILL_SIDNEY } from '@/hooks/use-scenario-map';
import { useMapSelection, type PushZone } from '@/hooks/use-map-selection';
import { useScenarioMarket } from '@/hooks/use-scenario-market';
import { useScenarioSelection } from '@/hooks/use-scenario-selection';
import { ProducerSelectionPanel } from '@/components/producer-selection/producer-selection-panel';
import { MapSelectionTopBar } from '@/components/map-selection-top-bar';
import { CollapsibleLeftPanel } from '@/components/collapsible-left-panel';
import { CollapsibleRightPanel } from '@/components/collapsible-right-panel';
import { MarketSetupPanel } from '@/components/market-setup-panel';
import { ConfigureCompetitorsPanel } from '@/components/configure-competitors-panel';
import {
  fetchConfigureCompetitors,
  fetchProducerGeo,
  fetchOriginators,
  type CompetitiveZone,
  type ConfigureCompetitor,
  type Originator,
  type ProducerGeo,
} from '@/lib/api';
import { computeZones, type ZoneParty } from '@/lib/competitive-zones';
import { DEFAULT_FACILITY, SCENARIO_ID, SCENARIO_TITLE } from '@/lib/scenario';

type PanelTab = 'producers' | 'originators';

const LEFT_WIDTH = 384;
const RIGHT_WIDTH = 384;

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

export default function MapScenarioPage() {
  const { resolvedTheme } = useUsers();
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  // --- Market (left rail) state --------------------------------------------
  const { market, setSetup, setPricing, setCompetitorBid } = useScenarioMarket(SCENARIO_ID);
  const [competitors, setCompetitors] = useState<ConfigureCompetitor[]>([]);
  const [zones, setZones] = useState<CompetitiveZone[]>([]);
  const [competitorsLoading, setCompetitorsLoading] = useState(false);
  const [competitorsError, setCompetitorsError] = useState<string | null>(null);
  const [showCompetitors, setShowCompetitors] = useState(false);

  // --- Selection (right rail) state ----------------------------------------
  const [producers, setProducers] = useState<ProducerGeo[]>([]);
  const [originators, setOriginators] = useState<Originator[]>([]);
  const [producersLoading, setProducersLoading] = useState(true);
  const [producersError, setProducersError] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('producers');

  // --- Rail open/closed state (persisted) ----------------------------------
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('mapScenario.leftOpen') !== 'false';
  });
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('mapScenario.rightOpen') !== 'false';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('mapScenario.leftOpen', String(leftPanelOpen));
    } catch {
      /* ignore */
    }
  }, [leftPanelOpen]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mapScenario.rightOpen', String(rightPanelOpen));
    } catch {
      /* ignore */
    }
  }, [rightPanelOpen]);

  // --- Facility -------------------------------------------------------------
  const facility = useMemo(
    () => ({
      id: DEFAULT_FACILITY.id,
      name: DEFAULT_FACILITY.name,
      lng: DEFAULT_FACILITY.lng,
      lat: DEFAULT_FACILITY.lat,
    }),
    []
  );

  // --- Unified map ----------------------------------------------------------
  const {
    mapRef,
    setCompetitors: setMapCompetitors,
    setZones: setMapZones,
    setProducers: setMapProducers,
    setSelected,
    flyToCompetitor,
    flyToFacility,
    setMapPadding,
    zoomIn,
    zoomOut,
  } = useScenarioMap({
    containerRef,
    theme: resolvedTheme,
    facility,
    originators,
  });

  // --- Push-zone drawing ---------------------------------------------------
  const {
    pushZones,
    filters,
    addPushZone,
    removePushZone,
    addFilter,
    updateFilter,
    removeFilter,
  } = useScenarioSelection(SCENARIO_ID);

  const handlePushZoneDrawn = useCallback(
    (zone: PushZone) => {
      addPushZone(zone);
    },
    [addPushZone]
  );

  const { tool, setTool, isDrawing, seedCounter } = useMapSelection({
    mapRef,
    overlayRef,
    producers,
    onPushZoneDrawn: handlePushZoneDrawn,
  });

  // Keep zone label numbering monotonic across reloads.
  useEffect(() => {
    if (pushZones.length === 0) return;
    let maxIndex = 0;
    for (const z of pushZones) {
      const m = z.label.match(/#(\d+)$/);
      if (m) {
        const n = Number(m[1]);
        if (Number.isFinite(n) && n > maxIndex) maxIndex = n;
      }
    }
    seedCounter(maxIndex);
  }, [pushZones, seedCounter]);

  // --- Initial data load ---------------------------------------------------
  // Producers + originators (selection side)
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProducerGeo({ limit: 5000 }), fetchOriginators()])
      .then(([geo, origs]) => {
        if (cancelled) return;
        setProducers(geo.producers);
        setOriginators(origs);
        setMapProducers(geo.producers);
        setProducersLoading(false);
        setMapPadding({
          left: leftPanelOpen ? LEFT_WIDTH : 0,
          right: rightPanelOpen ? RIGHT_WIDTH : 0,
        });
        setTimeout(flyToFacility, 200);
      })
      .catch((err) => {
        if (cancelled) return;
        setProducersError(err instanceof Error ? err.message : 'Failed to load producers');
        setProducersLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Only run on mount; padding/flyTo do not need re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMapProducers, flyToFacility, setMapPadding]);

  // Competitors (configure side) — fetched whenever the setup driving inputs change
  useEffect(() => {
    let cancelled = false;
    setCompetitorsLoading(true);
    setCompetitorsError(null);
    fetchConfigureCompetitors({
      elevatorId: market.setup.facilityId,
      contractCode: market.setup.contractCode,
      date: market.setup.lookbackDate,
    })
      .then((res) => {
        if (cancelled) return;
        setCompetitors(res.competitors);
        setCompetitorsLoading(false);
        // Stale zones are no longer meaningful once the underlying market shifts.
        setZones([]);
      })
      .catch((err) => {
        if (cancelled) return;
        setCompetitorsError(err instanceof Error ? err.message : 'Failed to load competitors');
        setCompetitorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [market.setup.facilityId, market.setup.contractCode, market.setup.lookbackDate]);

  // Push competitor markers to map (with overrides applied)
  useEffect(() => {
    const overridden = competitors.map((c) => ({
      ...c,
      posted: c.id in market.competitorBidOverrides ? market.competitorBidOverrides[c.id] : c.posted,
    }));
    setMapCompetitors(overridden);
  }, [competitors, market.competitorBidOverrides, setMapCompetitors]);

  // Push zones to map
  useEffect(() => {
    setMapZones(zones);
  }, [zones, setMapZones]);

  // Seed posted bid from competitor data once per (contract, facility) combo
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${market.setup.facilityId}|${market.setup.contractCode}|${market.setup.lookbackDate}`;
    if (seededRef.current === key) return;
    if (competitors.length === 0) return;
    seededRef.current = key;
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

  // Sync map padding with both rails
  useEffect(() => {
    if (producersLoading) return;
    setMapPadding({
      left: leftPanelOpen ? LEFT_WIDTH : 0,
      right: rightPanelOpen ? RIGHT_WIDTH : 0,
    });
  }, [producersLoading, leftPanelOpen, rightPanelOpen, setMapPadding]);

  // --- Selection sync to map ----------------------------------------------
  const handleSelectionChange = useCallback(
    (finalIds: Set<string>) => {
      setSelected(finalIds);
    },
    [setSelected]
  );

  const handleDrawPushZone = useCallback(() => {
    setTool('push_zone');
  }, [setTool]);

  const overlayPointerEvents = tool === 'none' ? 'none' : 'auto';

  // --- Zone computation -----------------------------------------------------
  const handleMapZones = useCallback(() => {
    if (competitors.length === 0) return;
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

  // --- Top-bar actions ------------------------------------------------------
  const handleArchive = () => {
    toast.message('Scenario archived', {
      description: 'Archive flow is a placeholder until the backend lands.',
    });
  };

  const handleSave = () => {
    toast.success('Scenario saved & published', {
      description: `${competitors.length} competitors, ${zones.length} zones, ${pushZones.length} push zone${pushZones.length === 1 ? '' : 's'}, ${filters.length} filter${filters.length === 1 ? '' : 's'}.`,
    });
  };

  // Avoid unused warning — facility ref retained for future facility switching
  void CARGILL_SIDNEY;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <MapSelectionTopBar
        scenarioTitle={SCENARIO_TITLE}
        onArchive={handleArchive}
        onSave={handleSave}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* Map (full width; rails overlay) */}
        <div className="relative min-w-0 flex-1">
          <div ref={containerRef} className="h-full w-full" />
          <canvas
            ref={overlayRef}
            className="absolute inset-0"
            style={{ pointerEvents: overlayPointerEvents }}
          />

          {(producersLoading || competitorsLoading) && (
            <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-border bg-background/90 px-4 py-2 text-xs text-muted-foreground shadow-md backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <Icon path={mdiLoading} className="size-4 animate-spin" />
                {producersLoading ? 'Loading producers…' : 'Loading competitors…'}
              </span>
            </div>
          )}

          {(producersError || competitorsError) && (
            <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-destructive bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {producersError ?? competitorsError}
            </div>
          )}

          {/* Competitors toggle pill — floats at top of map, just right of the open left rail */}
          {leftPanelOpen && (
            <button
              type="button"
              onClick={() => setShowCompetitors((v) => !v)}
              aria-pressed={showCompetitors}
              className="pointer-events-auto absolute top-4 z-20 inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ left: LEFT_WIDTH + 16 }}
            >
              Competitors ({competitors.length})
            </button>
          )}
        </div>

        {/* Left rail: Market Setup / Competitors */}
        <CollapsibleLeftPanel
          open={leftPanelOpen}
          onOpenChange={setLeftPanelOpen}
          width={LEFT_WIDTH}
          ariaLabel={showCompetitors ? 'competitors panel' : 'market setup panel'}
        >
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-0">
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
            <div
              className="absolute inset-0 bg-background transition-transform duration-300 ease-out"
              style={{ transform: showCompetitors ? 'translateX(0)' : 'translateX(100%)' }}
              aria-hidden={!showCompetitors}
            >
              <ConfigureCompetitorsPanel
                competitors={competitors}
                overrides={market.competitorBidOverrides}
                loading={competitorsLoading}
                onBidChange={setCompetitorBid}
                onFlyTo={flyToCompetitor}
                onBack={() => setShowCompetitors(false)}
              />
            </div>
          </div>
        </CollapsibleLeftPanel>

        {/* Right rail: Producer Selection / Originator Assignments */}
        <CollapsibleRightPanel
          open={rightPanelOpen}
          onOpenChange={setRightPanelOpen}
          width={RIGHT_WIDTH}
          ariaLabel="selection panel"
          controls={
            <>
              <button
                type="button"
                onClick={zoomIn}
                aria-label="Zoom in"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-md transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon path={mdiPlus} className="size-4" />
              </button>
              <button
                type="button"
                onClick={zoomOut}
                aria-label="Zoom out"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-md transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon path={mdiMinus} className="size-4" />
              </button>
            </>
          }
        >
          <Tabs
            value={panelTab}
            onValueChange={(value) => {
              if (value === 'producers' || value === 'originators') {
                setPanelTab(value);
              }
            }}
            className="flex h-full flex-col"
          >
            <div className="border-b border-border px-4">
              <TabsList variant="line">
                <TabsTrigger value="producers" className="after:bottom-0 after:bg-primary">
                  Producer Selection
                </TabsTrigger>
                <TabsTrigger value="originators" className="after:bottom-0 after:bg-primary">
                  Originator Assignments
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="producers" className="min-h-0 flex-1 overflow-y-auto">
              <ProducerSelectionPanel
                producers={producers}
                pushZones={pushZones}
                filters={filters}
                isDrawing={isDrawing || tool === 'push_zone'}
                onDrawPushZone={handleDrawPushZone}
                onRemovePushZone={removePushZone}
                onAddFilter={addFilter}
                onUpdateFilter={updateFilter}
                onRemoveFilter={removeFilter}
                onSelectionChange={handleSelectionChange}
              />
            </TabsContent>

            <TabsContent
              value="originators"
              className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
            >
              <div className="rounded-md border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
                Originator Assignments will live here.
                <div className="mt-1 text-xs">
                  Coming once the producer selection feeds in.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CollapsibleRightPanel>
      </div>
    </div>
  );
}
