import { useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useMap } from '@/hooks/use-map';
import { useUsers } from '@/hooks/use-users';
import { MapBottomTabs } from '@/components/map-bottom-tabs';
import { MapTabBar, type MapTab } from '@/components/map-tab-bar';
import { BidMapEditor } from '@/components/bid-map-editor';
import { Button } from '@/components/ui/button';
import {
  type CornContract,
  type DeliveryWindow,
  DELIVERY_WINDOWS,
} from '@/lib/bid-data';

// State passed via navigate('/map', { state: ... })
interface BidEditState {
  contract: CornContract;
  initialWindowCode?: string; // which tab to land on
}

export default function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useUsers();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const handleReady = useCallback(() => setMapReady(true), []);
  const {
    onDataLoaded,
    toggleClusters,
    toggleHeatmap,
    flyTo,
    addMarker,
  } = useMap(containerRef, resolvedTheme, handleReady);

  // ── Bid editing mode ───────────────────────────────────
  const bidState = location.state as BidEditState | null;
  const contract = bidState?.contract ?? null;
  const windows = contract ? (DELIVERY_WINDOWS[contract.code] ?? []) : [];

  const tabs: MapTab[] = useMemo(
    () =>
      windows.map((w) => ({
        id: w.code,
        label: w.label,
        icon: Calendar,
        closable: false,
      })),
    [windows],
  );

  const [activeTabId, setActiveTabId] = useState<string>(
    () => bidState?.initialWindowCode ?? windows[0]?.code ?? '',
  );

  const activeWindow: DeliveryWindow | undefined = windows.find(
    (w) => w.code === activeTabId,
  );

  const isBidMode = contract !== null && windows.length > 0;

  const closeBidMode = useCallback(() => {
    navigate('/bids', { replace: true });
  }, [navigate]);

  // ── Search handler ─────────────────────────────────────
  const handleSearch = useCallback(
    (query: string) => {
      const coordMatch = query.match(
        /^\s*(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)\s*$/,
      );
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          flyTo(lng, lat);
          addMarker(lng, lat);
          return;
        }
      }

      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      )
        .then((r) => r.json())
        .then((results) => {
          if (results.length > 0) {
            const { lat, lon } = results[0];
            flyTo(parseFloat(lon), parseFloat(lat));
          }
        })
        .catch(() => {});
    },
    [flyTo, addMarker],
  );

  return (
    <div className="relative flex h-screen w-screen flex-col">
      {/* ── Tab bar (bid mode only) ──────────────────────── */}
      {isBidMode && (
        <MapTabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          leadingAction={
            <Button variant="ghost" size="icon-sm" onClick={closeBidMode}>
              <ArrowLeft />
            </Button>
          }
        />
      )}

      {/* ── Map + editor layout ──────────────────────────── */}
      <div className="relative flex flex-1 min-h-0">
        {/* Map container */}
        <div className="relative flex-1">
          <div
            ref={containerRef}
            className="size-full transition-opacity duration-700 ease-out"
            style={{ opacity: mapReady ? 1 : 0 }}
          />

          {/* Floating back button (normal mode only) */}
          {!isBidMode && (
            <Button
              variant="outline"
              size="icon"
              className="absolute top-3 left-3 z-30 size-9 rounded-full bg-background/80 shadow-md backdrop-blur-sm animate-in fade-in slide-in-from-left-2 duration-200"
              onClick={() => navigate('/')}
            >
              <ArrowLeft />
            </Button>
          )}

          <MapBottomTabs
            onDataLoaded={onDataLoaded}
            onToggleClusters={toggleClusters}
            onToggleHeatmap={toggleHeatmap}
            onSearch={handleSearch}
          />
        </div>

        {/* ── Right-side editor panel (bid mode only) ──── */}
        {isBidMode && activeWindow && (
          <div className="w-80 shrink-0 border-l border-border">
            <BidMapEditor
              contract={contract}
              window={activeWindow}
              onSave={closeBidMode}
              onCancel={closeBidMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
