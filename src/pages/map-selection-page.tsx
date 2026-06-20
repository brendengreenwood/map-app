import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mdiLoading } from '@mdi/js';
import { useUsers } from '@/hooks/use-users';
import { useSelectionMap, CARGILL_SIDNEY } from '@/hooks/use-selection-map';
import { useMapSelection, type PushZone } from '@/hooks/use-map-selection';
import { useScenarioSelection } from '@/hooks/use-scenario-selection';
import { ProducerSelectionPanel } from '@/components/producer-selection/producer-selection-panel';
import { MapSelectionTopBar } from '@/components/map-selection-top-bar';
import { CollapsibleRightPanel } from '@/components/collapsible-right-panel';
import { fetchProducerGeo, fetchOriginators, type Originator, type ProducerGeo } from '@/lib/api';
import { SCENARIO_ID, SCENARIO_TITLE } from '@/lib/scenario';

type PanelTab = 'producers' | 'originators';

export default function MapSelectionPage() {
  const { resolvedTheme } = useUsers();
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const [producers, setProducers] = useState<ProducerGeo[]>([]);
  const [originators, setOriginators] = useState<Originator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('producers');
  const [panelOpen, setPanelOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('mapSelection.panelOpen') !== 'false';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('mapSelection.panelOpen', String(panelOpen));
    } catch {
      /* ignore quota / disabled storage */
    }
  }, [panelOpen]);

  const {
    pushZones,
    filters,
    addPushZone,
    removePushZone,
    addFilter,
    updateFilter,
    removeFilter,
  } = useScenarioSelection(SCENARIO_ID);

  const {
    mapRef,
    setProducers: setMapProducers,
    setSelected,
    flyToFacility,
    setMapPadding,
  } = useSelectionMap({
    containerRef,
    theme: resolvedTheme,
    facility: CARGILL_SIDNEY,
    originators,
  });

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

  // Fetch producers + originators once.
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProducerGeo({ limit: 5000 }), fetchOriginators()])
      .then(([geo, origs]) => {
        if (cancelled) return;
        setProducers(geo.producers);
        setOriginators(origs);
        setMapProducers(geo.producers);
        setLoading(false);
        setMapPadding({ right: panelOpen ? 384 : 0 });
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

  // Keep map padding in sync with the collapsible right panel so flyTo /
  // fitBounds frame content in the visible area, not the full canvas.
  useEffect(() => {
    if (loading) return;
    setMapPadding({ right: panelOpen ? 384 : 0 });
  }, [loading, panelOpen, setMapPadding]);

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

  const handleArchive = () => {
    toast.message('Scenario archived', {
      description: 'Archive flow is a placeholder until the backend lands.',
    });
  };

  const handleSave = () => {
    toast.success('Scenario saved & published', {
      description: `${pushZones.length} push zone${pushZones.length === 1 ? '' : 's'}, ${filters.length} filter${filters.length === 1 ? '' : 's'}.`,
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <MapSelectionTopBar
        scenarioTitle={SCENARIO_TITLE}
        onArchive={handleArchive}
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

        {/* Right rail: collapsible tabbed panel */}
        <CollapsibleRightPanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          width={384}
          ariaLabel="selection panel"
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
