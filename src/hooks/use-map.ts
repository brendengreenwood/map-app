import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getClusters, getExpansionZoom, getAllFeatures } from '@/worker-client';
import { CARTO_URLS, applySproutTheme } from '@/lib/map-styles';
import type { ResolvedTheme } from '@/hooks/use-users';

// Sprout-themed data layer colors
const CLUSTER_COLORS = {
  small: '#4d8c2a',   // green-300 — small clusters
  medium: '#8cc63f',  // green-200 — medium clusters
  large: '#e8a735',   // warm amber — large clusters
  huge: '#d94040',    // emphasis red — huge clusters
  stroke: '#ffffff',
  label: '#1f3b0f',   // green-700
  point: '#2d5016',   // green-400 — unclustered points
};

const HEATMAP_COLORS = [
  'interpolate', ['linear'], ['heatmap-density'],
  0, 'rgba(0,0,0,0)',
  0.2, 'rgba(45,80,22,0.4)',    // green-400 faint
  0.4, 'rgba(140,198,63,0.6)',  // green-200
  0.6, 'rgba(232,167,53,0.75)', // warm amber
  0.8, 'rgba(217,64,64,0.85)',  // emphasis red
  1, 'rgba(180,30,30,0.95)',
] as const;

function addLayers(map: maplibregl.Map, heatmapVisible: boolean) {
  map.addSource('clusters', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addSource('heatmap-source', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'cluster-circles',
    type: 'circle',
    source: 'clusters',
    filter: ['has', 'cluster'],
    paint: {
      'circle-color': [
        'step', ['get', 'point_count'],
        CLUSTER_COLORS.small, 100,
        CLUSTER_COLORS.medium, 750,
        CLUSTER_COLORS.large, 5000,
        CLUSTER_COLORS.huge,
      ],
      'circle-radius': [
        'step', ['get', 'point_count'],
        16, 100, 22, 750, 28, 5000, 34,
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': CLUSTER_COLORS.stroke,
      'circle-opacity': 0.9,
    },
  });

  map.addLayer({
    id: 'cluster-labels',
    type: 'symbol',
    source: 'clusters',
    filter: ['has', 'cluster'],
    layout: {
      'text-field': [
        'case',
        ['>=', ['get', 'point_count'], 1000000],
        ['concat', ['to-string', ['/', ['round', ['/', ['get', 'point_count'], 100000]], 10]], 'M'],
        ['>=', ['get', 'point_count'], 1000],
        ['concat', ['to-string', ['/', ['round', ['/', ['get', 'point_count'], 100]], 10]], 'K'],
        ['to-string', ['get', 'point_count']],
      ],
      'text-size': 12,
      'text-allow-overlap': true,
    },
    paint: { 'text-color': CLUSTER_COLORS.label },
  });

  map.addLayer({
    id: 'unclustered-points',
    type: 'circle',
    source: 'clusters',
    filter: ['!', ['has', 'cluster']],
    paint: {
      'circle-color': CLUSTER_COLORS.point,
      'circle-radius': 5,
      'circle-stroke-width': 1,
      'circle-stroke-color': CLUSTER_COLORS.stroke,
      'circle-opacity': 0.85,
    },
  });

  map.addLayer({
    id: 'heatmap-layer',
    type: 'heatmap',
    source: 'heatmap-source',
    layout: { visibility: heatmapVisible ? 'visible' : 'none' },
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 9, 30],
      'heatmap-opacity': 0.7,
      'heatmap-color': HEATMAP_COLORS as unknown as maplibregl.ExpressionSpecification,
    },
  });
}

export function useMap(containerRef: React.RefObject<HTMLDivElement | null>, theme: ResolvedTheme = 'light', onReady?: () => void) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const clustersEnabled = useRef(true);
  const heatmapEnabled = useRef(false);
  const totalRef = useRef(0);
  const themeRef = useRef(theme);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updateClusters = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !totalRef.current || !clustersEnabled.current) return;

    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth(),
    ];
    const clusters = await getClusters(bbox, map.getZoom()) as GeoJSON.Feature[];
    const source = map.getSource('clusters') as maplibregl.GeoJSONSource;
    source?.setData({ type: 'FeatureCollection', features: clusters });
  }, []);

  const debouncedUpdateClusters = useCallback(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(updateClusters, 150);
  }, [updateClusters]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const cartoUrl = theme === 'dark' ? CARTO_URLS.dark : CARTO_URLS.light;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: cartoUrl,
      center: [0, 20],
      zoom: 2,
      maxZoom: 18,
      fadeDuration: 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.on('load', () => {
      applySproutTheme(map, theme);
      addLayers(map, false);
      map.on('moveend', debouncedUpdateClusters);
      map.on('zoomend', debouncedUpdateClusters);
      onReady?.();

      map.on('click', 'cluster-circles', async (e) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== 'Point') return;
        const zoom = await getExpansionZoom(feature.properties.cluster_id);
        map.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom,
        });
      });

      map.on('click', 'unclustered-points', (e) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== 'Point') return;
        const props = feature.properties;
        const container = document.createElement('div');
        container.className = 'text-sm leading-relaxed';
        const entries = Object.entries(props).filter(([k]) => k !== 'id');
        if (entries.length === 0) {
          container.textContent = 'No properties';
        } else {
          for (const [k, v] of entries) {
            const row = document.createElement('div');
            const label = document.createElement('b');
            label.textContent = `${k}: `;
            row.appendChild(label);
            row.appendChild(document.createTextNode(String(v)));
            container.appendChild(row);
          }
        }
        new maplibregl.Popup({ maxWidth: '300px' })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setDOMContent(container)
          .addTo(map);
      });

      for (const layer of ['cluster-circles', 'unclustered-points']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }
    });

    mapRef.current = map;

    return () => {
      clearTimeout(debounceTimer.current);
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [containerRef, updateClusters, debouncedUpdateClusters]);

  const onDataLoaded = useCallback(async (count: number) => {
    totalRef.current = count;

    if (heatmapEnabled.current) {
      const allData = await getAllFeatures() as GeoJSON.FeatureCollection;
      const source = mapRef.current?.getSource('heatmap-source') as maplibregl.GeoJSONSource;
      source?.setData(allData);
    }

    updateClusters();
  }, [updateClusters]);

  const setTheme = useCallback((newTheme: ResolvedTheme) => {
    const map = mapRef.current;
    if (!map) return;
    const cartoUrl = newTheme === 'dark' ? CARTO_URLS.dark : CARTO_URLS.light;
    map.setStyle(cartoUrl);
    map.once('style.load', () => {
      applySproutTheme(map, newTheme);
      addLayers(map, heatmapEnabled.current);
      if (!clustersEnabled.current) {
        map.setLayoutProperty('cluster-circles', 'visibility', 'none');
        map.setLayoutProperty('cluster-labels', 'visibility', 'none');
        map.setLayoutProperty('unclustered-points', 'visibility', 'none');
      }
      if (totalRef.current > 0) {
        updateClusters();
        if (heatmapEnabled.current) {
          getAllFeatures().then((data) => {
            const source = map.getSource('heatmap-source') as maplibregl.GeoJSONSource;
            source?.setData(data as GeoJSON.FeatureCollection);
          });
        }
      }
    });
  }, [updateClusters]);

  // React to theme changes
  useEffect(() => {
    if (themeRef.current !== theme) {
      themeRef.current = theme;
      setTheme(theme);
    }
  }, [theme, setTheme]);

  const toggleClusters = useCallback((enabled: boolean) => {
    clustersEnabled.current = enabled;
    const map = mapRef.current;
    if (!map) return;
    const vis = enabled ? 'visible' : 'none';
    try {
      map.setLayoutProperty('cluster-circles', 'visibility', vis);
      map.setLayoutProperty('cluster-labels', 'visibility', vis);
      map.setLayoutProperty('unclustered-points', 'visibility', vis);
    } catch { /* layers may not exist yet */ }
    if (enabled) updateClusters();
  }, [updateClusters]);

  const toggleHeatmap = useCallback(async (enabled: boolean) => {
    heatmapEnabled.current = enabled;
    const map = mapRef.current;
    if (!map) return;
    try {
      map.setLayoutProperty('heatmap-layer', 'visibility', enabled ? 'visible' : 'none');
    } catch { /* layer may not exist yet */ }
    if (enabled && totalRef.current > 0) {
      const allData = await getAllFeatures() as GeoJSON.FeatureCollection;
      const source = map.getSource('heatmap-source') as maplibregl.GeoJSONSource;
      source?.setData(allData);
    }
  }, []);

  const flyTo = useCallback((lng: number, lat: number, zoom = 12) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom });
  }, []);

  const addMarker = useCallback((lng: number, lat: number) => {
    if (!mapRef.current) return;
    const marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(mapRef.current);
    markersRef.current.push(marker);
  }, []);

  return {
    map: mapRef,
    onDataLoaded,
    toggleClusters,
    toggleHeatmap,
    flyTo,
    addMarker,
  };
}
