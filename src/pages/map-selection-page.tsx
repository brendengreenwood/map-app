import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import { mdiLoading } from '@mdi/js';
import { useUsers } from '@/hooks/use-users';
import { useSelectionMap, CARGILL_SIDNEY } from '@/hooks/use-selection-map';
import { useMapSelection } from '@/hooks/use-map-selection';
import { MapSelectionToolbar } from '@/components/map-selection-toolbar';
import { SelectedProducersPanel } from '@/components/selected-producers-panel';
import { SelectionLayersPanel } from '@/components/selection-layers-panel';
import { MapSelectionTopBar, type MapSelectionTab } from '@/components/map-selection-top-bar';
import { fetchProducerGeo, fetchOriginators, type Originator, type ProducerGeo } from '@/lib/api';

const SCENARIO_TITLE = 'Cargill Sidney — Spring 2026 Bid';

export default function MapSelectionPage() {
  const navigate = useNavigate();
  const { resolvedTheme } = useUsers();
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const [producers, setProducers] = useState<ProducerGeo[]>([]);
  const [originators, setOriginators] = useState<Originator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { mapRef, setProducers: setMapProducers, setSelected, flyToFacility } = useSelectionMap({
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

  // Sync selection state to map
  useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds, setSelected]);

  const overlayPointerEvents = tool === 'none' ? 'none' : 'auto';

  const handleTabChange = (tab: MapSelectionTab) => {
    if (tab === 'configure') {
      navigate('/map');
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

        {/* Right rail: results */}
        <aside className="hidden w-72 flex-col md:flex">
          <div className="flex-1">
            <SelectedProducersPanel
              producers={selectedProducers}
              onRemove={removeProducer}
              originators={originators}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
