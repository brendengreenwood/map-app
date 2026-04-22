import type { PointFeature, WorkerRequest, WorkerResponse } from './worker-types';
import type { FeatureCollection, Point } from 'geojson';

type PendingHandler = { resolve: (value: WorkerResponse) => void; reject: (err: Error) => void };
const pending = new Map<number, PendingHandler>();
let messageId = 0;

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
  const msg = e.data;
  const handler = pending.get(msg.id);
  if (!handler) return;
  pending.delete(msg.id);

  if (msg.type === 'error') {
    handler.reject(new Error(msg.message));
  } else {
    handler.resolve(msg);
  }
};

function send(type: WorkerRequest['type'], payload?: unknown): Promise<WorkerResponse> {
  const id = messageId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ type, payload, id });
  });
}

export async function loadGeoJSON(text: string): Promise<number> {
  const result = await send('load-geojson', text);
  return result.type === 'loaded' ? result.featureCount : 0;
}

export async function loadCSV(text: string): Promise<number> {
  const result = await send('load-csv', text);
  return result.type === 'loaded' ? result.featureCount : 0;
}

export async function generateData(count: number): Promise<number> {
  const result = await send('generate', { count });
  return result.type === 'loaded' ? result.featureCount : 0;
}

export async function getClusters(bbox: [number, number, number, number], zoom: number): Promise<unknown[]> {
  const result = await send('get-clusters', { bbox, zoom });
  return result.type === 'clusters' ? result.data : [];
}

export async function getExpansionZoom(clusterId: number): Promise<number> {
  const result = await send('get-expansion-zoom', { clusterId });
  return result.type === 'expansion-zoom' ? result.data : 0;
}

export async function getLeaves(clusterId: number, limit = 100, offset = 0): Promise<PointFeature[]> {
  const result = await send('get-leaves', { clusterId, limit, offset });
  return result.type === 'leaves' ? result.data as PointFeature[] : [];
}

export async function getAllFeatures(): Promise<FeatureCollection<Point>> {
  const result = await send('get-all-features');
  return result.type === 'all-features' ? result.data : { type: 'FeatureCollection', features: [] };
}
