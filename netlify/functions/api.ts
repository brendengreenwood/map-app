import type { Context } from '@netlify/functions';
import sql, { initSchema } from './db.js';

// ── Helpers ──

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

function parsePath(url: string) {
  const u = new URL(url);
  const match = u.pathname.match(/^\/api\/(.+)/);
  return match ? match[1] : '';
}

// ── Enrichment helpers ──

async function enrichProducer(row: Record<string, unknown>) {
  const id = row.id as string;
  const commodities = await sql`SELECT commodity FROM producer_commodities WHERE producer_id = ${id}`;
  const assignments = await sql`SELECT originator_user_id FROM producer_assignments WHERE producer_id = ${id}`;
  const locations = await sql`SELECT * FROM producer_locations WHERE producer_id = ${id} ORDER BY name`;
  return {
    ...row,
    commodities: commodities.map((c: Record<string, unknown>) => c.commodity),
    originator_user_ids: assignments.map((a: Record<string, unknown>) => a.originator_user_id),
    locations,
  };
}

async function enrichCompetitor(row: Record<string, unknown>) {
  const id = row.id as string;
  const commodities = await sql`SELECT commodity FROM competitor_commodities WHERE competitor_id = ${id}`;
  return {
    ...row,
    commodities: commodities.map((c: Record<string, unknown>) => c.commodity),
  };
}

async function enrichElevator(row: Record<string, unknown>) {
  const id = row.id as string;
  const commodities = await sql`SELECT commodity FROM elevator_commodities WHERE elevator_id = ${id}`;
  return {
    ...row,
    commodities: commodities.map((c: Record<string, unknown>) => c.commodity),
  };
}

function parseUserRow(r: Record<string, unknown>) {
  return { id: r.id, name: r.name, types: r.types, preferences: r.preferences, created_at: r.created_at };
}

// ═══════════════════════════════════════════════════════════════════

export default async (req: Request, _context: Context) => {
  await initSchema();

  const method = req.method;
  const path = parsePath(req.url);
  const url = new URL(req.url);

  let body: Record<string, unknown> = {};
  if (method !== 'GET' && method !== 'HEAD') {
    try { body = (await req.json()) as Record<string, unknown>; } catch { /* ok */ }
  }

  // ── FEATURES ──

  if (path === 'features' && method === 'GET') {
    const { west, south, east, north, category, limit: lim = '100000', offset: off = '0' } = Object.fromEntries(url.searchParams);
    const limitVal = Number(lim), offsetVal = Number(off);
    let rows, countResult;
    if (west && south && east && north) {
      const w = Number(west), s = Number(south), e = Number(east), n = Number(north);
      if (category) {
        rows = await sql`SELECT id,lng,lat,name,category,value,properties FROM features WHERE lng>=${w} AND lng<=${e} AND lat>=${s} AND lat<=${n} AND category=${category} LIMIT ${limitVal} OFFSET ${offsetVal}`;
        countResult = await sql`SELECT COUNT(*) as count FROM features WHERE lng>=${w} AND lng<=${e} AND lat>=${s} AND lat<=${n} AND category=${category}`;
      } else {
        rows = await sql`SELECT id,lng,lat,name,category,value,properties FROM features WHERE lng>=${w} AND lng<=${e} AND lat>=${s} AND lat<=${n} LIMIT ${limitVal} OFFSET ${offsetVal}`;
        countResult = await sql`SELECT COUNT(*) as count FROM features WHERE lng>=${w} AND lng<=${e} AND lat>=${s} AND lat<=${n}`;
      }
    } else if (category) {
      rows = await sql`SELECT id,lng,lat,name,category,value,properties FROM features WHERE category=${category} LIMIT ${limitVal} OFFSET ${offsetVal}`;
      countResult = await sql`SELECT COUNT(*) as count FROM features WHERE category=${category}`;
    } else {
      rows = await sql`SELECT id,lng,lat,name,category,value,properties FROM features LIMIT ${limitVal} OFFSET ${offsetVal}`;
      countResult = await sql`SELECT COUNT(*) as count FROM features`;
    }
    return json({ features: rows, total: Number(countResult[0].count) });
  }

  if (path === 'features/geojson' && method === 'GET') {
    const { west, south, east, north, category, limit: lim = '100000' } = Object.fromEntries(url.searchParams);
    const limitVal = Number(lim);
    let rows;
    if (west && south && east && north) {
      const w = Number(west), s = Number(south), e = Number(east), n = Number(north);
      if (category) {
        rows = await sql`SELECT id,lng,lat,name,category,value,properties FROM features WHERE lng>=${w} AND lng<=${e} AND lat>=${s} AND lat<=${n} AND category=${category} LIMIT ${limitVal}`;
      } else {
        rows = await sql`SELECT id,lng,lat,name,category,value,properties FROM features WHERE lng>=${w} AND lng<=${e} AND lat>=${s} AND lat<=${n} LIMIT ${limitVal}`;
      }
    } else if (category) {
      rows = await sql`SELECT id,lng,lat,name,category,value,properties FROM features WHERE category=${category} LIMIT ${limitVal}`;
    } else {
      rows = await sql`SELECT id,lng,lat,name,category,value,properties FROM features LIMIT ${limitVal}`;
    }
    const geojson = {
      type: 'FeatureCollection',
      features: rows.map((r: Record<string, unknown>) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
        properties: { id: r.id, name: r.name, category: r.category, value: r.value, ...(typeof r.properties === 'object' && r.properties ? r.properties as Record<string, unknown> : {}) },
      })),
    };
    return json(geojson);
  }

  if (path === 'features/stats' && method === 'GET') {
    const [totalResult, categories, bounds] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM features`,
      sql`SELECT category, COUNT(*) as count FROM features GROUP BY category ORDER BY count DESC`,
      sql`SELECT MIN(lng) as west, MAX(lng) as east, MIN(lat) as south, MAX(lat) as north FROM features`,
    ]);
    return json({ total: Number(totalResult[0].count), categories, bounds: bounds[0] });
  }

  if (path === 'features' && method === 'POST') {
    const { lng, lat, name, category, value, properties } = body;
    if (typeof lng !== 'number' || typeof lat !== 'number') return err('lng and lat are required numbers');
    const result = await sql`INSERT INTO features (lng,lat,name,category,value,properties) VALUES (${lng},${lat},${name??null},${category??null},${value??null},${properties?JSON.stringify(properties):null}) RETURNING id`;
    return json({ id: result[0].id });
  }

  if (path === 'features/bulk' && method === 'POST') {
    const { features } = body;
    if (!Array.isArray(features)) return err('features must be an array');
    for (const f of features as Record<string, unknown>[]) {
      await sql`INSERT INTO features (lng,lat,name,category,value,properties) VALUES (${f.lng as number},${f.lat as number},${(f.name as string)??null},${(f.category as string)??null},${(f.value as number)??null},${f.properties?JSON.stringify(f.properties):null})`;
    }
    return json({ inserted: features.length });
  }

  if (path.match(/^features\/\d+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    const result = await sql`DELETE FROM features WHERE id=${Number(id)} RETURNING id`;
    return json({ deleted: result.length });
  }

  if (path === 'features' && method === 'DELETE') {
    await sql`DELETE FROM features`;
    return json({ deleted: 'all' });
  }

  // ── USERS ──

  if (path === 'users' && method === 'GET') {
    const rows = await sql`SELECT id,name,types,preferences,created_at FROM users ORDER BY created_at ASC`;
    return json({ users: rows.map(parseUserRow) });
  }

  if (path.match(/^users\/[^/]+$/) && method === 'GET') {
    const id = path.split('/')[1];
    const rows = await sql`SELECT id,name,types,preferences,created_at FROM users WHERE id=${id}`;
    if (rows.length === 0) return err('User not found', 404);
    return json(parseUserRow(rows[0]));
  }

  if (path === 'users' && method === 'POST') {
    const { id, name, types, preferences } = body;
    if (!id || !name) return err('id and name are required');
    await sql`INSERT INTO users (id,name,types,preferences) VALUES (${id as string},${name as string},${JSON.stringify(types??[])},${JSON.stringify(preferences??{})})`;
    return json({ id, name, types: types ?? [], preferences: preferences ?? {} }, 201);
  }

  if (path.match(/^users\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/')[1];
    const existing = await sql`SELECT id FROM users WHERE id=${id}`;
    if (existing.length === 0) return err('User not found', 404);
    const { name, types, preferences } = body;
    if (name !== undefined) await sql`UPDATE users SET name=${name as string} WHERE id=${id}`;
    if (types !== undefined) await sql`UPDATE users SET types=${JSON.stringify(types)} WHERE id=${id}`;
    if (preferences !== undefined) await sql`UPDATE users SET preferences=${JSON.stringify(preferences)} WHERE id=${id}`;
    const rows = await sql`SELECT id,name,types,preferences,created_at FROM users WHERE id=${id}`;
    return json(parseUserRow(rows[0]));
  }

  if (path.match(/^users\/[^/]+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    await sql`DELETE FROM users WHERE id=${id}`;
    return json({ deleted: 1 });
  }

  // ── ELEVATORS ──

  if (path === 'elevators' && method === 'GET') {
    const merchantUserId = url.searchParams.get('merchant_user_id');
    let rows;
    if (merchantUserId) {
      rows = await sql`SELECT * FROM elevators WHERE merchant_user_id=${merchantUserId} ORDER BY name`;
    } else {
      rows = await sql`SELECT * FROM elevators ORDER BY name`;
    }
    return json({ elevators: await Promise.all(rows.map(enrichElevator)) });
  }

  if (path === 'elevators' && method === 'POST') {
    const { id, merchant_user_id, name, lng, lat, address, commodities } = body;
    await sql`INSERT INTO elevators (id,merchant_user_id,name,lng,lat,address) VALUES (${id as string},${(merchant_user_id as string)??null},${name as string},${lng as number},${lat as number},${(address as string)??null})`;
    if (Array.isArray(commodities)) {
      for (const c of commodities as string[]) await sql`INSERT INTO elevator_commodities (id,elevator_id,commodity) VALUES (${crypto.randomUUID()},${id as string},${c}) ON CONFLICT DO NOTHING`;
    }
    const rows = await sql`SELECT * FROM elevators WHERE id=${id as string}`;
    return json(await enrichElevator(rows[0]), 201);
  }

  if (path.match(/^elevators\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/')[1];
    const { name, lng, lat, address, commodities, merchant_user_id } = body;
    if (name !== undefined) await sql`UPDATE elevators SET name=${name as string} WHERE id=${id}`;
    if (merchant_user_id !== undefined) await sql`UPDATE elevators SET merchant_user_id=${merchant_user_id as string} WHERE id=${id}`;
    if (lng !== undefined) await sql`UPDATE elevators SET lng=${lng as number} WHERE id=${id}`;
    if (lat !== undefined) await sql`UPDATE elevators SET lat=${lat as number} WHERE id=${id}`;
    if (address !== undefined) await sql`UPDATE elevators SET address=${address as string} WHERE id=${id}`;
    if (Array.isArray(commodities)) {
      await sql`DELETE FROM elevator_commodities WHERE elevator_id=${id}`;
      for (const c of commodities as string[]) await sql`INSERT INTO elevator_commodities (id,elevator_id,commodity) VALUES (${crypto.randomUUID()},${id},${c})`;
    }
    const rows = await sql`SELECT * FROM elevators WHERE id=${id}`;
    return json(await enrichElevator(rows[0]));
  }

  if (path.match(/^elevators\/[^/]+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    await sql`DELETE FROM elevators WHERE id=${id}`;
    return json({ deleted: 1 });
  }

  // ── ASSIGNMENTS ──

  if (path === 'assignments' && method === 'GET') {
    const merchantUserId = url.searchParams.get('merchant_user_id');
    const originatorUserId = url.searchParams.get('originator_user_id');
    let rows;
    if (merchantUserId) rows = await sql`SELECT * FROM merchant_originators WHERE merchant_user_id=${merchantUserId}`;
    else if (originatorUserId) rows = await sql`SELECT * FROM merchant_originators WHERE originator_user_id=${originatorUserId}`;
    else rows = await sql`SELECT * FROM merchant_originators`;
    return json({ assignments: rows });
  }

  if (path === 'assignments' && method === 'POST') {
    const { merchant_user_id, originator_user_id } = body;
    await sql`INSERT INTO merchant_originators (merchant_user_id,originator_user_id) VALUES (${merchant_user_id as string},${originator_user_id as string}) ON CONFLICT DO NOTHING`;
    return json({ merchant_user_id, originator_user_id }, 201);
  }

  if (path === 'assignments' && method === 'DELETE') {
    const { merchant_user_id, originator_user_id } = body;
    await sql`DELETE FROM merchant_originators WHERE merchant_user_id=${merchant_user_id as string} AND originator_user_id=${originator_user_id as string}`;
    return json({ deleted: 1 });
  }

  // ── PRODUCERS ──

  if (path === 'producers' && method === 'GET') {
    const originatorUserId = url.searchParams.get('originator_user_id');
    let rows;
    if (originatorUserId) rows = await sql`SELECT p.* FROM producers p JOIN producer_assignments pa ON p.id=pa.producer_id WHERE pa.originator_user_id=${originatorUserId} ORDER BY p.name`;
    else rows = await sql`SELECT * FROM producers ORDER BY name`;
    return json({ producers: await Promise.all(rows.map(enrichProducer)) });
  }

  if (path === 'producers' && method === 'POST') {
    const { id, name, business_name, lng, lat, address, commodities, originator_user_ids, locations } = body;
    if (!id || !name) return err('id and name are required');
    await sql`INSERT INTO producers (id,name,business_name,lng,lat,address) VALUES (${id as string},${name as string},${(business_name as string)??null},${(lng as number)??null},${(lat as number)??null},${(address as string)??null})`;
    if (Array.isArray(commodities)) {
      for (const c of commodities as string[]) await sql`INSERT INTO producer_commodities (id,producer_id,commodity) VALUES (${crypto.randomUUID()},${id as string},${c}) ON CONFLICT DO NOTHING`;
    }
    if (Array.isArray(originator_user_ids)) {
      for (const oid of originator_user_ids as string[]) await sql`INSERT INTO producer_assignments (producer_id,originator_user_id) VALUES (${id as string},${oid}) ON CONFLICT DO NOTHING`;
    }
    if (Array.isArray(locations)) {
      for (const loc of locations as {id?:string;name:string;address?:string;lng?:number;lat?:number}[]) {
        await sql`INSERT INTO producer_locations (id,producer_id,name,address,lng,lat) VALUES (${loc.id??crypto.randomUUID()},${id as string},${loc.name},${loc.address??null},${loc.lng??null},${loc.lat??null})`;
      }
    }
    const rows = await sql`SELECT * FROM producers WHERE id=${id as string}`;
    return json(await enrichProducer(rows[0]), 201);
  }

  if (path.match(/^producers\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/')[1];
    const { name, business_name, lng, lat, address, commodities, originator_user_ids, locations } = body;
    if (name !== undefined) await sql`UPDATE producers SET name=${name as string} WHERE id=${id}`;
    if (business_name !== undefined) await sql`UPDATE producers SET business_name=${business_name as string} WHERE id=${id}`;
    if (lng !== undefined) await sql`UPDATE producers SET lng=${lng as number} WHERE id=${id}`;
    if (lat !== undefined) await sql`UPDATE producers SET lat=${lat as number} WHERE id=${id}`;
    if (address !== undefined) await sql`UPDATE producers SET address=${address as string} WHERE id=${id}`;
    if (Array.isArray(commodities)) {
      await sql`DELETE FROM producer_commodities WHERE producer_id=${id}`;
      for (const c of commodities as string[]) await sql`INSERT INTO producer_commodities (id,producer_id,commodity) VALUES (${crypto.randomUUID()},${id},${c})`;
    }
    if (Array.isArray(originator_user_ids)) {
      await sql`DELETE FROM producer_assignments WHERE producer_id=${id}`;
      for (const oid of originator_user_ids as string[]) await sql`INSERT INTO producer_assignments (producer_id,originator_user_id) VALUES (${id},${oid}) ON CONFLICT DO NOTHING`;
    }
    if (Array.isArray(locations)) {
      await sql`DELETE FROM producer_locations WHERE producer_id=${id}`;
      for (const loc of locations as {id?:string;name:string;address?:string;lng?:number;lat?:number}[]) {
        await sql`INSERT INTO producer_locations (id,producer_id,name,address,lng,lat) VALUES (${loc.id??crypto.randomUUID()},${id},${loc.name},${loc.address??null},${loc.lng??null},${loc.lat??null})`;
      }
    }
    const rows = await sql`SELECT * FROM producers WHERE id=${id}`;
    if (rows.length === 0) return err('Producer not found', 404);
    return json(await enrichProducer(rows[0]));
  }

  if (path.match(/^producers\/[^/]+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    await sql`DELETE FROM producers WHERE id=${id}`;
    return json({ deleted: 1 });
  }

  // ── COMPETITORS ──

  if (path === 'competitors' && method === 'GET') {
    const rows = await sql`SELECT * FROM competitors ORDER BY name`;
    return json({ competitors: await Promise.all(rows.map(enrichCompetitor)) });
  }

  if (path === 'competitors' && method === 'POST') {
    const { id, name, lng, lat, address, commodities } = body;
    if (!id || !name) return err('id and name are required');
    await sql`INSERT INTO competitors (id,name,lng,lat,address) VALUES (${id as string},${name as string},${(lng as number)??null},${(lat as number)??null},${(address as string)??null})`;
    if (Array.isArray(commodities)) {
      for (const c of commodities as string[]) await sql`INSERT INTO competitor_commodities (id,competitor_id,commodity) VALUES (${crypto.randomUUID()},${id as string},${c}) ON CONFLICT DO NOTHING`;
    }
    const rows = await sql`SELECT * FROM competitors WHERE id=${id as string}`;
    return json(await enrichCompetitor(rows[0]), 201);
  }

  if (path.match(/^competitors\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/')[1];
    const { name, lng, lat, address, commodities } = body;
    if (name !== undefined) await sql`UPDATE competitors SET name=${name as string} WHERE id=${id}`;
    if (lng !== undefined) await sql`UPDATE competitors SET lng=${lng as number} WHERE id=${id}`;
    if (lat !== undefined) await sql`UPDATE competitors SET lat=${lat as number} WHERE id=${id}`;
    if (address !== undefined) await sql`UPDATE competitors SET address=${address as string} WHERE id=${id}`;
    if (Array.isArray(commodities)) {
      await sql`DELETE FROM competitor_commodities WHERE competitor_id=${id}`;
      for (const c of commodities as string[]) await sql`INSERT INTO competitor_commodities (id,competitor_id,commodity) VALUES (${crypto.randomUUID()},${id},${c})`;
    }
    const rows = await sql`SELECT * FROM competitors WHERE id=${id}`;
    if (rows.length === 0) return err('Competitor not found', 404);
    return json(await enrichCompetitor(rows[0]));
  }

  if (path.match(/^competitors\/[^/]+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    await sql`DELETE FROM competitors WHERE id=${id}`;
    return json({ deleted: 1 });
  }

  return err('Not found', 404);
};

export const config = {
  path: '/api/*',
};
