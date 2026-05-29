/**
 * Producer demo seeder — deterministically scatters ~2000 producers within a
 * ~150 mile radius of the Cargill Sidney, OH facility. Also ensures the
 * Cargill Sidney elevator exists. Idempotent.
 *
 * Run directly:   npx tsx server/seed-producers.ts
 * Auto-invoked from server/index.ts on boot if producer count is zero.
 */
import db from './db.js';
import crypto from 'crypto';

const uuid = () => crypto.randomUUID();

// Cargill Sidney, OH
export const SIDNEY_LNG = -84.1555;
export const SIDNEY_LAT = 40.2842;
export const SIDNEY_NAME = 'Cargill Sidney';

const PRODUCER_TARGET = 2000;
const RADIUS_MILES = 150;

// Deterministic PRNG (mulberry32) — same seed → same producer set every run
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'John', 'Mary', 'Robert', 'Linda', 'Michael', 'Patricia', 'James', 'Barbara',
  'David', 'Susan', 'Richard', 'Jessica', 'Charles', 'Karen', 'Joseph', 'Nancy',
  'Thomas', 'Betty', 'Daniel', 'Sandra', 'Paul', 'Donna', 'Mark', 'Carol',
  'Donald', 'Ruth', 'George', 'Sharon', 'Kenneth', 'Michelle', 'Steven',
  'Laura', 'Edward', 'Sarah', 'Brian', 'Kimberly', 'Ronald', 'Deborah',
  'Anthony', 'Dorothy',
];
const LAST = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green',
  'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Turner',
  'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart',
  'Morris', 'Murphy',
];

// Counties around Sidney within ~150 miles (Ohio + Indiana + Michigan border + Kentucky tip)
const COUNTIES = [
  // Ohio
  'Shelby, OH', 'Auglaize, OH', 'Logan, OH', 'Champaign, OH', 'Miami, OH',
  'Darke, OH', 'Mercer, OH', 'Van Wert, OH', 'Allen, OH', 'Putnam, OH',
  'Hardin, OH', 'Marion, OH', 'Union, OH', 'Madison, OH', 'Clark, OH',
  'Greene, OH', 'Montgomery, OH', 'Preble, OH', 'Butler, OH', 'Warren, OH',
  // Indiana
  'Jay, IN', 'Randolph, IN', 'Wayne, IN', 'Henry, IN', 'Delaware, IN',
  'Blackford, IN', 'Wells, IN', 'Adams, IN', 'Allen, IN', 'Huntington, IN',
  'Grant, IN', 'Madison, IN', 'Hamilton, IN', 'Hancock, IN', 'Rush, IN',
  // Kentucky tip
  'Boone, KY', 'Kenton, KY', 'Campbell, KY',
  // Michigan border
  'Hillsdale, MI', 'Lenawee, MI', 'Branch, MI',
];

const COMMODITIES = ['corn', 'soybeans', 'wheat'] as const;

/** Sample inside a circle (uniform area), radius in miles → degrees. */
function sampleInRadius(rng: () => number, lng: number, lat: number, radiusMiles: number) {
  // ~1 degree latitude = 69.0 miles; 1 degree longitude = 69 * cos(lat)
  const r = Math.sqrt(rng()) * radiusMiles;
  const theta = rng() * Math.PI * 2;
  const dLat = (r * Math.sin(theta)) / 69.0;
  const dLng = (r * Math.cos(theta)) / (69.0 * Math.cos((lat * Math.PI) / 180));
  return { lng: lng + dLng, lat: lat + dLat };
}

// ── Ensure Cargill Sidney elevator exists ──

export function ensureCargillSidney(): { elevatorId: string; created: boolean } {
  const existing = db
    .prepare('SELECT id FROM elevators WHERE name = ? AND lng = ? AND lat = ?')
    .get(SIDNEY_NAME, SIDNEY_LNG, SIDNEY_LAT) as { id: string } | undefined;
  if (existing) return { elevatorId: existing.id, created: false };

  const id = uuid();
  db.prepare(
    'INSERT INTO elevators (id, merchant_user_id, name, lng, lat, address, street, city, state, zip) ' +
      'VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    SIDNEY_NAME,
    SIDNEY_LNG,
    SIDNEY_LAT,
    'Sidney, OH',
    null,
    'Sidney',
    'OH',
    '45365'
  );
  for (const c of ['corn', 'soybeans']) {
    db.prepare(
      'INSERT OR IGNORE INTO elevator_commodities (id, elevator_id, commodity) VALUES (?, ?, ?)'
    ).run(uuid(), id, c);
  }
  return { elevatorId: id, created: true };
}

// ── Seed demo producers ──

export function seedDemoProducers(): { inserted: number; total: number } {
  const existing = db
    .prepare("SELECT COUNT(*) as n FROM producers WHERE id LIKE 'demo-%'")
    .get() as { n: number };

  if (existing.n >= PRODUCER_TARGET) {
    return { inserted: 0, total: existing.n };
  }

  const rng = mulberry32(0xC0FFEE);

  const insertProducer = db.prepare(
    'INSERT INTO producers (id, name, business_name, lng, lat, address, street, city, state, zip, farm_size_acres, commodity, county) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertMany = db.transaction((rows: number) => {
    const needed = PRODUCER_TARGET - existing.n;
    for (let i = 0; i < needed; i += 1) {
      const { lng, lat } = sampleInRadius(rng, SIDNEY_LNG, SIDNEY_LAT, RADIUS_MILES);
      const first = FIRST[Math.floor(rng() * FIRST.length)];
      const last = LAST[Math.floor(rng() * LAST.length)];
      const name = `${first} ${last}`;
      const business = rng() < 0.55 ? `${last} Family Farms` : null;
      const county = COUNTIES[Math.floor(rng() * COUNTIES.length)];
      const commodity = COMMODITIES[Math.floor(rng() * COMMODITIES.length)];
      const acres = Math.floor(80 + rng() * 3920); // 80–4000
      const id = `demo-${existing.n + i}`;
      const [city, state] = county.split(', ');
      insertProducer.run(
        id,
        name,
        business,
        lng,
        lat,
        county,
        null,
        city,
        state,
        null,
        acres,
        commodity,
        county
      );
    }
    return rows;
  });

  insertMany(PRODUCER_TARGET - existing.n);

  const total = (db.prepare('SELECT COUNT(*) as n FROM producers').get() as { n: number }).n;
  return { inserted: PRODUCER_TARGET - existing.n, total };
}

// ── CLI entrypoint ──

if (process.argv[1] && process.argv[1].endsWith('seed-producers.ts')) {
  const { elevatorId, created } = ensureCargillSidney();
  console.log(`Cargill Sidney elevator: ${elevatorId} (${created ? 'created' : 'existing'})`);
  const { inserted, total } = seedDemoProducers();
  console.log(`Demo producers: +${inserted} (total ${total})`);
}
