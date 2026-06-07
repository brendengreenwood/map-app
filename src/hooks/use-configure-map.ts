import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CARTO_URLS, applySproutTheme } from '@/lib/map-styles';
import type { ResolvedTheme } from '@/hooks/use-users';
import type { CompetitiveZone, ConfigureCompetitor } from '@/lib/api';

const FACILITY_SRC = 'cfg-facility-src';
const FACILITY_LAYER = 'cfg-facility-layer';
const COMP_SRC = 'cfg-competitor-src';
const COMP_LAYER = 'cfg-competitor-layer';
const COMP_LABEL_LAYER = 'cfg-competitor-label';
const ZONE_SRC = 'cfg-zones-src';
const ZONE_FILL_LAYER = 'cfg-zones-fill';
const ZONE_LINE_LAYER = 'cfg-zones-line';

/** Color used for the merchant facility — primary accent for the user's own zone. */
const FACILITY_COLOR = '#1f3b0f';
const COMPETITOR_COLOR = '#c0392b';

function competitorsToFc(competitors: ConfigureCompetitor[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: competitors.map((c) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
      properties: {
        id: c.id,
        name: c.name,
        posted: c.posted ?? 0,
        label: c.posted != null ? `${c.name} · ${(c.posted / 100).toFixed(2)}` : c.name,
      },
    })),
  };
}

function zonesToFc(zones: CompetitiveZone[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => ({
      type: 'Feature',
      geometry: z.polygon,
      properties: {
        partyId: z.partyId,
        partyName: z.partyName,
        color: z.color,
      },
    })),
  };
}

function addLayers(map: maplibregl.Map) {
  if (!map.getSource(ZONE_SRC)) {
    map.addSource(ZONE_SRC, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
  if (!map.getSource(COMP_SRC)) {
    map.addSource(COMP_SRC, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
  if (!map.getSource(FACILITY_SRC)) {
    map.addSource(FACILITY_SRC, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  // Zones sit underneath markers, so add fill + line first.
  if (!map.getLayer(ZONE_FILL_LAYER)) {
    map.addLayer({
      id: ZONE_FILL_LAYER,
      type: 'fill',
      source: ZONE_SRC,
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.25,
      },
    });
  }
  if (!map.getLayer(ZONE_LINE_LAYER)) {
    map.addLayer({
      id: ZONE_LINE_LAYER,
      type: 'line',
      source: ZONE_SRC,
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 1.5,
        'line-opacity': 0.85,
      },
    });
  }

  if (!map.getLayer(COMP_LAYER)) {
    map.addLayer({
      id: COMP_LAYER,
      type: 'circle',
      source: COMP_SRC,
      paint: {
        'circle-radius': 8,
        'circle-color': COMPETITOR_COLOR,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });
  }

  if (!map.getLayer(COMP_LABEL_LAYER)) {
    map.addLayer({
      id: COMP_LABEL_LAYER,
      type: 'symbol',
      source: COMP_SRC,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 11,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#1f1f1f',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    });
  }

  if (!map.getLayer(FACILITY_LAYER)) {
    map.addLayer({
      id: FACILITY_LAYER,
      type: 'circle',
      source: FACILITY_SRC,
      paint: {
        'circle-radius': 13,
        'circle-color': FACILITY_COLOR,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
      },
    });
  }
}

interface UseConfigureMapOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  theme: ResolvedTheme;
  facility: { id: string; lng: number; lat: number; name: string };
}

export function useConfigureMap({ containerRef, theme, facility }: UseConfigureMapOptions) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const competitorsRef = useRef<ConfigureCompetitor[]>([]);
  const zonesRef = useRef<CompetitiveZone[]>([]);
  const facilityRef = useRef(facility);
  const readyRef = useRef(false);

  const refreshFacility = useCallback(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const f = facilityRef.current;
    const src = map.getSource(FACILITY_SRC) as maplibregl.GeoJSONSource | undefined;
    src?.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
          properties: { name: f.name },
        },
      ],
    });
  }, []);

  const refreshCompetitors = useCallback(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(COMP_SRC) as maplibregl.GeoJSONSource | undefined;
    src?.setData(competitorsToFc(competitorsRef.current));
  }, []);

  const refreshZones = useCallback(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(ZONE_SRC) as maplibregl.GeoJSONSource | undefined;
    src?.setData(zonesToFc(zonesRef.current));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const cartoUrl = theme === 'dark' ? CARTO_URLS.dark : CARTO_URLS.light;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: cartoUrl,
      center: [facility.lng, facility.lat],
      zoom: 8,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      applySproutTheme(map, theme);
      addLayers(map);
      readyRef.current = true;
      refreshFacility();
      refreshCompetitors();
      refreshZones();
    });

    mapRef.current = map;
    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const cartoUrl = theme === 'dark' ? CARTO_URLS.dark : CARTO_URLS.light;
    map.setStyle(cartoUrl);
    map.once('style.load', () => {
      applySproutTheme(map, theme);
      addLayers(map);
      refreshFacility();
      refreshCompetitors();
      refreshZones();
    });
  }, [theme, refreshFacility, refreshCompetitors, refreshZones]);

  // When the facility prop changes, fly to it.
  useEffect(() => {
    facilityRef.current = facility;
    refreshFacility();
    mapRef.current?.flyTo({ center: [facility.lng, facility.lat], zoom: 8, essential: true });
  }, [facility, refreshFacility]);

  const setCompetitors = useCallback(
    (competitors: ConfigureCompetitor[]) => {
      competitorsRef.current = competitors;
      refreshCompetitors();
    },
    [refreshCompetitors],
  );

  const setZones = useCallback(
    (zones: CompetitiveZone[]) => {
      zonesRef.current = zones;
      refreshZones();
    },
    [refreshZones],
  );

  const flyToCompetitor = useCallback((id: string) => {
    const c = competitorsRef.current.find((x) => x.id === id);
    if (!c) return;
    mapRef.current?.flyTo({ center: [c.lng, c.lat], zoom: 10, essential: true });
  }, []);

  return { mapRef, setCompetitors, setZones, flyToCompetitor };
}
