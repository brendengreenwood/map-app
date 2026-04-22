import type { Feature, FeatureCollection, Point } from 'geojson';

export interface PointProperties {
  id: number;
  name?: string;
  category?: string;
  value?: number;
  [key: string]: unknown;
}

export type PointFeature = Feature<Point, PointProperties>;

// Messages sent from client → worker
export type WorkerRequest =
  | { type: 'load-geojson'; payload: string; id: number }
  | { type: 'load-csv'; payload: string; id: number }
  | { type: 'generate'; payload: { count: number }; id: number }
  | { type: 'get-clusters'; payload: { bbox: [number, number, number, number]; zoom: number }; id: number }
  | { type: 'get-expansion-zoom'; payload: { clusterId: number }; id: number }
  | { type: 'get-leaves'; payload: { clusterId: number; limit?: number; offset?: number }; id: number }
  | { type: 'get-all-features'; id: number };

// Messages sent from worker → client
export type WorkerResponse =
  | { type: 'loaded'; id: number; featureCount: number }
  | { type: 'clusters'; id: number; data: unknown[] }
  | { type: 'expansion-zoom'; id: number; data: number }
  | { type: 'leaves'; id: number; data: unknown[] }
  | { type: 'all-features'; id: number; data: FeatureCollection<Point, PointProperties> }
  | { type: 'error'; id: number; message: string };
