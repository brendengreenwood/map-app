import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { type ZodSchema, ZodError } from 'zod';
import db from './db.js';
import { sanitize, sanitizeArray } from './validate.js';
import {
  createFeatureSchema, bulkFeaturesSchema, featureQuerySchema, featureGeoJsonQuerySchema,
  createUserSchema, updateUserSchema,
  createElevatorSchema, updateElevatorSchema, elevatorQuerySchema,
  createAssignmentSchema, deleteAssignmentSchema, assignmentQuerySchema,
  createProducerSchema, updateProducerSchema, producerQuerySchema,
  createCompetitorSchema, updateCompetitorSchema,
  competitorBidQuerySchema,
  createScenarioSchema, scenarioQuerySchema, scenarioCheckQuerySchema,
} from './schemas.js';

/** Format Zod errors into a flat list of readable messages */
function formatZodErrors(error: ZodError): string[] {
  return error.issues.map((e) => {
    const path = e.path.length ? `${e.path.join('.')}: ` : '';
    return `${path}${e.message}`;
  });
}

/** Validate req.body against a Zod schema. Returns parsed data or sends 400. */
function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validation failed', details: formatZodErrors(result.error) });
      return;
    }
    req.body = result.data;
    next();
  };
}

/** Validate req.query against a Zod schema. Parsed data stored on res.locals.query. */
function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: 'Validation failed', details: formatZodErrors(result.error) });
      return;
    }
    res.locals.query = result.data;
    next();
  };
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// ── GET /api/features — query features in a bounding box ──

app.get('/api/features', validateQuery(featureQuerySchema), (_req, res) => {
  const { west, south, east, north, category, limit, offset } = res.locals.query;

  let sql = 'SELECT id, lng, lat, name, category, value, properties FROM features';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (west !== undefined && south !== undefined && east !== undefined && north !== undefined) {
    conditions.push('lng >= ? AND lng <= ? AND lat >= ? AND lat <= ?');
    params.push(west, east, south, north);
  }

  if (category) {
    conditions.push('category = ?');
    params.push(sanitize(category));
  }

  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);
  const total = db.prepare(
    `SELECT COUNT(*) as count FROM features${conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''}`
  ).get(...params.slice(0, -2)) as { count: number };

  res.json({ features: rows, total: total.count });
});

// ── GET /api/features/geojson — return as GeoJSON FeatureCollection ──

app.get('/api/features/geojson', validateQuery(featureGeoJsonQuerySchema), (_req, res) => {
  const { west, south, east, north, category, limit } = res.locals.query;

  let sql = 'SELECT id, lng, lat, name, category, value, properties FROM features';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (west !== undefined && south !== undefined && east !== undefined && north !== undefined) {
    conditions.push('lng >= ? AND lng <= ? AND lat >= ? AND lat <= ?');
    params.push(west, east, south, north);
  }

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ` LIMIT ?`;
  params.push(limit);

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

app.post('/api/features', validateBody(createFeatureSchema), (req, res) => {
  const { lng, lat, name, category, value, properties } = req.body;

  const result = db.prepare(
    'INSERT INTO features (lng, lat, name, category, value, properties) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    lng, lat,
    name ?? null,
    category ?? null,
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

app.post('/api/features/bulk', validateBody(bulkFeaturesSchema), (req, res) => {
  const { features } = req.body;
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

app.post('/api/users', validateBody(createUserSchema), (req, res) => {
  const { id, name, types, preferences } = req.body;

  const safeTypes = types ?? [];
  db.prepare('INSERT INTO users (id, name, types, preferences) VALUES (?, ?, ?, ?)').run(
    id, name, JSON.stringify(safeTypes), JSON.stringify(preferences ?? {})
  );
  res.json({ id, name, types: safeTypes, preferences: preferences ?? {} });
});

// ── PUT /api/users/:id — update a user ──

app.put('/api/users/:id', validateBody(updateUserSchema), (req, res) => {
  const { name, types, preferences } = req.body;
  const id = req.params.id as string;
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const updates: string[] = [];
  const params: (string)[] = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (types !== undefined) { updates.push('types = ?'); params.push(JSON.stringify(types)); }
  if (preferences !== undefined) { updates.push('preferences = ?'); params.push(JSON.stringify(preferences)); }

  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  params.push(id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const row = db.prepare('SELECT id, name, types, preferences, created_at FROM users WHERE id = ?').get(id) as UserDbRow;
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
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  created_at: string;
}

app.get('/api/elevators', validateQuery(elevatorQuerySchema), (_req, res) => {
  const merchantUserId = res.locals.query.merchant_user_id as string | undefined;
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

app.post('/api/elevators', validateBody(createElevatorSchema), (req, res) => {
  const { id, merchant_user_id, name, lng, lat, address, street, city, state, zip, commodities } = req.body;

  db.prepare('INSERT INTO elevators (id, merchant_user_id, name, lng, lat, address, street, city, state, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, merchant_user_id ?? null, name, lng, lat, address ?? null,
    street ?? null, city ?? null, state ?? null, zip ?? null
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

app.put('/api/elevators/:id', validateBody(updateElevatorSchema), (req, res) => {
  const id = req.params.id as string;
  const { name, lng, lat, address, street, city, state, zip, commodities, merchant_user_id } = req.body;
  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (merchant_user_id !== undefined) { updates.push('merchant_user_id = ?'); params.push(merchant_user_id); }
  if (lng !== undefined) { updates.push('lng = ?'); params.push(lng); }
  if (lat !== undefined) { updates.push('lat = ?'); params.push(lat); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (street !== undefined) { updates.push('street = ?'); params.push(street); }
  if (city !== undefined) { updates.push('city = ?'); params.push(city); }
  if (state !== undefined) { updates.push('state = ?'); params.push(state); }
  if (zip !== undefined) { updates.push('zip = ?'); params.push(zip); }
  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE elevators SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  if (commodities && Array.isArray(commodities)) {
    db.prepare('DELETE FROM elevator_commodities WHERE elevator_id = ?').run(id);
    const stmt = db.prepare('INSERT INTO elevator_commodities (id, elevator_id, commodity) VALUES (?, ?, ?)');
    for (const c of commodities) {
      stmt.run(crypto.randomUUID(), id, c);
    }
  }
  const row = db.prepare('SELECT * FROM elevators WHERE id = ?').get(id) as ElevatorRow;
  const comms = (db.prepare('SELECT commodity FROM elevator_commodities WHERE elevator_id = ?').all(id) as { commodity: string }[]).map((c) => c.commodity);
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
app.get('/api/assignments', validateQuery(assignmentQuerySchema), (_req, res) => {
  const merchantUserId = res.locals.query.merchant_user_id as string | undefined;
  const originatorUserId = res.locals.query.originator_user_id as string | undefined;
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
app.post('/api/assignments', validateBody(createAssignmentSchema), (req, res) => {
  const { merchant_user_id, originator_user_id } = req.body;
  db.prepare('INSERT OR IGNORE INTO merchant_originators (merchant_user_id, originator_user_id) VALUES (?, ?)').run(merchant_user_id, originator_user_id);
  res.status(201).json({ merchant_user_id, originator_user_id });
});

// Remove an originator from a merchant
app.delete('/api/assignments', validateBody(deleteAssignmentSchema), (req, res) => {
  const { merchant_user_id, originator_user_id } = req.body;
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
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  created_at: string;
}

interface ProducerLocationRow {
  id: string;
  producer_id: string;
  name: string;
  address: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lng: number | null;
  lat: number | null;
  created_at: string;
}

const producerCommodityStmt = db.prepare('SELECT commodity FROM producer_commodities WHERE producer_id = ?');
const producerAssignmentStmt = db.prepare('SELECT originator_user_id FROM producer_assignments WHERE producer_id = ?');
const producerLocationStmt = db.prepare('SELECT * FROM producer_locations WHERE producer_id = ? ORDER BY name');
const producerElevatorStmt = db.prepare(
  'SELECT e.id, e.name, e.address, e.street, e.city, e.state, e.zip FROM elevators e JOIN producer_elevators pe ON e.id = pe.elevator_id WHERE pe.producer_id = ?'
);

function enrichProducer(row: ProducerRow) {
  return {
    ...row,
    commodities: (producerCommodityStmt.all(row.id) as { commodity: string }[]).map((c) => c.commodity),
    originator_user_ids: (producerAssignmentStmt.all(row.id) as { originator_user_id: string }[]).map((a) => a.originator_user_id),
    locations: producerLocationStmt.all(row.id) as ProducerLocationRow[],
    elevators: producerElevatorStmt.all(row.id) as { id: string; name: string; address: string | null; street: string | null; city: string | null; state: string | null; zip: string | null }[],
  };
}

app.get('/api/producers', validateQuery(producerQuerySchema), (_req, res) => {
  const originatorUserId = res.locals.query.originator_user_id as string | undefined;
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

app.post('/api/producers', validateBody(createProducerSchema), (req, res) => {
  const { id, name, business_name, lng, lat, address, street, city, state, zip, commodities, originator_user_ids, locations, elevator_ids } = req.body;

  db.prepare('INSERT INTO producers (id, name, business_name, lng, lat, address, street, city, state, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, name, business_name ?? null, lng ?? null, lat ?? null, address ?? null,
    street ?? null, city ?? null, state ?? null, zip ?? null
  );

  if (commodities) {
    const stmt = db.prepare('INSERT OR IGNORE INTO producer_commodities (id, producer_id, commodity) VALUES (?, ?, ?)');
    for (const c of commodities) stmt.run(crypto.randomUUID(), id, c);
  }

  if (originator_user_ids) {
    const stmt = db.prepare('INSERT OR IGNORE INTO producer_assignments (producer_id, originator_user_id) VALUES (?, ?)');
    for (const oid of originator_user_ids) stmt.run(id, oid);
  }

  if (locations) {
    const stmt = db.prepare('INSERT INTO producer_locations (id, producer_id, name, address, street, city, state, zip, lng, lat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const loc of locations) {
      stmt.run(
        loc.id ?? crypto.randomUUID(), id, loc.name, loc.address ?? null,
        loc.street ?? null, loc.city ?? null, loc.state ?? null, loc.zip ?? null,
        loc.lng ?? null, loc.lat ?? null
      );
    }
  }

  if (elevator_ids) {
    const stmt = db.prepare('INSERT OR IGNORE INTO producer_elevators (producer_id, elevator_id) VALUES (?, ?)');
    for (const eid of elevator_ids) stmt.run(id, eid);
  }

  const row = db.prepare('SELECT * FROM producers WHERE id = ?').get(id) as ProducerRow;
  res.status(201).json(enrichProducer(row));
});

app.put('/api/producers/:id', validateBody(updateProducerSchema), (req, res) => {
  const id = req.params.id as string;
  const { name, business_name, lng, lat, address, street, city, state, zip, commodities, originator_user_ids, locations, elevator_ids } = req.body;
  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (business_name !== undefined) { updates.push('business_name = ?'); params.push(business_name); }
  if (lng !== undefined) { updates.push('lng = ?'); params.push(lng); }
  if (lat !== undefined) { updates.push('lat = ?'); params.push(lat); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (street !== undefined) { updates.push('street = ?'); params.push(street); }
  if (city !== undefined) { updates.push('city = ?'); params.push(city); }
  if (state !== undefined) { updates.push('state = ?'); params.push(state); }
  if (zip !== undefined) { updates.push('zip = ?'); params.push(zip); }
  if (updates.length) {
    params.push(id);
    db.prepare(`UPDATE producers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  if (commodities && Array.isArray(commodities)) {
    db.prepare('DELETE FROM producer_commodities WHERE producer_id = ?').run(id);
    const stmt = db.prepare('INSERT INTO producer_commodities (id, producer_id, commodity) VALUES (?, ?, ?)');
    for (const c of commodities) stmt.run(crypto.randomUUID(), id, c);
  }
  if (originator_user_ids && Array.isArray(originator_user_ids)) {
    db.prepare('DELETE FROM producer_assignments WHERE producer_id = ?').run(id);
    const stmt = db.prepare('INSERT OR IGNORE INTO producer_assignments (producer_id, originator_user_id) VALUES (?, ?)');
    for (const oid of originator_user_ids) stmt.run(id, oid);
  }
  if (locations && Array.isArray(locations)) {
    db.prepare('DELETE FROM producer_locations WHERE producer_id = ?').run(id);
    const stmt = db.prepare('INSERT INTO producer_locations (id, producer_id, name, address, street, city, state, zip, lng, lat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const loc of locations) {
      stmt.run(
        loc.id ?? crypto.randomUUID(), id, loc.name, loc.address ?? null,
        loc.street ?? null, loc.city ?? null, loc.state ?? null, loc.zip ?? null,
        loc.lng ?? null, loc.lat ?? null
      );
    }
  }
  if (elevator_ids && Array.isArray(elevator_ids)) {
    db.prepare('DELETE FROM producer_elevators WHERE producer_id = ?').run(id);
    const stmt = db.prepare('INSERT OR IGNORE INTO producer_elevators (producer_id, elevator_id) VALUES (?, ?)');
    for (const eid of elevator_ids) stmt.run(id, eid);
  }
  const row = db.prepare('SELECT * FROM producers WHERE id = ?').get(id) as ProducerRow;
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
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
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

app.post('/api/competitors', validateBody(createCompetitorSchema), (req, res) => {
  const { id, name, lng, lat, address, street, city, state, zip, commodities } = req.body;

  db.prepare('INSERT INTO competitors (id, name, lng, lat, address, street, city, state, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, name, lng ?? null, lat ?? null, address ?? null,
    street ?? null, city ?? null, state ?? null, zip ?? null
  );

  if (commodities) {
    const stmt = db.prepare('INSERT OR IGNORE INTO competitor_commodities (id, competitor_id, commodity) VALUES (?, ?, ?)');
    for (const c of commodities) stmt.run(crypto.randomUUID(), id, c);
  }

  const row = db.prepare('SELECT * FROM competitors WHERE id = ?').get(id) as CompetitorRow;
  res.status(201).json(enrichCompetitor(row));
});

app.put('/api/competitors/:id', validateBody(updateCompetitorSchema), (req, res) => {
  const id = req.params.id as string;
  const { name, lng, lat, address, street, city, state, zip, commodities } = req.body;
  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (lng !== undefined) { updates.push('lng = ?'); params.push(lng); }
  if (lat !== undefined) { updates.push('lat = ?'); params.push(lat); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (street !== undefined) { updates.push('street = ?'); params.push(street); }
  if (city !== undefined) { updates.push('city = ?'); params.push(city); }
  if (state !== undefined) { updates.push('state = ?'); params.push(state); }
  if (zip !== undefined) { updates.push('zip = ?'); params.push(zip); }
  if (updates.length) {
    params.push(id);
    db.prepare(`UPDATE competitors SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  if (commodities && Array.isArray(commodities)) {
    db.prepare('DELETE FROM competitor_commodities WHERE competitor_id = ?').run(id);
    const stmt = db.prepare('INSERT INTO competitor_commodities (id, competitor_id, commodity) VALUES (?, ?, ?)');
    for (const c of commodities) stmt.run(crypto.randomUUID(), id, c);
  }
  const row = db.prepare('SELECT * FROM competitors WHERE id = ?').get(id) as CompetitorRow;
  if (!row) return res.status(404).json({ error: 'Competitor not found' });
  res.json(enrichCompetitor(row));
});

app.delete('/api/competitors/:id', (req, res) => {
  const result = db.prepare('DELETE FROM competitors WHERE id = ?').run(req.params.id);
  res.json({ deleted: result.changes });
});

// ═══════════════════════════════════════════════════════════════════
// ── COMPETITOR BIDS (daily snapshots) ──
// ═══════════════════════════════════════════════════════════════════

interface CompetitorBidRow {
  id: string;
  competitor_id: string;
  contract_code: string;
  bid_date: string;
  posted: number;
  created_at: string;
}

interface EnrichedCompetitorBid extends CompetitorBidRow {
  competitor_name: string;
  competitor_lng: number | null;
  competitor_lat: number | null;
}

app.get('/api/competitor-bids', validateQuery(competitorBidQuerySchema), (_req, res) => {
  const { contract_code, date } = res.locals.query;

  const bidDate = date ?? new Date().toISOString().slice(0, 10);

  const rows = db.prepare(`
    SELECT cb.*, c.name AS competitor_name, c.lng AS competitor_lng, c.lat AS competitor_lat
    FROM competitor_bids cb
    JOIN competitors c ON c.id = cb.competitor_id
    WHERE cb.contract_code = ? AND cb.bid_date = ?
    ORDER BY cb.posted DESC
  `).all(contract_code, bidDate) as EnrichedCompetitorBid[];

  res.json(rows);
});

// ═══════════════════════════════════════════════════════════════════
// ── SCENARIOS (merchant bid pricing models) ──
// ═══════════════════════════════════════════════════════════════════

interface ScenarioRow {
  id: string;
  merchant_user_id: string;
  elevator_id: string;
  contract_code: string;
  contract_label: string;
  posted: number;
  max: number;
  leeway: number;
  increment: number;
  freight: number;
  is_active: number;
  updated_by: string | null;
  created_at: string;
}

interface ScenarioWindowRow {
  id: string;
  scenario_id: string;
  window_code: string;
  window_label: string;
  is_override: number;
  posted: number | null;
  max: number | null;
  leeway: number | null;
  increment: number | null;
  freight: number | null;
}

const scenarioWindowStmt = db.prepare('SELECT * FROM scenario_windows WHERE scenario_id = ? ORDER BY window_code');

function enrichScenario(row: ScenarioRow) {
  const elevator = db.prepare('SELECT name FROM elevators WHERE id = ?').get(row.elevator_id) as { name: string } | undefined;
  return {
    ...row,
    elevator_name: elevator?.name ?? null,
    windows: scenarioWindowStmt.all(row.id) as ScenarioWindowRow[],
  };
}

// GET /api/scenarios — fetch active scenarios for a merchant
app.get('/api/scenarios', validateQuery(scenarioQuerySchema), (_req, res) => {
  const merchantUserId = res.locals.query.merchant_user_id;

  const rows = db.prepare(
    'SELECT * FROM scenarios WHERE merchant_user_id = ? AND is_active = 1 ORDER BY contract_code'
  ).all(merchantUserId) as ScenarioRow[];

  res.json({ scenarios: rows.map(enrichScenario) });
});

// GET /api/scenarios/check — check if an active scenario exists for a combo
app.get('/api/scenarios/check', validateQuery(scenarioCheckQuerySchema), (_req, res) => {
  const { merchant_user_id, elevator_id, contract_code } = res.locals.query;

  const row = db.prepare(
    'SELECT * FROM scenarios WHERE merchant_user_id = ? AND elevator_id = ? AND contract_code = ? AND is_active = 1'
  ).get(merchant_user_id, elevator_id, contract_code) as ScenarioRow | undefined;

  res.json({ exists: !!row, scenario: row ? enrichScenario(row) : null });
});

// POST /api/scenarios — create a new scenario (optionally replacing existing)
app.post('/api/scenarios', validateBody(createScenarioSchema), (req, res) => {
  const {
    id, merchant_user_id, elevator_id, contract_code, contract_label,
    posted, max, leeway, increment, freight, updated_by, windows, replace,
  } = req.body;

  // Check for existing active scenario for same combo
  const existing = db.prepare(
    'SELECT id FROM scenarios WHERE merchant_user_id = ? AND elevator_id = ? AND contract_code = ? AND is_active = 1'
  ).get(merchant_user_id, elevator_id, contract_code) as { id: string } | undefined;

  if (existing && !replace) {
    return res.status(409).json({ error: 'An active scenario already exists for this combination', existing_id: existing.id });
  }

  const createScenario = db.transaction(() => {
    // Deactivate existing scenario if replacing
    if (existing) {
      db.prepare('UPDATE scenarios SET is_active = 0 WHERE id = ?').run(existing.id);
    }

    // Insert new scenario
    db.prepare(
      'INSERT INTO scenarios (id, merchant_user_id, elevator_id, contract_code, contract_label, posted, max, leeway, increment, freight, is_active, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)'
    ).run(id, merchant_user_id, elevator_id, sanitize(contract_code), sanitize(contract_label), posted, max, leeway, increment, freight, updated_by ? sanitize(updated_by) : null);

    // Insert windows
    if (windows) {
      const stmt = db.prepare(
        'INSERT INTO scenario_windows (id, scenario_id, window_code, window_label, is_override, posted, max, leeway, increment, freight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const w of windows) {
        stmt.run(
          w.id ?? crypto.randomUUID(), id, w.window_code, w.window_label,
          w.is_override ? 1 : 0, w.posted ?? null, w.max ?? null, w.leeway ?? null, w.increment ?? null, w.freight ?? null
        );
      }
    }
  });

  createScenario();

  const row = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id) as ScenarioRow;
  res.status(201).json(enrichScenario(row));
});

// DELETE /api/scenarios/:id — delete a scenario and its windows (cascade)
app.delete('/api/scenarios/:id', (req, res) => {
  const result = db.prepare('DELETE FROM scenarios WHERE id = ?').run(req.params.id);
  res.json({ deleted: result.changes });
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
