import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import { mdiLoading } from '@mdi/js';
import { useUsers } from '@/hooks/use-users';
import { useSelectionMap, CARGILL_SIDNEY } from '@/hooks/use-selection-map';
import { useMapSelection } from '@/hooks/use-map-selection';
import { useScenarioFilters } from '@/hooks/use-scenario-filters';
import { MapSelectionToolbar } from '@/components/map-selection-toolbar';
import { SelectedProducersPanel } from '@/components/selected-producers-panel';
import { SelectionLayersPanel } from '@/components/selection-layers-panel';
import { ProducerFiltersPanel } from '@/components/producer-filters-panel';
import { OriginatorRoutingPanel } from '@/components/originator-routing-panel';
import { MapSelectionTopBar, type MapSelectionTab } from '@/components/map-selection-top-bar';
import { fetchProducerGeo, fetchOriginators, type Originator, type ProducerGeo } from '@/lib/api';
import { eligibleIds as computeEligibleIds } from '@/lib/producer-filters';
import { SCENARIO_ID, SCENARIO_TITLE } from '@/lib/scenario';

export default function MapSelectionPage() {
  const navigate = useNavigate();
  const { resolvedTheme } = useUsers();
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const [producers, setProducers] = useState<ProducerGeo[]>([]);
  const [originators, setOriginators] = useState<Originator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    filters,
    toggleAccountType,
    setSpottedWindow,
    setContactedWindow,
    toggleOriginator,
    selectAllOriginators,
    clearAllOriginators,
    hydrated,
  } = useScenarioFilters(SCENARIO_ID);

  // Compute eligible ids — recomputed whenever producers or filters change.
  // `now` recomputed only with these deps; day-level cutoffs make a fresh Date safe.
  const eligibleIds = useMemo(
    () => computeEligibleIds(producers, filters, new Date()),
    [producers, filters]
  );

  const {
    mapRef,
    setProducers: setMapProducers,
    setSelected,
    setEligibleIds,
    flyToFacility,
  } = useSelectionMap({
    containerRef,
    theme: resolvedTheme,
    facility: CARGILL_SIDNEY,
    originators,
  });

  const {
    tool,
    setTool,
    selectedIds,
    selectedProducers,
    layers,
    clear,
    removeLayer,
    removeProducer,
  } = useMapSelection({
    mapRef,
    overlayRef,
    producers,
    eligibleIds,
  });

  // Fetch producers + originators once
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProducerGeo({ limit: 5000 }), fetchOriginators()])
      .then(([geo, origs]) => {
        if (cancelled) return;
        setProducers(geo.producers);
        setOriginators(origs);
        setMapProducers(geo.producers);
        setLoading(false);
        setTimeout(flyToFacility, 200);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load producers');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setMapProducers, flyToFacility]);

  // First time we have originators and nothing persisted, seed all-checked.
  useEffect(() => {
    if (originators.length === 0) return;
    if (hydrated) return;
    if (filters.enabledOriginatorIds.size > 0) return;
    selectAllOriginators(originators.map((o) => o.id));
  }, [originators, hydrated, filters.enabledOriginatorIds, selectAllOriginators]);

  // Sync selection state to map
  useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds, setSelected]);

  // Sync eligibility set to map paint
  useEffect(() => {
    setEligibleIds(eligibleIds);
  }, [eligibleIds, setEligibleIds]);

  // Producer counts per originator (for routing panel).
  const producerCountsByOriginator = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of producers) {
      if (!p.originator_id) continue;
      m.set(p.originator_id, (m.get(p.originator_id) ?? 0) + 1);
    }
    return m;
  }, [producers]);

  // Count of producers eligible by current originator filter alone — informational.
  const visibleByOriginatorCount = useMemo(() => {
    let n = 0;
    for (const p of producers) {
      if (p.originator_id == null) {
        n += 1;
        continue;
      }
      if (filters.enabledOriginatorIds.has(p.originator_id)) n += 1;
    }
    return n;
  }, [producers, filters.enabledOriginatorIds]);

  const overlayPointerEvents = tool === 'none' ? 'none' : 'auto';

  const handleTabChange = (tab: MapSelectionTab) => {
    if (tab === 'configure') {
      navigate('/map/configure');
    }
  };

  const handleSave = () => {
    toast.success('Scenario saved & published', {
      description: `${selectedIds.size} producers in the current selection.`,
    });
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <MapSelectionTopBar
        scenarioTitle={SCENARIO_TITLE}
        activeTab="select"
        onTabChange={handleTabChange}
        onBack={() => navigate('/')}
        onSave={handleSave}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* Map column */}
        <div className="relative min-w-0 flex-1">
          <div ref={containerRef} className="h-full w-full" />
          <canvas
            ref={overlayRef}
            className="absolute inset-0"
            style={{ pointerEvents: overlayPointerEvents }}
          />

          <MapSelectionToolbar
            tool={tool}
            onToolChange={setTool}
            onClear={clear}
            selectedCount={selectedIds.size}
          />

          <div className="absolute top-4 left-20 z-10">
            <SelectionLayersPanel layers={layers} onRemoveLayer={removeLayer} />
          </div>

          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon path={mdiLoading} className="size-4 animate-spin" />
                Loading producers…
              </div>
            </div>
          )}

          {error && (
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-destructive bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Right rail: filters → routing → results */}
        <aside className="hidden w-80 flex-col overflow-y-auto border-l border-border md:flex">
          <ProducerFiltersPanel
            filters={filters}
            onToggleAccountType={toggleAccountType}
            onSetSpottedWindow={setSpottedWindow}
            onSetContactedWindow={setContactedWindow}
            eligibleCount={eligibleIds.size}
            totalCount={producers.length}
          />
          <OriginatorRoutingPanel
            originators={originators}
            filters={filters}
            producerCountsByOriginator={producerCountsByOriginator}
            visibleProducerCount={visibleByOriginatorCount}
            onToggleOriginator={toggleOriginator}
            onSelectAll={() => selectAllOriginators(originators.map((o) => o.id))}
            onClearAll={clearAllOriginators}
          />
          <div className="flex-1 min-h-0">
            <SelectedProducersPanel
              producers={selectedProducers}
              onRemove={removeProducer}
              originators={originators}
              eligibleIds={eligibleIds}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
