import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CARTO_URLS, applySproutTheme } from '@/lib/map-styles';
import type { ResolvedTheme } from '@/hooks/use-users';
import type { Originator, ProducerGeo } from '@/lib/api';
import { UNASSIGNED_COLOR } from '@/lib/originator-colors';

const PRODUCER_SRC = 'producers-src';
const PRODUCER_LAYER = 'producers-layer';
const FACILITY_SRC = 'facility-src';
const FACILITY_LAYER = 'facility-layer';

/** Cargill Sidney, OH — the demo facility. */
export const CARGILL_SIDNEY: { lng: number; lat: number; name: string } = {
  lng: -84.1555,
  lat: 40.2842,
  name: 'Cargill Sidney',
};

function buildProducerFeatures(
  producers: ProducerGeo[],
  selectedIds: Set<string>
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: producers.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        name: p.name,
        commodity: p.commodity ?? '',
        county: p.county ?? '',
        farm_size_acres: p.farm_size_acres ?? 0,
        originator_id: p.originator_id ?? '',
        selected: selectedIds.has(p.id) ? 1 : 0,
      },
    })),
  };
}

/** Build the producer circle-color paint expression from the loaded palette. */
function buildCircleColorExpr(originators: Originator[]): maplibregl.ExpressionSpecification {
  // Each entry contributes [match-key, color] pairs to the `match` expression.
  const matchPairs: (string | string[])[] = [];
  for (const o of originators) {
    matchPairs.push(o.id, o.color);
  }
  // Fall-through color for unassigned producers.
  const territoryExpr: maplibregl.ExpressionSpecification =
    originators.length > 0
      ? (['match', ['get', 'originator_id'], ...matchPairs, UNASSIGNED_COLOR] as unknown as maplibregl.ExpressionSpecification)
      : (UNASSIGNED_COLOR as unknown as maplibregl.ExpressionSpecification);

  return [
    'case',
    ['==', ['get', 'selected'], 1],
    '#e8a735',
    territoryExpr,
  ] as unknown as maplibregl.ExpressionSpecification;
}

function addSelectionLayers(map: maplibregl.Map, originators: Originator[]) {
  if (!map.getSource(PRODUCER_SRC)) {
    map.addSource(PRODUCER_SRC, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getSource(FACILITY_SRC)) {
    map.addSource(FACILITY_SRC, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  if (map.getLayer(PRODUCER_LAYER)) map.removeLayer(PRODUCER_LAYER);

  map.addLayer({
    id: PRODUCER_LAYER,
    type: 'circle',
    source: PRODUCER_SRC,
    paint: {
      'circle-radius': ['case', ['==', ['get', 'selected'], 1], 6, 4],
      'circle-color': buildCircleColorExpr(originators),
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'selected'], 1],
        '#1f1f1f',
        '#ffffff',
      ],
      'circle-stroke-width': [
        'case',
        ['==', ['get', 'selected'], 1],
        2.5,
        1,
      ],
      'circle-opacity': 0.92,
    },
  });

  if (!map.getLayer(FACILITY_LAYER)) {
    map.addLayer({
      id: FACILITY_LAYER,
      type: 'circle',
      source: FACILITY_SRC,
      paint: {
        'circle-radius': 12,
        'circle-color': '#1f3b0f',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
      },
    });
  }
}

interface UseSelectionMapOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  theme: ResolvedTheme;
  facility?: { lng: number; lat: number; name: string };
  originators?: Originator[];
}

export function useSelectionMap({
  containerRef,
  theme,
  facility = CARGILL_SIDNEY,
  originators = [],
}: UseSelectionMapOptions) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const producersRef = useRef<ProducerGeo[]>([]);
  const selectedRef = useRef<Set<string>>(new Set());
  const originatorsRef = useRef<Originator[]>(originators);
  const readyRef = useRef(false);

  const refreshProducerData = useCallback(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(PRODUCER_SRC) as maplibregl.GeoJSONSource | undefined;
    src?.setData(buildProducerFeatures(producersRef.current, selectedRef.current));
  }, []);

  const refreshFacility = useCallback(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(FACILITY_SRC) as maplibregl.GeoJSONSource | undefined;
    src?.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [facility.lng, facility.lat] },
          properties: { name: facility.name },
        },
      ],
    });
  }, [facility.lng, facility.lat, facility.name]);

  useEffect(() => {
    if (!containerRef.current) return;
    const cartoUrl = theme === 'dark' ? CARTO_URLS.dark : CARTO_URLS.light;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: cartoUrl,
      center: [facility.lng, facility.lat],
      zoom: 9,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      applySproutTheme(map, theme);
      addSelectionLayers(map, originatorsRef.current);
      readyRef.current = true;
      refreshFacility();
      refreshProducerData();
    });

    mapRef.current = map;
    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // intentionally only initialise once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme changes restyle the map; re-add layers afterwards.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const cartoUrl = theme === 'dark' ? CARTO_URLS.dark : CARTO_URLS.light;
    map.setStyle(cartoUrl);
    map.once('style.load', () => {
      applySproutTheme(map, theme);
      addSelectionLayers(map, originatorsRef.current);
      refreshFacility();
      refreshProducerData();
    });
  }, [theme, refreshFacility, refreshProducerData]);

  // When the originator list arrives (after fetch), rebuild the producer layer
  // so the territory color palette takes effect.
  useEffect(() => {
    originatorsRef.current = originators;
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    addSelectionLayers(map, originators);
    refreshProducerData();
  }, [originators, refreshProducerData]);

  const setProducers = useCallback(
    (producers: ProducerGeo[]) => {
      producersRef.current = producers;
      refreshProducerData();
    },
    [refreshProducerData]
  );

  const setSelected = useCallback(
    (ids: Set<string>) => {
      selectedRef.current = ids;
      refreshProducerData();
    },
    [refreshProducerData]
  );

  const flyToFacility = useCallback(() => {
    mapRef.current?.flyTo({
      center: [facility.lng, facility.lat],
      zoom: 9,
      essential: true,
    });
  }, [facility.lng, facility.lat]);

  return {
    mapRef,
    setProducers,
    setSelected,
    flyToFacility,
  };
}
