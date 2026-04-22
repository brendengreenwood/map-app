import type { Context } from '@netlify/functions';
import { eq, and, gte, lte, sql, count, min, max, asc } from 'drizzle-orm';
import { db } from '../../src/db/neon';
import * as s from '../../src/db/schema';

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

async function enrichProducer(row: typeof s.producers.$inferSelect) {
  const [commodities, assignments, locations] = await Promise.all([
    db.select({ commodity: s.producerCommodities.commodity }).from(s.producerCommodities).where(eq(s.producerCommodities.producerId, row.id)),
    db.select({ originatorUserId: s.producerAssignments.originatorUserId }).from(s.producerAssignments).where(eq(s.producerAssignments.producerId, row.id)),
    db.select().from(s.producerLocations).where(eq(s.producerLocations.producerId, row.id)).orderBy(asc(s.producerLocations.name)),
  ]);
  return {
    ...row,
    commodities: commodities.map((c) => c.commodity),
    originator_user_ids: assignments.map((a) => a.originatorUserId),
    locations,
  };
}

async function enrichCompetitor(row: typeof s.competitors.$inferSelect) {
  const commodities = await db.select({ commodity: s.competitorCommodities.commodity }).from(s.competitorCommodities).where(eq(s.competitorCommodities.competitorId, row.id));
  return { ...row, commodities: commodities.map((c) => c.commodity) };
}

async function enrichElevator(row: typeof s.elevators.$inferSelect) {
  const commodities = await db.select({ commodity: s.elevatorCommodities.commodity }).from(s.elevatorCommodities).where(eq(s.elevatorCommodities.elevatorId, row.id));
  return { ...row, commodities: commodities.map((c) => c.commodity) };
}

// ═══════════════════════════════════════════════════════════════════

export default async (req: Request, _context: Context) => {
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

    const conditions = [];
    if (west && south && east && north) {
      conditions.push(gte(s.features.lng, Number(west)), lte(s.features.lng, Number(east)), gte(s.features.lat, Number(south)), lte(s.features.lat, Number(north)));
    }
    if (category) conditions.push(eq(s.features.category, category));

    const where = conditions.length ? and(...conditions) : undefined;
    const rows = await db.select().from(s.features).where(where).limit(limitVal).offset(offsetVal);
    const [countResult] = await db.select({ count: count() }).from(s.features).where(where);
    return json({ features: rows, total: countResult.count });
  }

  if (path === 'features/geojson' && method === 'GET') {
    const { west, south, east, north, category, limit: lim = '100000' } = Object.fromEntries(url.searchParams);
    const limitVal = Number(lim);

    const conditions = [];
    if (west && south && east && north) {
      conditions.push(gte(s.features.lng, Number(west)), lte(s.features.lng, Number(east)), gte(s.features.lat, Number(south)), lte(s.features.lat, Number(north)));
    }
    if (category) conditions.push(eq(s.features.category, category));

    const where = conditions.length ? and(...conditions) : undefined;
    const rows = await db.select().from(s.features).where(where).limit(limitVal);
    const geojson = {
      type: 'FeatureCollection',
      features: rows.map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
        properties: { id: r.id, name: r.name, category: r.category, value: r.value, ...(typeof r.properties === 'object' && r.properties ? r.properties as Record<string, unknown> : {}) },
      })),
    };
    return json(geojson);
  }

  if (path === 'features/stats' && method === 'GET') {
    const [[totalResult], categories, [bounds]] = await Promise.all([
      db.select({ count: count() }).from(s.features),
      db.select({ category: s.features.category, count: count() }).from(s.features).groupBy(s.features.category).orderBy(sql`count DESC`),
      db.select({ west: min(s.features.lng), east: max(s.features.lng), south: min(s.features.lat), north: max(s.features.lat) }).from(s.features),
    ]);
    return json({ total: totalResult.count, categories, bounds });
  }

  if (path === 'features' && method === 'POST') {
    const { lng, lat, name, category, value, properties } = body;
    if (typeof lng !== 'number' || typeof lat !== 'number') return err('lng and lat are required numbers');
    const [result] = await db.insert(s.features).values({
      lng, lat,
      name: (name as string) ?? null,
      category: (category as string) ?? null,
      value: (value as number) ?? null,
      properties: properties ?? null,
    }).returning({ id: s.features.id });
    return json({ id: result.id });
  }

  if (path === 'features/bulk' && method === 'POST') {
    const { features } = body;
    if (!Array.isArray(features)) return err('features must be an array');
    const rows = (features as Record<string, unknown>[]).map((f) => ({
      lng: f.lng as number,
      lat: f.lat as number,
      name: (f.name as string) ?? null,
      category: (f.category as string) ?? null,
      value: (f.value as number) ?? null,
      properties: f.properties ?? null,
    }));
    if (rows.length) await db.insert(s.features).values(rows);
    return json({ inserted: rows.length });
  }

  if (path.match(/^features\/\d+$/) && method === 'DELETE') {
    const id = Number(path.split('/')[1]);
    const result = await db.delete(s.features).where(eq(s.features.id, id)).returning({ id: s.features.id });
    return json({ deleted: result.length });
  }

  if (path === 'features' && method === 'DELETE') {
    await db.delete(s.features);
    return json({ deleted: 'all' });
  }

  // ── USERS ──

  if (path === 'users' && method === 'GET') {
    const rows = await db.select().from(s.users).orderBy(asc(s.users.createdAt));
    return json({ users: rows });
  }

  if (path.match(/^users\/[^/]+$/) && method === 'GET') {
    const id = path.split('/')[1];
    const rows = await db.select().from(s.users).where(eq(s.users.id, id));
    if (rows.length === 0) return err('User not found', 404);
    return json(rows[0]);
  }

  if (path === 'users' && method === 'POST') {
    const { id, name, types, preferences } = body;
    if (!id || !name) return err('id and name are required');
    await db.insert(s.users).values({
      id: id as string,
      name: name as string,
      types: types ?? [],
      preferences: preferences ?? {},
    });
    return json({ id, name, types: types ?? [], preferences: preferences ?? {} }, 201);
  }

  if (path.match(/^users\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/')[1];
    const existing = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.id, id));
    if (existing.length === 0) return err('User not found', 404);
    const { name, types, preferences } = body;
    const updates: Partial<typeof s.users.$inferInsert> = {};
    if (name !== undefined) updates.name = name as string;
    if (types !== undefined) updates.types = types;
    if (preferences !== undefined) updates.preferences = preferences;
    if (Object.keys(updates).length) await db.update(s.users).set(updates).where(eq(s.users.id, id));
    const rows = await db.select().from(s.users).where(eq(s.users.id, id));
    return json(rows[0]);
  }

  if (path.match(/^users\/[^/]+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    await db.delete(s.users).where(eq(s.users.id, id));
    return json({ deleted: 1 });
  }

  // ── ELEVATORS ──

  if (path === 'elevators' && method === 'GET') {
    const merchantUserId = url.searchParams.get('merchant_user_id');
    const where = merchantUserId ? eq(s.elevators.merchantUserId, merchantUserId) : undefined;
    const rows = await db.select().from(s.elevators).where(where).orderBy(asc(s.elevators.name));
    return json({ elevators: await Promise.all(rows.map(enrichElevator)) });
  }

  if (path === 'elevators' && method === 'POST') {
    const { id, merchant_user_id, name, lng, lat, address, commodities } = body;
    await db.insert(s.elevators).values({
      id: id as string,
      merchantUserId: (merchant_user_id as string) ?? null,
      name: name as string,
      lng: lng as number,
      lat: lat as number,
      address: (address as string) ?? null,
    });
    if (Array.isArray(commodities)) {
      for (const c of commodities as string[]) {
        await db.insert(s.elevatorCommodities).values({ id: crypto.randomUUID(), elevatorId: id as string, commodity: c }).onConflictDoNothing();
      }
    }
    const rows = await db.select().from(s.elevators).where(eq(s.elevators.id, id as string));
    return json(await enrichElevator(rows[0]), 201);
  }

  if (path.match(/^elevators\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/')[1];
    const { name, lng, lat, address, commodities, merchant_user_id } = body;
    const updates: Partial<typeof s.elevators.$inferInsert> = {};
    if (name !== undefined) updates.name = name as string;
    if (merchant_user_id !== undefined) updates.merchantUserId = merchant_user_id as string;
    if (lng !== undefined) updates.lng = lng as number;
    if (lat !== undefined) updates.lat = lat as number;
    if (address !== undefined) updates.address = address as string;
    if (Object.keys(updates).length) await db.update(s.elevators).set(updates).where(eq(s.elevators.id, id));
    if (Array.isArray(commodities)) {
      await db.delete(s.elevatorCommodities).where(eq(s.elevatorCommodities.elevatorId, id));
      for (const c of commodities as string[]) {
        await db.insert(s.elevatorCommodities).values({ id: crypto.randomUUID(), elevatorId: id, commodity: c });
      }
    }
    const rows = await db.select().from(s.elevators).where(eq(s.elevators.id, id));
    return json(await enrichElevator(rows[0]));
  }

  if (path.match(/^elevators\/[^/]+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    await db.delete(s.elevators).where(eq(s.elevators.id, id));
    return json({ deleted: 1 });
  }

  // ── ASSIGNMENTS ──

  if (path === 'assignments' && method === 'GET') {
    const merchantUserId = url.searchParams.get('merchant_user_id');
    const originatorUserId = url.searchParams.get('originator_user_id');
    let where;
    if (merchantUserId) where = eq(s.merchantOriginators.merchantUserId, merchantUserId);
    else if (originatorUserId) where = eq(s.merchantOriginators.originatorUserId, originatorUserId);
    const rows = await db.select().from(s.merchantOriginators).where(where);
    return json({ assignments: rows });
  }

  if (path === 'assignments' && method === 'POST') {
    const { merchant_user_id, originator_user_id } = body;
    await db.insert(s.merchantOriginators).values({
      merchantUserId: merchant_user_id as string,
      originatorUserId: originator_user_id as string,
    }).onConflictDoNothing();
    return json({ merchant_user_id, originator_user_id }, 201);
  }

  if (path === 'assignments' && method === 'DELETE') {
    const { merchant_user_id, originator_user_id } = body;
    await db.delete(s.merchantOriginators).where(
      and(eq(s.merchantOriginators.merchantUserId, merchant_user_id as string), eq(s.merchantOriginators.originatorUserId, originator_user_id as string)),
    );
    return json({ deleted: 1 });
  }

  // ── PRODUCERS ──

  if (path === 'producers' && method === 'GET') {
    const originatorUserId = url.searchParams.get('originator_user_id');
    let rows;
    if (originatorUserId) {
      rows = await db.select({ producers: s.producers }).from(s.producers)
        .innerJoin(s.producerAssignments, eq(s.producers.id, s.producerAssignments.producerId))
        .where(eq(s.producerAssignments.originatorUserId, originatorUserId))
        .orderBy(asc(s.producers.name))
        .then((r) => r.map((x) => x.producers));
    } else {
      rows = await db.select().from(s.producers).orderBy(asc(s.producers.name));
    }
    return json({ producers: await Promise.all(rows.map(enrichProducer)) });
  }

  if (path === 'producers' && method === 'POST') {
    const { id, name, business_name, lng, lat, address, commodities, originator_user_ids, locations } = body;
    if (!id || !name) return err('id and name are required');
    await db.insert(s.producers).values({
      id: id as string,
      name: name as string,
      businessName: (business_name as string) ?? null,
      lng: (lng as number) ?? null,
      lat: (lat as number) ?? null,
      address: (address as string) ?? null,
    });
    if (Array.isArray(commodities)) {
      for (const c of commodities as string[]) {
        await db.insert(s.producerCommodities).values({ id: crypto.randomUUID(), producerId: id as string, commodity: c }).onConflictDoNothing();
      }
    }
    if (Array.isArray(originator_user_ids)) {
      for (const oid of originator_user_ids as string[]) {
        await db.insert(s.producerAssignments).values({ producerId: id as string, originatorUserId: oid }).onConflictDoNothing();
      }
    }
    if (Array.isArray(locations)) {
      for (const loc of locations as { id?: string; name: string; address?: string; lng?: number; lat?: number }[]) {
        await db.insert(s.producerLocations).values({
          id: loc.id ?? crypto.randomUUID(),
          producerId: id as string,
          name: loc.name,
          address: loc.address ?? null,
          lng: loc.lng ?? null,
          lat: loc.lat ?? null,
        });
      }
    }
    const rows = await db.select().from(s.producers).where(eq(s.producers.id, id as string));
    return json(await enrichProducer(rows[0]), 201);
  }

  if (path.match(/^producers\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/')[1];
    const { name, business_name, lng, lat, address, commodities, originator_user_ids, locations } = body;
    const updates: Partial<typeof s.producers.$inferInsert> = {};
    if (name !== undefined) updates.name = name as string;
    if (business_name !== undefined) updates.businessName = business_name as string;
    if (lng !== undefined) updates.lng = lng as number;
    if (lat !== undefined) updates.lat = lat as number;
    if (address !== undefined) updates.address = address as string;
    if (Object.keys(updates).length) await db.update(s.producers).set(updates).where(eq(s.producers.id, id));
    if (Array.isArray(commodities)) {
      await db.delete(s.producerCommodities).where(eq(s.producerCommodities.producerId, id));
      for (const c of commodities as string[]) {
        await db.insert(s.producerCommodities).values({ id: crypto.randomUUID(), producerId: id, commodity: c });
      }
    }
    if (Array.isArray(originator_user_ids)) {
      await db.delete(s.producerAssignments).where(eq(s.producerAssignments.producerId, id));
      for (const oid of originator_user_ids as string[]) {
        await db.insert(s.producerAssignments).values({ producerId: id, originatorUserId: oid }).onConflictDoNothing();
      }
    }
    if (Array.isArray(locations)) {
      await db.delete(s.producerLocations).where(eq(s.producerLocations.producerId, id));
      for (const loc of locations as { id?: string; name: string; address?: string; lng?: number; lat?: number }[]) {
        await db.insert(s.producerLocations).values({
          id: loc.id ?? crypto.randomUUID(),
          producerId: id,
          name: loc.name,
          address: loc.address ?? null,
          lng: loc.lng ?? null,
          lat: loc.lat ?? null,
        });
      }
    }
    const rows = await db.select().from(s.producers).where(eq(s.producers.id, id));
    if (rows.length === 0) return err('Producer not found', 404);
    return json(await enrichProducer(rows[0]));
  }

  if (path.match(/^producers\/[^/]+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    await db.delete(s.producers).where(eq(s.producers.id, id));
    return json({ deleted: 1 });
  }

  // ── COMPETITORS ──

  if (path === 'competitors' && method === 'GET') {
    const rows = await db.select().from(s.competitors).orderBy(asc(s.competitors.name));
    return json({ competitors: await Promise.all(rows.map(enrichCompetitor)) });
  }

  if (path === 'competitors' && method === 'POST') {
    const { id, name, lng, lat, address, commodities } = body;
    if (!id || !name) return err('id and name are required');
    await db.insert(s.competitors).values({
      id: id as string,
      name: name as string,
      lng: (lng as number) ?? null,
      lat: (lat as number) ?? null,
      address: (address as string) ?? null,
    });
    if (Array.isArray(commodities)) {
      for (const c of commodities as string[]) {
        await db.insert(s.competitorCommodities).values({ id: crypto.randomUUID(), competitorId: id as string, commodity: c }).onConflictDoNothing();
      }
    }
    const rows = await db.select().from(s.competitors).where(eq(s.competitors.id, id as string));
    return json(await enrichCompetitor(rows[0]), 201);
  }

  if (path.match(/^competitors\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/')[1];
    const { name, lng, lat, address, commodities } = body;
    const updates: Partial<typeof s.competitors.$inferInsert> = {};
    if (name !== undefined) updates.name = name as string;
    if (lng !== undefined) updates.lng = lng as number;
    if (lat !== undefined) updates.lat = lat as number;
    if (address !== undefined) updates.address = address as string;
    if (Object.keys(updates).length) await db.update(s.competitors).set(updates).where(eq(s.competitors.id, id));
    if (Array.isArray(commodities)) {
      await db.delete(s.competitorCommodities).where(eq(s.competitorCommodities.competitorId, id));
      for (const c of commodities as string[]) {
        await db.insert(s.competitorCommodities).values({ id: crypto.randomUUID(), competitorId: id, commodity: c });
      }
    }
    const rows = await db.select().from(s.competitors).where(eq(s.competitors.id, id));
    if (rows.length === 0) return err('Competitor not found', 404);
    return json(await enrichCompetitor(rows[0]));
  }

  if (path.match(/^competitors\/[^/]+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    await db.delete(s.competitors).where(eq(s.competitors.id, id));
    return json({ deleted: 1 });
  }

  return err('Not found', 404);
};

export const config = {
  path: '/api/*',
};
