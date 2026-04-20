import Supercluster from 'supercluster';
import type { Feature, Point } from 'geojson';

interface PointProperties {
  id: number;
  name?: string;
  category?: string;
  value?: number;
  [key: string]: unknown;
}

type PointFeature = Feature<Point, PointProperties>;

let cluster: Supercluster<PointProperties> | null = null;
let allFeatures: PointFeature[] = [];

function initCluster(features: PointFeature[]) {
  allFeatures = features;

  cluster = new Supercluster<PointProperties>({
    radius: 60,
    maxZoom: 16,
    minZoom: 0,
    minPoints: 3,
  });

  cluster.load(features);
}

function getClusters(bbox: [number, number, number, number], zoom: number) {
  if (!cluster) return [];
  return cluster.getClusters(bbox, Math.floor(zoom));
}

function getClusterExpansionZoom(clusterId: number) {
  if (!cluster) return 0;
  return cluster.getClusterExpansionZoom(clusterId);
}

function getClusterLeaves(clusterId: number, limit: number, offset: number) {
  if (!cluster) return [];
  return cluster.getLeaves(clusterId, limit, offset);
}

// Parse CSV to GeoJSON features
function parseCSV(text: string): PointFeature[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  // Find lat/lng columns
  const latIdx = headers.findIndex(h => ['lat', 'latitude', 'y'].includes(h));
  const lngIdx = headers.findIndex(h => ['lng', 'lon', 'longitude', 'x', 'long'].includes(h));

  if (latIdx === -1 || lngIdx === -1) {
    throw new Error('CSV must have latitude/longitude columns (lat/lng, latitude/longitude, or x/y)');
  }

  const features: PointFeature[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const lat = parseFloat(values[latIdx]);
    const lng = parseFloat(values[lngIdx]);

    if (isNaN(lat) || isNaN(lng)) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

    const props: PointProperties = { id: i - 1 };
    headers.forEach((h, idx) => {
      if (idx !== latIdx && idx !== lngIdx) {
        const num = parseFloat(values[idx]);
        props[h] = isNaN(num) ? values[idx] : num;
      }
    });

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: props,
    });
  }

  return features;
}

// Generate random point data for demo/testing
function generatePoints(count: number): PointFeature[] {
  const features: PointFeature[] = [];
  const categories = ['residential', 'commercial', 'industrial', 'park', 'transport'];

  // Create clusters around major world cities for realistic distribution
  const hotspots = [
    { lat: 40.7128, lng: -74.006, weight: 0.15 },   // NYC
    { lat: 51.5074, lng: -0.1278, weight: 0.1 },     // London
    { lat: 35.6762, lng: 139.6503, weight: 0.12 },   // Tokyo
    { lat: 48.8566, lng: 2.3522, weight: 0.08 },     // Paris
    { lat: 37.7749, lng: -122.4194, weight: 0.1 },   // SF
    { lat: -33.8688, lng: 151.2093, weight: 0.06 },  // Sydney
    { lat: 55.7558, lng: 37.6173, weight: 0.05 },    // Moscow
    { lat: 19.4326, lng: -99.1332, weight: 0.07 },   // Mexico City
    { lat: -23.5505, lng: -46.6333, weight: 0.06 },  // São Paulo
    { lat: 1.3521, lng: 103.8198, weight: 0.05 },    // Singapore
    { lat: 28.6139, lng: 77.209, weight: 0.08 },     // Delhi
    { lat: 31.2304, lng: 121.4737, weight: 0.08 },   // Shanghai
  ];

  // Normalize weights
  const totalWeight = hotspots.reduce((s, h) => s + h.weight, 0);
  const uniformWeight = 1 - totalWeight;

  for (let i = 0; i < count; i++) {
    let lat: number, lng: number;
    const r = Math.random();

    if (r > uniformWeight) {
      // Clustered around a hotspot
      let cumulative = uniformWeight;
      let spot = hotspots[0];
      for (const h of hotspots) {
        cumulative += h.weight;
        if (r <= cumulative) {
          spot = h;
          break;
        }
      }
      // Gaussian-ish distribution around the hotspot
      const angle = Math.random() * Math.PI * 2;
      const radius = (Math.random() + Math.random() + Math.random()) / 3 * 3;
      lat = spot.lat + Math.sin(angle) * radius;
      lng = spot.lng + Math.cos(angle) * radius;
    } else {
      // Uniform random
      lat = (Math.random() - 0.5) * 160;
      lng = (Math.random() - 0.5) * 340;
    }

    lat = Math.max(-85, Math.min(85, lat));
    lng = ((lng + 180) % 360) - 180;

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        id: i,
        name: `Point ${i}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        value: Math.round(Math.random() * 1000),
      },
    });
  }

  return features;
}

// Message handler
self.onmessage = (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    switch (type) {
      case 'load-geojson': {
        const data = JSON.parse(payload);
        const features: PointFeature[] = [];

        if (data.type === 'FeatureCollection') {
          for (const f of data.features) {
            if (f.geometry?.type === 'Point') {
              features.push(f);
            }
          }
        } else if (data.type === 'Feature' && data.geometry?.type === 'Point') {
          features.push(data);
        }

        initCluster(features);
        self.postMessage({ type: 'loaded', id, featureCount: features.length });
        break;
      }

      case 'load-csv': {
        const features = parseCSV(payload);
        initCluster(features);
        self.postMessage({ type: 'loaded', id, featureCount: features.length });
        break;
      }

      case 'generate': {
        const count = payload.count || 100000;
        const features = generatePoints(count);
        initCluster(features);
        self.postMessage({ type: 'loaded', id, featureCount: features.length });
        break;
      }

      case 'get-clusters': {
        const { bbox, zoom } = payload;
        const clusters = getClusters(bbox, zoom);
        self.postMessage({ type: 'clusters', id, data: clusters });
        break;
      }

      case 'get-expansion-zoom': {
        const zoom = getClusterExpansionZoom(payload.clusterId);
        self.postMessage({ type: 'expansion-zoom', id, data: zoom });
        break;
      }

      case 'get-leaves': {
        const leaves = getClusterLeaves(payload.clusterId, payload.limit || 100, payload.offset || 0);
        self.postMessage({ type: 'leaves', id, data: leaves });
        break;
      }

      case 'get-all-features': {
        // Return all features as a GeoJSON source for heatmap
        self.postMessage({
          type: 'all-features',
          id,
          data: { type: 'FeatureCollection', features: allFeatures },
        });
        break;
      }
    }
  } catch (err) {
    self.postMessage({ type: 'error', id, message: (err as Error).message });
  }
};
