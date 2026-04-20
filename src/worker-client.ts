const pending = new Map<number, { resolve: (value: unknown) => void; reject: (err: Error) => void }>();
let messageId = 0;

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

worker.onmessage = (e: MessageEvent) => {
  const { id, type, message, ...rest } = e.data;
  const handler = pending.get(id);
  if (!handler) return;
  pending.delete(id);

  if (type === 'error') {
    handler.reject(new Error(message));
  } else {
    handler.resolve(rest);
  }
};

function send(type: string, payload?: unknown): Promise<Record<string, unknown>> {
  const id = messageId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    worker.postMessage({ type, payload, id });
  });
}

export async function loadGeoJSON(text: string): Promise<number> {
  const result = await send('load-geojson', text);
  return result.featureCount as number;
}

export async function loadCSV(text: string): Promise<number> {
  const result = await send('load-csv', text);
  return result.featureCount as number;
}

export async function generateData(count: number): Promise<number> {
  const result = await send('generate', { count });
  return result.featureCount as number;
}

export async function getClusters(bbox: [number, number, number, number], zoom: number) {
  const result = await send('get-clusters', { bbox, zoom });
  return result.data;
}

export async function getExpansionZoom(clusterId: number): Promise<number> {
  const result = await send('get-expansion-zoom', { clusterId });
  return result.data as number;
}

export async function getLeaves(clusterId: number, limit = 100, offset = 0) {
  const result = await send('get-leaves', { clusterId, limit, offset });
  return result.data;
}

export async function getAllFeatures() {
  const result = await send('get-all-features');
  return result.data;
}
