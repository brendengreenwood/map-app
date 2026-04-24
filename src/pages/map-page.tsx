import { useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import { mdiArrowLeft, mdiLoading, mdiPlus } from '@mdi/js';
import { useMap } from '@/hooks/use-map';
import { useUsers } from '@/hooks/use-users';
import { MapBottomTabs } from '@/components/map-bottom-tabs';
import { MapTabBar, type MapTab } from '@/components/map-tab-bar';
import { BidMapEditor } from '@/components/bid-map-editor';
import { CompetitorBidsPanel, type EditableCompetitorBid } from '@/components/competitor-bids-panel';
import { Button } from '@/components/ui/button';
import type { ScenarioRow, ElevatorRow } from '@/lib/api';

// ── State passed via navigate('/map', { state: ... }) ──

interface BidCreateState {
  mode: 'create';
  elevators: ElevatorRow[];
}

interface BidReviseState {
  mode: 'revise';
  scenario: ScenarioRow;
  initialWindowCode?: string;
}

export type BidEditState = BidCreateState | BidReviseState;

// Sentinel tab ID for the parent contract scenario
const CONTRACT_TAB = '__contract__';

/** A TOS window being built (create mode) or already existing (revise mode) */
export interface TosWindow {
  id: string;
  label: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  /** Override pricing — if undefined, inherits from contract */
  posted?: string;
  max?: string;
  leeway?: string;
  increment?: string;
  freight?: string;
}

let tosCounter = 0;

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
    setCompetitorMarkers,
  } = useMap(containerRef, resolvedTheme, handleReady);

  // ── Bid editing mode ───────────────────────────────────
  const bidState = location.state as BidEditState | null;
  const isCreateMode = bidState?.mode === 'create';
  const isReviseMode = bidState?.mode === 'revise';

  const scenario = isReviseMode ? bidState.scenario : null;

  // ── TOS window management ─────────────────────────────
  const [tosWindows, setTosWindows] = useState<TosWindow[]>(() => {
    if (!scenario) return [];
    // Seed from existing scenario windows, try to parse dates from label
    return scenario.windows.map((w) => {
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      // Labels look like "Jun 1 – Jun 15" — try to parse them
      const parts = w.window_label.split(' – ');
      if (parts.length === 2) {
        const year = new Date().getFullYear();
        const s = new Date(`${parts[0].trim()}, ${year}`);
        const e = new Date(`${parts[1].trim()}, ${year}`);
        if (!isNaN(s.getTime())) startDate = s;
        if (!isNaN(e.getTime())) endDate = e;
      }
      return {
        id: w.window_code,
        label: w.window_label,
        startDate,
        endDate,
        ...(w.posted != null ? { posted: `${w.posted}` } : {}),
        ...(w.max != null ? { max: `${w.max}` } : {}),
        ...(w.leeway != null ? { leeway: `${w.leeway}` } : {}),
        ...(w.increment != null ? { increment: `${w.increment}` } : {}),
        ...(w.freight != null ? { freight: `${w.freight}` } : {}),
      };
    });
  });

  const [activeTabId, setActiveTabId] = useState<string>(
    () =>
      (isReviseMode ? bidState.initialWindowCode : undefined) ?? CONTRACT_TAB,
  );

  // Publish button state (controlled by BidMapEditor)
  const [publishState, setPublishState] = useState<{
    save: () => void;
    disabled: boolean;
    saving: boolean;
  }>({ save: () => {}, disabled: true, saving: false });

  const addTosWindow = useCallback(() => {
    tosCounter += 1;
    const newWindow: TosWindow = {
      id: `tos-${tosCounter}`,
      label: `TOS ${tosCounter}`,
      startDate: undefined,
      endDate: undefined,
    };
    setTosWindows((prev) => [...prev, newWindow]);
    setActiveTabId(newWindow.id);
  }, []);

  const updateTosWindow = useCallback(
    (id: string, updates: Partial<TosWindow>) => {
      setTosWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      );
    },
    [],
  );

  // ── Tab computation ────────────────────────────────────
  const tabs: MapTab[] = useMemo(() => {
    const contractTab: MapTab = {
      id: CONTRACT_TAB,
      label: scenario
        ? `${scenario.contract_label} (ZC ${scenario.contract_code})`
        : 'Contract',
    };
    const windowTabs: MapTab[] = tosWindows.map((w) => ({
      id: w.id,
      label: w.label,
    }));
    return [contractTab, ...windowTabs];
  }, [scenario, tosWindows]);

  const isContractTab = activeTabId === CONTRACT_TAB;
  const activeTosWindow = isContractTab
    ? undefined
    : tosWindows.find((w) => w.id === activeTabId);

  // Also find the matching ScenarioWindowRow for revise mode
  const activeScenarioWindow =
    isReviseMode && !isContractTab
      ? scenario?.windows.find((w) => w.window_code === activeTabId)
      : undefined;

  const isBidMode = isCreateMode || isReviseMode;

  const closeBidMode = useCallback(() => {
    setCompetitorMarkers([]);
    navigate('/bids', { replace: true });
  }, [navigate, setCompetitorMarkers]);

  // ── Competitor contract code (driven by editor) ──────
  const [competitorContractCode, setCompetitorContractCode] = useState<string | null>(
    () => isReviseMode ? scenario?.contract_code ?? null : null,
  );

  // ── Lookback date (shared between editor + competitor bids panel) ──
  const [lookbackDate, setLookbackDate] = useState<Date>(() => new Date());

  const handleCompetitorBids = useCallback(
    (bids: EditableCompetitorBid[]) => {
      const markers = bids
        .filter((b) => b.competitor_lng != null && b.competitor_lat != null)
        .map((b) => ({
          lng: b.competitor_lng!,
          lat: b.competitor_lat!,
          name: b.competitor_name,
          posted: b.editedPosted ?? b.posted,
        }));
      setCompetitorMarkers(markers);
    },
    [setCompetitorMarkers],
  );

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
      {/* ── Tab bar (both create and revise modes) ── */}
      {isBidMode && (
        <MapTabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          leadingAction={
            <Button variant="ghost" size="icon-sm" onClick={closeBidMode}>
              <Icon path={mdiArrowLeft} />
            </Button>
          }
          inlineAction={
            <Button
              variant="secondary"
              size="sm"
              onClick={addTosWindow}
            >
              <Icon path={mdiPlus} className="size-4" />
              Add TOS
            </Button>
          }
          trailingAction={
            <Button
              size="sm"
              className="mx-1"
              onClick={publishState.save}
              disabled={publishState.disabled}
            >
              {publishState.saving && <Icon path={mdiLoading} className="mr-1.5 size-3.5 animate-spin" />}
              Publish
            </Button>
          }
        />
      )}

      {/* ── Map + editor layout ──────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        {/* Map container (full width) */}
        <div
          ref={containerRef}
          className="size-full transition-opacity duration-700 ease-out"
          style={{ opacity: mapReady ? 1 : 0 }}
        />

        {/* Floating back button (normal mode — no bid editing) */}
        {!isBidMode && (
          <Button
            variant="outline"
            size="icon"
            className="absolute top-3 left-3 z-30 size-9 rounded-full !bg-card shadow-md hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground hover:ring-1 hover:ring-ring/30 animate-in fade-in slide-in-from-left-2 duration-200"
            onClick={() => navigate('/')}
          >
            <Icon path={mdiArrowLeft} />
          </Button>
        )}

        {/* ── Floating left-side editor panel (bid mode only) ──── */}
        {isBidMode && (
          <div className="absolute top-3 left-3 bottom-3 z-30 w-80 rounded-xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-left-3 duration-300">
            <BidMapEditor
              mode={isCreateMode ? 'create' : 'revise'}
              scenario={scenario}
              activeWindow={activeScenarioWindow}
              activeTosWindow={activeTosWindow}
              isContractTab={isContractTab}
              elevators={isCreateMode ? bidState.elevators : undefined}
              tosWindows={tosWindows}
              onSave={closeBidMode}
              onCancel={closeBidMode}
              onUpdateTosWindow={updateTosWindow}
              onPublishStateChange={setPublishState}
              onContractCodeChange={setCompetitorContractCode}
              lookbackDate={lookbackDate}
              onLookbackDateChange={setLookbackDate}
            />
          </div>
        )}

        {/* ── Floating right-side competitor bids panel (bid mode only) ──── */}
        {isBidMode && (
          <div className="absolute top-3 right-3 bottom-3 z-30 w-72 rounded-xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-3 duration-300">
            <CompetitorBidsPanel
              contractCode={competitorContractCode}
              lookbackDate={lookbackDate}
              onBidsChange={handleCompetitorBids}
            />
          </div>
        )}

        <MapBottomTabs
          onDataLoaded={onDataLoaded}
          onToggleClusters={toggleClusters}
          onToggleHeatmap={toggleHeatmap}
          onSearch={handleSearch}
        />
      </div>
    </div>
  );
}
