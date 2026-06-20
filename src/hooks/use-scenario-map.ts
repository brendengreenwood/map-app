import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CARTO_URLS, applyMapTheme } from '@/lib/map-styles';
import type { ResolvedTheme } from '@/hooks/use-users';
import type {
  CompetitiveZone,
  ConfigureCompetitor,
  Originator,
  ProducerGeo,
} from '@/lib/api';
import { UNASSIGNED_COLOR } from '@/lib/originator-colors';

// --- Source / layer IDs -----------------------------------------------------
// Configure (zones + competitors + facility) layers
const FACILITY_SRC = 'scn-facility-src';
const FACILITY_LAYER = 'scn-facility-layer';
const COMP_SRC = 'scn-competitor-src';
const COMP_LAYER = 'scn-competitor-layer';
const COMP_LABEL_LAYER = 'scn-competitor-label';
const ZONE_SRC = 'scn-zones-src';
const ZONE_FILL_LAYER = 'scn-zones-fill';
const ZONE_LINE_LAYER = 'scn-zones-line';
// Producer (selection) layers
const PRODUCER_SRC = 'scn-producers-src';
const PRODUCER_LAYER = 'scn-producers-layer';

const FACILITY_COLOR = '#1f3b0f';
const COMPETITOR_COLOR = '#c0392b';

/** Cargill Sidney, OH — the demo facility (fallback when no facility is provided). */
export const CARGILL_SIDNEY: { lng: number; lat: number; name: string } = {
  lng: -84.1555,
  lat: 40.2842,
  name: 'Cargill Sidney',
};

// --- GeoJSON builders -------------------------------------------------------

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

function buildProducerFeatures(
  producers: ProducerGeo[],
  selectedIds: Set<string>,
  eligibleIds: Set<string> | null
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
        eligible: eligibleIds === null || eligibleIds.has(p.id) ? 1 : 0,
      },
    })),
  };
}

function buildCircleColorExpr(originators: Originator[]): maplibregl.ExpressionSpecification {
  const matchPairs: (string | string[])[] = [];
  for (const o of originators) {
    matchPairs.push(o.id, o.color);
  }
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

// --- Layer setup ------------------------------------------------------------
// Z-order (bottom → top):
//   1. competitive zone fills + lines
//   2. producers
//   3. facility
//   4. competitor markers + labels

function addScenarioLayers(map: maplibregl.Map, originators: Originator[]) {
  if (!map.getSource(ZONE_SRC)) {
    map.addSource(ZONE_SRC, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
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
  if (!map.getSource(COMP_SRC)) {
    map.addSource(COMP_SRC, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }

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

  // Producer layer — always rebuild so palette updates take effect.
  if (map.getLayer(PRODUCER_LAYER)) map.removeLayer(PRODUCER_LAYER);
  map.addLayer({
    id: PRODUCER_LAYER,
    type: 'circle',
    source: PRODUCER_SRC,
    paint: {
      'circle-radius': [
        'case',
        ['==', ['get', 'selected'], 1], 6,
        ['==', ['get', 'eligible'], 0], 3,
        4,
      ],
      'circle-color': [
        'case',
        ['==', ['get', 'eligible'], 0],
        '#999999',
        buildCircleColorExpr(originators),
      ] as unknown as maplibregl.ExpressionSpecification,
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'selected'], 1],
        '#1f1f1f',
        '#ffffff',
      ],
      'circle-stroke-width': [
        'case',
        ['==', ['get', 'selected'], 1], 2.5,
        ['==', ['get', 'eligible'], 0], 0.5,
        1,
      ],
      'circle-opacity': [
        'case',
        ['==', ['get', 'eligible'], 0], 0.25,
        0.92,
      ],
    },
  });

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
}

// --- Hook -------------------------------------------------------------------

interface UseScenarioMapOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  theme: ResolvedTheme;
  facility?: { id?: string; lng: number; lat: number; name: string };
  originators?: Originator[];
}

export function useScenarioMap({
  containerRef,
  theme,
  facility = CARGILL_SIDNEY,
  originators = [],
}: UseScenarioMapOptions) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const competitorsRef = useRef<ConfigureCompetitor[]>([]);
  const zonesRef = useRef<CompetitiveZone[]>([]);
  const producersRef = useRef<ProducerGeo[]>([]);
  const selectedRef = useRef<Set<string>>(new Set());
  const eligibleRef = useRef<Set<string> | null>(null);
  const facilityRef = useRef(facility);
  const originatorsRef = useRef<Originator[]>(originators);
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

  const refreshProducers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(PRODUCER_SRC) as maplibregl.GeoJSONSource | undefined;
    src?.setData(
      buildProducerFeatures(producersRef.current, selectedRef.current, eligibleRef.current)
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const cartoUrl = theme === 'dark' ? CARTO_URLS.dark : CARTO_URLS.light;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: cartoUrl,
      center: [facility.lng, facility.lat],
      zoom: 9,
    });

    // zoom controls rendered as React UI (see MapScenarioPage)

    map.on('load', () => {
      applyMapTheme(map, theme);
      addScenarioLayers(map, originatorsRef.current);
      readyRef.current = true;
      refreshFacility();
      refreshCompetitors();
      refreshZones();
      refreshProducers();
    });

    mapRef.current = map;
    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme switch: restyle and re-add layers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const cartoUrl = theme === 'dark' ? CARTO_URLS.dark : CARTO_URLS.light;
    map.setStyle(cartoUrl);
    map.once('style.load', () => {
      applyMapTheme(map, theme);
      addScenarioLayers(map, originatorsRef.current);
      refreshFacility();
      refreshCompetitors();
      refreshZones();
      refreshProducers();
    });
  }, [theme, refreshFacility, refreshCompetitors, refreshZones, refreshProducers]);

  // When originators arrive (after fetch), rebuild the producer layer
  // so the territory color palette takes effect.
  useEffect(() => {
    originatorsRef.current = originators;
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    addScenarioLayers(map, originators);
    refreshProducers();
  }, [originators, refreshProducers]);

  // When the facility prop changes, fly to it and update the marker.
  useEffect(() => {
    facilityRef.current = facility;
    refreshFacility();
    mapRef.current?.flyTo({ center: [facility.lng, facility.lat], zoom: 9, essential: true });
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

  const setProducers = useCallback(
    (producers: ProducerGeo[]) => {
      producersRef.current = producers;
      refreshProducers();
    },
    [refreshProducers],
  );

  const setSelected = useCallback(
    (ids: Set<string>) => {
      selectedRef.current = ids;
      refreshProducers();
    },
    [refreshProducers],
  );

  const setEligibleIds = useCallback(
    (ids: Set<string> | null) => {
      eligibleRef.current = ids;
      refreshProducers();
    },
    [refreshProducers],
  );

  const flyToCompetitor = useCallback((id: string) => {
    const c = competitorsRef.current.find((x) => x.id === id);
    if (!c) return;
    mapRef.current?.flyTo({ center: [c.lng, c.lat], zoom: 10, essential: true });
  }, []);

  const flyToFacility = useCallback(() => {
    const f = facilityRef.current;
    mapRef.current?.flyTo({
      center: [f.lng, f.lat],
      zoom: 9,
      essential: true,
    });
  }, []);

  const setMapPadding = useCallback(
    (padding: { top?: number; right?: number; bottom?: number; left?: number }) => {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({
        padding: {
          top: padding.top ?? 0,
          right: padding.right ?? 0,
          bottom: padding.bottom ?? 0,
          left: padding.left ?? 0,
        },
        duration: 300,
      });
    },
    []
  );

  const zoomIn = useCallback(() => { mapRef.current?.zoomIn({ duration: 300 }); }, []);
  const zoomOut = useCallback(() => { mapRef.current?.zoomOut({ duration: 300 }); }, []);

  return {
    mapRef,
    setCompetitors,
    setZones,
    setProducers,
    setSelected,
    setEligibleIds,
    flyToCompetitor,
    flyToFacility,
    setMapPadding,
    zoomIn,
    zoomOut,
  };
}
