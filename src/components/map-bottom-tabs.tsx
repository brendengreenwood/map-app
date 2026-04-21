import { useState, useRef } from 'react';
import { Layers, Search, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { loadGeoJSON, loadCSV, generateData } from '@/worker-client';
import { fetchFeaturesGeoJSON, bulkInsert, fetchStats, clearFeatures } from '@/lib/api';

type TabId = 'layers' | 'search' | 'data';

const tabs: { id: TabId; label: string; icon: typeof Layers }[] = [
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'data', label: 'Data', icon: Database },
];

interface MapBottomTabsProps {
  onDataLoaded: (count: number) => void;
  onToggleClusters: (enabled: boolean) => void;
  onToggleHeatmap: (enabled: boolean) => void;
  onSearch: (query: string) => void;
}

export function MapBottomTabs({
  onDataLoaded,
  onToggleClusters,
  onToggleHeatmap,
  onSearch,
}: MapBottomTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [clustersOn, setClustersOn] = useState(true);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateCount, setGenerateCount] = useState('100000');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dbStats, setDbStats] = useState<{ total: number; categories: { category: string; count: number }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggle(id: TabId) {
    setActiveTab((prev) => (prev === id ? null : id));
  }

  // ── Data handlers ──

  async function handleFileLoad(file: File) {
    setLoading(true);
    setStatusMessage(`Loading ${file.name}...`);
    try {
      const text = await file.text();
      const isCSV = file.name.endsWith('.csv');
      const count = isCSV ? await loadCSV(text) : await loadGeoJSON(text);
      setStatusMessage(`Loaded ${count.toLocaleString()} points from ${file.name}`);
      onDataLoaded(count);
    } catch (err) {
      setStatusMessage(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    const count = parseInt(generateCount, 10) || 100000;
    setLoading(true);
    setStatusMessage(`Generating ${count.toLocaleString()} points...`);
    setShowGenerate(false);
    try {
      const loaded = await generateData(count);
      setStatusMessage(`Generated ${loaded.toLocaleString()} points`);
      onDataLoaded(loaded);
    } catch (err) {
      setStatusMessage(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadFromDb() {
    setLoading(true);
    setStatusMessage('Loading from database...');
    try {
      const geojson = await fetchFeaturesGeoJSON();
      const count = await loadGeoJSON(JSON.stringify(geojson));
      setStatusMessage(`Loaded ${count.toLocaleString()} points from database`);
      onDataLoaded(count);
    } catch (err) {
      setStatusMessage(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToDb() {
    setLoading(true);
    setStatusMessage('Saving to database...');
    try {
      const { getAllFeatures } = await import('@/worker-client');
      const data = await getAllFeatures() as GeoJSON.FeatureCollection;
      if (!data.features.length) {
        setStatusMessage('No data to save');
        setLoading(false);
        return;
      }

      const features = data.features.map((f) => ({
        lng: (f.geometry as GeoJSON.Point).coordinates[0],
        lat: (f.geometry as GeoJSON.Point).coordinates[1],
        name: f.properties?.name,
        category: f.properties?.category,
        value: f.properties?.value,
      }));

      const BATCH = 10000;
      let inserted = 0;
      for (let i = 0; i < features.length; i += BATCH) {
        const chunk = features.slice(i, i + BATCH);
        const result = await bulkInsert(chunk);
        inserted += result.inserted;
        setStatusMessage(`Saving... ${inserted.toLocaleString()} / ${features.length.toLocaleString()}`);
      }
      setStatusMessage(`Saved ${inserted.toLocaleString()} points to database`);
    } catch (err) {
      setStatusMessage(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDbStats() {
    try {
      const stats = await fetchStats();
      setDbStats(stats);
    } catch {
      setStatusMessage('Error: could not reach API server');
    }
  }

  async function handleClearDb() {
    setLoading(true);
    try {
      const result = await clearFeatures();
      setStatusMessage(`Cleared ${result.deleted.toLocaleString()} features from database`);
      setDbStats(null);
    } catch (err) {
      setStatusMessage(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit() {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  }

  // ── Panel content ──

  function renderPanel() {
    switch (activeTab) {
      case 'layers':
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="clusters-toggle" className="text-sm cursor-pointer">Clusters</Label>
              <Switch
                id="clusters-toggle"
                checked={clustersOn}
                onCheckedChange={(checked) => { setClustersOn(checked); onToggleClusters(checked); }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="heatmap-toggle" className="text-sm cursor-pointer">Heatmap</Label>
              <Switch
                id="heatmap-toggle"
                checked={heatmapOn}
                onCheckedChange={(checked) => { setHeatmapOn(checked); onToggleHeatmap(checked); }}
              />
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Lat, Lng or place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="secondary" onClick={handleSearchSubmit}>Go</Button>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" disabled={loading} onClick={() => fileInputRef.current?.click()}>
                Load File
              </Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={loading} onClick={() => setShowGenerate(!showGenerate)}>
                Generate
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json,.csv"
              className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileLoad(file); e.target.value = ''; }}
            />
            {showGenerate && (
              <div className="flex items-center gap-2">
                <Input type="number" value={generateCount} onChange={(e) => setGenerateCount(e.target.value)} min={1000} max={10000000} step={1000} className="h-8 text-sm" />
                <Button size="sm" onClick={handleGenerate} disabled={loading}>Go</Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" disabled={loading} onClick={handleLoadFromDb}>Load DB</Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={loading} onClick={handleSaveToDb}>Save to DB</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" disabled={loading} onClick={handleDbStats}>Stats</Button>
              <Button variant="destructive" size="sm" className="flex-1" disabled={loading} onClick={handleClearDb}>Clear DB</Button>
            </div>
            {dbStats && (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                <div><b>{dbStats.total.toLocaleString()}</b> features in DB</div>
                {dbStats.categories.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dbStats.categories.slice(0, 5).map((c) => (
                      <Badge key={c.category} variant="secondary" className="text-xs">
                        {c.category}: {c.count.toLocaleString()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            {statusMessage && (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                {loading && <Spinner className="mr-2 inline-block size-3" />}
                {statusMessage}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex flex-col items-center pb-3 px-3">
      {/* Tab bar — floating pill */}
      <div className="relative flex w-full max-w-md rounded-2xl border bg-background/90 shadow-lg backdrop-blur-sm">
        {tabs.map((tab) => (
          <div key={tab.id} className="relative flex-1">
            {/* Panel slides up from this tab */}
            {activeTab === tab.id && (
              <div
                key={tab.id + '-panel'}
                className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 animate-in slide-in-from-bottom-2 fade-in duration-150"
                style={{
                  width: 'max-content',
                  maxWidth: 'min(320px, 90vw)',
                  minWidth: 200,
                }}
              >
                <div className="rounded-xl border bg-card p-3 text-card-foreground shadow-lg">
                  {renderPanel()}
                </div>
              </div>
            )}
            <div className="p-1.5">
              <button
                onClick={() => toggle(tab.id)}
                className={`flex w-full flex-col items-center gap-0.5 rounded-lg py-1.5 text-xs transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted hover:ring-1 hover:ring-ring/30'
                }`}
              >
                <tab.icon className="size-5" />
                <span>{tab.label}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
