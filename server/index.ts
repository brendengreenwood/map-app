import express from 'express';
import cors from 'cors';
import db from './db.js';
import {
  isNonEmptyString, isOptionalString, isOptionalNumber,
  isValidLng, isValidLat, isOptionalLng, isOptionalLat,
  isStringArray, sanitize, sanitizeArray,
} from './validate.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// ── GET /api/features — query features in a bounding box ──

app.get('/api/features', (req, res) => {
  const { west, south, east, north, category, limit = '100000', offset = '0' } = req.query;

  const parsedLimit = Math.min(Math.max(0, Number(limit) || 0), 100000);
  const parsedOffset = Math.max(0, Number(offset) || 0);

  let sql = 'SELECT id, lng, lat, name, category, value, properties FROM features';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (west && south && east && north) {
    const w = Number(west), s = Number(south), e = Number(east), n = Number(north);
    if ([w, s, e, n].every(Number.isFinite)) {
      conditions.push('lng >= ? AND lng <= ? AND lat >= ? AND lat <= ?');
      params.push(w, e, s, n);
    }
  }

  if (category && typeof category === 'string') {
    conditions.push('category = ?');
    params.push(sanitize(String(category)));
  }

  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ` LIMIT ? OFFSET ?`;
  params.push(parsedLimit, parsedOffset);

  const rows = db.prepare(sql).all(...params);
  const total = db.prepare(
    `SELECT COUNT(*) as count FROM features${conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''}`
  ).get(...params.slice(0, -2)) as { count: number };

  res.json({ features: rows, total: total.count });
});

// ── GET /api/features/geojson — return as GeoJSON FeatureCollection ──

app.get('/api/features/geojson', (req, res) => {
  const { west, south, east, north, category, limit = '100000' } = req.query;

  let sql = 'SELECT id, lng, lat, name, category, value, properties FROM features';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (west && south && east && north) {
    conditions.push('lng >= ? AND lng <= ? AND lat >= ? AND lat <= ?');
    params.push(Number(west), Number(east), Number(south), Number(north));
  }

  if (category) {
    conditions.push('category = ?');
    params.push(String(category));
  }

  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ` LIMIT ?`;
  params.push(Number(limit));

  const rows = db.prepare(sql).all(...params) as {
    id: number; lng: number; lat: number; name: string | null;
    category: string | null; value: number | null; properties: string | null;
  }[];

  const geojson = {
    type: 'FeatureCollection',
    features: rows.map((r) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      properties: {
        id: r.id,
        name: r.name,
        category: r.category,
        value: r.value,
        ...(r.properties ? JSON.parse(r.properties) : {}),
      },
    })),
  };

  res.json(geojson);
});

// ── GET /api/features/stats — summary stats ──

app.get('/api/features/stats', (_req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM features').get() as { count: number };
  const categories = db.prepare(
    'SELECT category, COUNT(*) as count FROM features GROUP BY category ORDER BY count DESC'
  ).all();
  const bounds = db.prepare(
    'SELECT MIN(lng) as west, MAX(lng) as east, MIN(lat) as south, MAX(lat) as north FROM features'
  ).get();

  res.json({ total: total.count, categories, bounds });
});

// ── POST /api/features — insert a single feature ──

app.post('/api/features', (req, res) => {
  const { lng, lat, name, category, value, properties } = req.body;

  if (!isValidLng(lng) || !isValidLat(lat)) {
    return res.status(400).json({ error: 'lng (-180..180) and lat (-90..90) are required numbers' });
  }
  if (!isOptionalString(name)) return res.status(400).json({ error: 'name must be a string' });
  if (!isOptionalString(category)) return res.status(400).json({ error: 'category must be a string' });
  if (!isOptionalNumber(value)) return res.status(400).json({ error: 'value must be a number' });

  const result = db.prepare(
    'INSERT INTO features (lng, lat, name, category, value, properties) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    lng, lat,
    name ? sanitize(name) : null,
    category ? sanitize(category) : null,
    value ?? null,
    properties ? JSON.stringify(properties) : null,
  );

  res.json({ id: result.lastInsertRowid });
});

// ── POST /api/features/bulk — insert many features at once ──

const insertStmt = db.prepare(
  'INSERT INTO features (lng, lat, name, category, value, properties) VALUES (?, ?, ?, ?, ?, ?)'
);

const insertMany = db.transaction((features: { lng: number; lat: number; name?: string; category?: string; value?: number; properties?: Record<string, unknown> }[]) => {
  for (const f of features) {
    insertStmt.run(
      f.lng, f.lat,
      f.name || null,
      f.category || null,
      f.value || null,
      f.properties ? JSON.stringify(f.properties) : null
    );
  }
});

app.post('/api/features/bulk', (req, res) => {
  const { features } = req.body;

  if (!Array.isArray(features)) {
    return res.status(400).json({ error: 'features must be an array' });
  }
  if (features.length > 500000) {
    return res.status(400).json({ error: 'Maximum 500,000 features per bulk insert' });
  }
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    if (!isValidLng(f.lng) || !isValidLat(f.lat)) {
      return res.status(400).json({ error: `Feature at index ${i}: lng/lat are invalid` });
    }
  }

  insertMany(features);
  res.json({ inserted: features.length });
});

// ── DELETE /api/features/:id ──

app.delete('/api/features/:id', (req, res) => {
  const result = db.prepare('DELETE FROM features WHERE id = ?').run(req.params.id);
  res.json({ deleted: result.changes });
});

// ── DELETE /api/features — clear all ──

app.delete('/api/features', (_req, res) => {
  const result = db.prepare('DELETE FROM features').run();
  res.json({ deleted: result.changes });
});

// ═══════════════════════════════════════════
// ── Users API ──
// ═══════════════════════════════════════════

// ── User row helper ──

interface UserDbRow {
  id: string; name: string; types: string; preferences: string; created_at: string;
}

function parseUserRow(r: UserDbRow) {
  return { id: r.id, name: r.name, types: JSON.parse(r.types), preferences: JSON.parse(r.preferences), created_at: r.created_at };
}

// ── GET /api/users — list all users ──

app.get('/api/users', (_req, res) => {
  const rows = db.prepare('SELECT id, name, types, preferences, created_at FROM users ORDER BY created_at ASC').all() as UserDbRow[];
  res.json({ users: rows.map(parseUserRow) });
});

// ── GET /api/users/:id — get a single user ──

app.get('/api/users/:id', (req, res) => {
  const row = db.prepare('SELECT id, name, types, preferences, created_at FROM users WHERE id = ?').get(req.params.id) as UserDbRow | undefined;
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json(parseUserRow(row));
});

// ── POST /api/users — create a user ──

app.post('/api/users', (req, res) => {
  const { id, name, types, preferences } = req.body;
  if (!isNonEmptyString(id)) return res.status(400).json({ error: 'id is required' });
  if (!isNonEmptyString(name)) return res.status(400).json({ error: 'name is required' });
  if (types !== undefined && !isStringArray(types)) return res.status(400).json({ error: 'types must be a string array' });

  const safeName = sanitize(name, 200);
  const safeTypes = types ? sanitizeArray(types, 10, 50) : [];
  db.prepare('INSERT INTO users (id, name, types, preferences) VALUES (?, ?, ?, ?)').run(
    id, safeName, JSON.stringify(safeTypes), JSON.stringify(preferences ?? {})
  );
  res.json({ id, name: safeName, types: safeTypes, preferences: preferences ?? {} });
});

// ── PUT /api/users/:id — update a user ──

app.put('/api/users/:id', (req, res) => {
  const { name, types, preferences } = req.body;
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  if (name !== undefined && !isNonEmptyString(name)) return res.status(400).json({ error: 'name must be a non-empty string' });
  if (types !== undefined && !isStringArray(types)) return res.status(400).json({ error: 'types must be a string array' });

  const updates: string[] = [];
  const params: (string)[] = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(sanitize(name, 200)); }
  if (types !== undefined) { updates.push('types = ?'); params.push(JSON.stringify(sanitizeArray(types, 10, 50))); }
  if (preferences !== undefined) { updates.push('preferences = ?'); params.push(JSON.stringify(preferences)); }

  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const row = db.prepare('SELECT id, name, types, preferences, created_at FROM users WHERE id = ?').get(req.params.id) as UserDbRow;
  res.json(parseUserRow(row));
});

// ── DELETE /api/users/:id — delete a user ──

app.delete('/api/users/:id', (req, res) => {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ deleted: result.changes });
});

// ═══════════════════════════════════════════════════════════════════
// ── ELEVATORS ──
// ═══════════════════════════════════════════════════════════════════

interface ElevatorRow {
  id: string;
  merchant_user_id: string | null;
  name: string;
  lng: number;
  lat: number;
  address: string | null;
  created_at: string;
}

app.get('/api/elevators', (req, res) => {
  const merchantUserId = req.query.merchant_user_id as string | undefined;
  let rows: ElevatorRow[];
  if (merchantUserId) {
    rows = db.prepare('SELECT * FROM elevators WHERE merchant_user_id = ? ORDER BY name').all(merchantUserId) as ElevatorRow[];
  } else {
    rows = db.prepare('SELECT * FROM elevators ORDER BY name').all() as ElevatorRow[];
  }
  const commodityStmt = db.prepare('SELECT commodity FROM elevator_commodities WHERE elevator_id = ?');
  const elevators = rows.map((e) => ({
    ...e,
    commodities: (commodityStmt.all(e.id) as { commodity: string }[]).map((c) => c.commodity),
  }));
  res.json({ elevators });
});

app.post('/api/elevators', (req, res) => {
  const { id, merchant_user_id, name, lng, lat, address, commodities } = req.body;
  if (!isNonEmptyString(id)) return res.status(400).json({ error: 'id is required' });
  if (!isNonEmptyString(name)) return res.status(400).json({ error: 'name is required' });
  if (!isValidLng(lng) || !isValidLat(lat)) return res.status(400).json({ error: 'Valid lng/lat are required' });
  if (commodities !== undefined && !isStringArray(commodities)) return res.status(400).json({ error: 'commodities must be a string array' });

  db.prepare('INSERT INTO elevators (id, merchant_user_id, name, lng, lat, address) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, merchant_user_id ?? null, sanitize(name), lng, lat, address ? sanitize(address) : null
  );
  if (commodities) {
    const safeCommodities = sanitizeArray(commodities);
    const stmt = db.prepare('INSERT OR IGNORE INTO elevator_commodities (id, elevator_id, commodity) VALUES (?, ?, ?)');
    for (const c of safeCommodities) stmt.run(crypto.randomUUID(), id, c);
  }
  const row = db.prepare('SELECT * FROM elevators WHERE id = ?').get(id) as ElevatorRow;
  const comms = (db.prepare('SELECT commodity FROM elevator_commodities WHERE elevator_id = ?').all(id) as { commodity: string }[]).map((c) => c.commodity);
  res.status(201).json({ ...row, commodities: comms });
});

app.put('/api/elevators/:id', (req, res) => {
  const { name, lng, lat, address, commodities, merchant_user_id } = req.body;
  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (merchant_user_id !== undefined) { updates.push('merchant_user_id = ?'); params.push(merchant_user_id); }
  if (lng !== undefined) { updates.push('lng = ?'); params.push(lng); }
  if (lat !== undefined) { updates.push('lat = ?'); params.push(lat); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE elevators SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  if (commodities && Array.isArray(commodities)) {
    db.prepare('DELETE FROM elevator_commodities WHERE elevator_id = ?').run(req.params.id);
    const stmt = db.prepare('INSERT INTO elevator_commodities (id, elevator_id, commodity) VALUES (?, ?, ?)');
    for (const c of commodities) {
      stmt.run(crypto.randomUUID(), req.params.id, c);
    }
  }
  const row = db.prepare('SELECT * FROM elevators WHERE id = ?').get(req.params.id) as ElevatorRow;
  const comms = (db.prepare('SELECT commodity FROM elevator_commodities WHERE elevator_id = ?').all(req.params.id) as { commodity: string }[]).map((c) => c.commodity);
  res.json({ ...row, commodities: comms });
});

app.delete('/api/elevators/:id', (req, res) => {
  const result = db.prepare('DELETE FROM elevators WHERE id = ?').run(req.params.id);
  res.json({ deleted: result.changes });
});

// ═══════════════════════════════════════════════════════════════════
// ── MERCHANT–ORIGINATOR ASSIGNMENTS ──
// ═══════════════════════════════════════════════════════════════════

// Get all assignments (optionally filtered by merchant or originator)
app.get('/api/assignments', (req, res) => {
  const merchantUserId = req.query.merchant_user_id as string | undefined;
  const originatorUserId = req.query.originator_user_id as string | undefined;
  let rows;
  if (merchantUserId) {
    rows = db.prepare('SELECT * FROM merchant_originators WHERE merchant_user_id = ?').all(merchantUserId);
  } else if (originatorUserId) {
    rows = db.prepare('SELECT * FROM merchant_originators WHERE originator_user_id = ?').all(originatorUserId);
  } else {
    rows = db.prepare('SELECT * FROM merchant_originators').all();
  }
  res.json({ assignments: rows });
});

// Assign an originator to a merchant
app.post('/api/assignments', (req, res) => {
  const { merchant_user_id, originator_user_id } = req.body;
  if (!isNonEmptyString(merchant_user_id)) return res.status(400).json({ error: 'merchant_user_id is required' });
  if (!isNonEmptyString(originator_user_id)) return res.status(400).json({ error: 'originator_user_id is required' });
  db.prepare('INSERT OR IGNORE INTO merchant_originators (merchant_user_id, originator_user_id) VALUES (?, ?)').run(merchant_user_id, originator_user_id);
  res.status(201).json({ merchant_user_id, originator_user_id });
});

// Remove an originator from a merchant
app.delete('/api/assignments', (req, res) => {
  const { merchant_user_id, originator_user_id } = req.body;
  if (!isNonEmptyString(merchant_user_id) || !isNonEmptyString(originator_user_id)) {
    return res.status(400).json({ error: 'merchant_user_id and originator_user_id are required' });
  }
  const result = db.prepare('DELETE FROM merchant_originators WHERE merchant_user_id = ? AND originator_user_id = ?').run(merchant_user_id, originator_user_id);
  res.json({ deleted: result.changes });
});

// ═══════════════════════════════════════════════════════════════════
// ── PRODUCERS (farmers) ──
// ═══════════════════════════════════════════════════════════════════

interface ProducerRow {
  id: string;
  name: string;
  business_name: string | null;
  lng: number | null;
  lat: number | null;
  address: string | null;
  created_at: string;
}

interface ProducerLocationRow {
  id: string;
  producer_id: string;
  name: string;
  address: string | null;
  lng: number | null;
  lat: number | null;
  created_at: string;
}

const producerCommodityStmt = db.prepare('SELECT commodity FROM producer_commodities WHERE producer_id = ?');
const producerAssignmentStmt = db.prepare('SELECT originator_user_id FROM producer_assignments WHERE producer_id = ?');
const producerLocationStmt = db.prepare('SELECT * FROM producer_locations WHERE producer_id = ? ORDER BY name');

function enrichProducer(row: ProducerRow) {
  return {
    ...row,
    commodities: (producerCommodityStmt.all(row.id) as { commodity: string }[]).map((c) => c.commodity),
    originator_user_ids: (producerAssignmentStmt.all(row.id) as { originator_user_id: string }[]).map((a) => a.originator_user_id),
    locations: producerLocationStmt.all(row.id) as ProducerLocationRow[],
  };
}

app.get('/api/producers', (req, res) => {
  const originatorUserId = req.query.originator_user_id as string | undefined;
  let rows: ProducerRow[];
  if (originatorUserId) {
    rows = db.prepare(
      'SELECT p.* FROM producers p JOIN producer_assignments pa ON p.id = pa.producer_id WHERE pa.originator_user_id = ? ORDER BY p.name'
    ).all(originatorUserId) as ProducerRow[];
  } else {
    rows = db.prepare('SELECT * FROM producers ORDER BY name').all() as ProducerRow[];
  }
  res.json({ producers: rows.map(enrichProducer) });
});

app.post('/api/producers', (req, res) => {
  const { id, name, business_name, lng, lat, address, commodities, originator_user_ids, locations } = req.body;
  if (!isNonEmptyString(id)) return res.status(400).json({ error: 'id is required' });
  if (!isNonEmptyString(name)) return res.status(400).json({ error: 'name is required' });
  if (!isOptionalLng(lng) || !isOptionalLat(lat)) return res.status(400).json({ error: 'Invalid lng/lat' });
  if (commodities !== undefined && !isStringArray(commodities)) return res.status(400).json({ error: 'commodities must be a string array' });
  if (originator_user_ids !== undefined && !isStringArray(originator_user_ids)) return res.status(400).json({ error: 'originator_user_ids must be a string array' });

  db.prepare('INSERT INTO producers (id, name, business_name, lng, lat, address) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, sanitize(name), business_name ? sanitize(business_name) : null, lng ?? null, lat ?? null, address ? sanitize(address) : null
  );

  if (commodities) {
    const safeCommodities = sanitizeArray(commodities);
    const stmt = db.prepare('INSERT OR IGNORE INTO producer_commodities (id, producer_id, commodity) VALUES (?, ?, ?)');
    for (const c of safeCommodities) stmt.run(crypto.randomUUID(), id, c);
  }

  if (originator_user_ids) {
    const stmt = db.prepare('INSERT OR IGNORE INTO producer_assignments (producer_id, originator_user_id) VALUES (?, ?)');
    for (const oid of originator_user_ids) stmt.run(id, oid);
  }

  if (locations && Array.isArray(locations)) {
    const stmt = db.prepare('INSERT INTO producer_locations (id, producer_id, name, address, lng, lat) VALUES (?, ?, ?, ?, ?, ?)');
    for (const loc of locations) {
      if (!isNonEmptyString(loc.name)) continue;
      if (!isOptionalLng(loc.lng) || !isOptionalLat(loc.lat)) continue;
      stmt.run(loc.id ?? crypto.randomUUID(), id, sanitize(loc.name), loc.address ? sanitize(loc.address) : null, loc.lng ?? null, loc.lat ?? null);
    }
  }

  const row = db.prepare('SELECT * FROM producers WHERE id = ?').get(id) as ProducerRow;
  res.status(201).json(enrichProducer(row));
});

app.put('/api/producers/:id', (req, res) => {
  const { name, business_name, lng, lat, address, commodities, originator_user_ids, locations } = req.body;
  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (business_name !== undefined) { updates.push('business_name = ?'); params.push(business_name); }
  if (lng !== undefined) { updates.push('lng = ?'); params.push(lng); }
  if (lat !== undefined) { updates.push('lat = ?'); params.push(lat); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (updates.length) {
    params.push(req.params.id);
    db.prepare(`UPDATE producers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  if (commodities && Array.isArray(commodities)) {
    db.prepare('DELETE FROM producer_commodities WHERE producer_id = ?').run(req.params.id);
    const stmt = db.prepare('INSERT INTO producer_commodities (id, producer_id, commodity) VALUES (?, ?, ?)');
    for (const c of commodities) stmt.run(crypto.randomUUID(), req.params.id, c);
  }
  if (originator_user_ids && Array.isArray(originator_user_ids)) {
    db.prepare('DELETE FROM producer_assignments WHERE producer_id = ?').run(req.params.id);
    const stmt = db.prepare('INSERT OR IGNORE INTO producer_assignments (producer_id, originator_user_id) VALUES (?, ?)');
    for (const oid of originator_user_ids) stmt.run(req.params.id, oid);
  }
  if (locations && Array.isArray(locations)) {
    db.prepare('DELETE FROM producer_locations WHERE producer_id = ?').run(req.params.id);
    const stmt = db.prepare('INSERT INTO producer_locations (id, producer_id, name, address, lng, lat) VALUES (?, ?, ?, ?, ?, ?)');
    for (const loc of locations) {
      stmt.run(loc.id ?? crypto.randomUUID(), req.params.id, loc.name, loc.address ?? null, loc.lng ?? null, loc.lat ?? null);
    }
  }
  const row = db.prepare('SELECT * FROM producers WHERE id = ?').get(req.params.id) as ProducerRow;
  if (!row) return res.status(404).json({ error: 'Producer not found' });
  res.json(enrichProducer(row));
});

app.delete('/api/producers/:id', (req, res) => {
  const result = db.prepare('DELETE FROM producers WHERE id = ?').run(req.params.id);
  res.json({ deleted: result.changes });
});

// ═══════════════════════════════════════════════════════════════════
// ── COMPETITORS (rival grain elevators) ──
// ═══════════════════════════════════════════════════════════════════

interface CompetitorRow {
  id: string;
  name: string;
  lng: number | null;
  lat: number | null;
  address: string | null;
  created_at: string;
}

const competitorCommodityStmt = db.prepare('SELECT commodity FROM competitor_commodities WHERE competitor_id = ?');

function enrichCompetitor(row: CompetitorRow) {
  return {
    ...row,
    commodities: (competitorCommodityStmt.all(row.id) as { commodity: string }[]).map((c) => c.commodity),
  };
}

app.get('/api/competitors', (_req, res) => {
  const rows = db.prepare('SELECT * FROM competitors ORDER BY name').all() as CompetitorRow[];
  res.json({ competitors: rows.map(enrichCompetitor) });
});

app.post('/api/competitors', (req, res) => {
  const { id, name, lng, lat, address, commodities } = req.body;
  if (!isNonEmptyString(id)) return res.status(400).json({ error: 'id is required' });
  if (!isNonEmptyString(name)) return res.status(400).json({ error: 'name is required' });
  if (!isOptionalLng(lng) || !isOptionalLat(lat)) return res.status(400).json({ error: 'Invalid lng/lat' });
  if (commodities !== undefined && !isStringArray(commodities)) return res.status(400).json({ error: 'commodities must be a string array' });

  db.prepare('INSERT INTO competitors (id, name, lng, lat, address) VALUES (?, ?, ?, ?, ?)').run(
    id, sanitize(name), lng ?? null, lat ?? null, address ? sanitize(address) : null
  );

  if (commodities) {
    const safeCommodities = sanitizeArray(commodities);
    const stmt = db.prepare('INSERT OR IGNORE INTO competitor_commodities (id, competitor_id, commodity) VALUES (?, ?, ?)');
    for (const c of safeCommodities) stmt.run(crypto.randomUUID(), id, c);
  }

  const row = db.prepare('SELECT * FROM competitors WHERE id = ?').get(id) as CompetitorRow;
  res.status(201).json(enrichCompetitor(row));
});

app.put('/api/competitors/:id', (req, res) => {
  const { name, lng, lat, address, commodities } = req.body;
  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (lng !== undefined) { updates.push('lng = ?'); params.push(lng); }
  if (lat !== undefined) { updates.push('lat = ?'); params.push(lat); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (updates.length) {
    params.push(req.params.id);
    db.prepare(`UPDATE competitors SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  if (commodities && Array.isArray(commodities)) {
    db.prepare('DELETE FROM competitor_commodities WHERE competitor_id = ?').run(req.params.id);
    const stmt = db.prepare('INSERT INTO competitor_commodities (id, competitor_id, commodity) VALUES (?, ?, ?)');
    for (const c of commodities) stmt.run(crypto.randomUUID(), req.params.id, c);
  }
  const row = db.prepare('SELECT * FROM competitors WHERE id = ?').get(req.params.id) as CompetitorRow;
  if (!row) return res.status(404).json({ error: 'Competitor not found' });
  res.json(enrichCompetitor(row));
});

app.delete('/api/competitors/:id', (req, res) => {
  const result = db.prepare('DELETE FROM competitors WHERE id = ?').run(req.params.id);
  res.json({ deleted: result.changes });
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
