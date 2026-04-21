import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMap } from '@/hooks/use-map';
import { useUsers } from '@/hooks/use-users';
import { MapBottomTabs } from '@/components/map-bottom-tabs';
import { Button } from '@/components/ui/button';

export default function MapPage() {
  const navigate = useNavigate();
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

  const handleSearch = useCallback((query: string) => {
    const coordMatch = query.match(/^\s*(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)\s*$/);
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
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    )
      .then((r) => r.json())
      .then((results) => {
        if (results.length > 0) {
          const { lat, lon } = results[0];
          flyTo(parseFloat(lon), parseFloat(lat));
        }
      })
      .catch(() => {});
  }, [flyTo, addMarker]);

  return (
    <div className="relative h-screen w-screen">
      <div
        ref={containerRef}
        className="size-full transition-opacity duration-700 ease-out"
        style={{ opacity: mapReady ? 1 : 0 }}
      />

      {/* Floating back button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-3 left-3 z-30 size-9 rounded-full bg-background/80 shadow-md backdrop-blur-sm animate-in fade-in slide-in-from-left-2 duration-200"
        onClick={() => navigate('/')}
      >
        <ArrowLeft />
      </Button>

      <MapBottomTabs
        onDataLoaded={onDataLoaded}
        onToggleClusters={toggleClusters}
        onToggleHeatmap={toggleHeatmap}
        onSearch={handleSearch}
      />
    </div>
  );
}
