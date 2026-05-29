/**
 * Originator territory seeder.
 *
 * - Ensures the `users` table has at least 15 originators (tops up with a
 *   static fallback roster if seed.ts was never run).
 * - Carves the radius around Cargill Sidney, OH into 15 angular wedges
 *   (one per originator, sorted by name for deterministic ordering).
 * - Assigns each producer to the originator whose wedge contains the
 *   bearing from Cargill Sidney to the producer.
 *
 * Idempotent: skips assignment work if every producer already has at least
 * one originator linked.
 */
import db from './db.js';
import crypto from 'crypto';
import { SIDNEY_LNG, SIDNEY_LAT } from './seed-producers.js';

const uuid = () => crypto.randomUUID();

const TARGET_ORIGINATORS = 15;

// Fallback names — used only if seed.ts hasn't run and we need to top up.
const FALLBACK_ORIGINATORS = [
  'Mike Hendricks', 'Rachel Whitfield', 'Tom Brinkley', 'Ana Rodriguez',
  'Chris Dahlgren', 'Dustin Kowalski', 'Lisa Bergstrom', 'Kevin Tanaka',
  "Megan O'Brien", 'Carlos Vega', 'Brett Sorensen', 'Amy Patterson',
  'Nick Furman', 'Hannah Lutz', 'Diego Marquez',
];

interface UserRow {
  id: string;
  name: string;
  types: string;
}

function listOriginators(): { id: string; name: string }[] {
  const rows = db
    .prepare(
      `SELECT id, name, types FROM users
       WHERE EXISTS (
         SELECT 1 FROM json_each(users.types) WHERE json_each.value = 'originator'
       )`
    )
    .all() as UserRow[];
  return rows
    .map((r) => ({ id: r.id, name: r.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function ensureOriginatorRoster(): { id: string; name: string }[] {
  let current = listOriginators();
  if (current.length >= TARGET_ORIGINATORS) return current;

  const have = new Set(current.map((o) => o.name));
  const insert = db.prepare(
    'INSERT INTO users (id, name, types, preferences) VALUES (?, ?, ?, ?)'
  );
  const tx = db.transaction(() => {
    for (const name of FALLBACK_ORIGINATORS) {
      if (current.length >= TARGET_ORIGINATORS) break;
      if (have.has(name)) continue;
      insert.run(uuid(), name, JSON.stringify(['originator']), JSON.stringify({}));
      have.add(name);
      current = current.concat({ id: '', name });
    }
  });
  tx();
  return listOriginators();
}

/** Bearing in radians from (lng0, lat0) → (lng1, lat1), in range [0, 2π). */
function bearingRad(lng0: number, lat0: number, lng1: number, lat1: number): number {
  const φ1 = (lat0 * Math.PI) / 180;
  const φ2 = (lat1 * Math.PI) / 180;
  const Δλ = ((lng1 - lng0) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let θ = Math.atan2(y, x);
  // Normalize to [0, 2π); 0 = due north, π/2 = east (clockwise).
  if (θ < 0) θ += 2 * Math.PI;
  return θ;
}

export function seedOriginatorTerritories(): {
  assigned: number;
  totalProducers: number;
  originators: number;
  skipped: boolean;
} {
  const originators = ensureOriginatorRoster().slice(0, TARGET_ORIGINATORS);

  if (originators.length < TARGET_ORIGINATORS) {
    return {
      assigned: 0,
      totalProducers: 0,
      originators: originators.length,
      skipped: true,
    };
  }

  const totalProducers = (db
    .prepare('SELECT COUNT(*) AS n FROM producers WHERE lng IS NOT NULL AND lat IS NOT NULL')
    .get() as { n: number }).n;

  const assignedCount = (db
    .prepare('SELECT COUNT(DISTINCT producer_id) AS n FROM producer_assignments')
    .get() as { n: number }).n;

  // Skip work if every producer already has at least one assignment.
  if (totalProducers > 0 && assignedCount >= totalProducers) {
    return {
      assigned: 0,
      totalProducers,
      originators: originators.length,
      skipped: true,
    };
  }

  const producers = db
    .prepare('SELECT id, lng, lat FROM producers WHERE lng IS NOT NULL AND lat IS NOT NULL')
    .all() as { id: string; lng: number; lat: number }[];

  const insert = db.prepare(
    'INSERT OR IGNORE INTO producer_assignments (producer_id, originator_user_id) VALUES (?, ?)'
  );

  let assigned = 0;
  const wedge = (2 * Math.PI) / TARGET_ORIGINATORS;
  const tx = db.transaction(() => {
    for (const p of producers) {
      const θ = bearingRad(SIDNEY_LNG, SIDNEY_LAT, p.lng, p.lat);
      const idx = Math.min(TARGET_ORIGINATORS - 1, Math.floor(θ / wedge));
      const originator = originators[idx];
      const result = insert.run(p.id, originator.id);
      if (result.changes > 0) assigned += 1;
    }
  });
  tx();

  return {
    assigned,
    totalProducers,
    originators: originators.length,
    skipped: false,
  };
}

// CLI entrypoint
if (process.argv[1] && process.argv[1].endsWith('seed-originators.ts')) {
  const result = seedOriginatorTerritories();
  console.log(`Originator territories: assigned ${result.assigned} of ${result.totalProducers} producers across ${result.originators} originators${result.skipped ? ' (skipped — already complete)' : ''}`);
}
