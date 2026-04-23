/**
 * Seed script: populate competitors with coordinates and generate 30 days
 * of daily bid snapshots simulating a GeoGrains scheduler.
 *
 * Run: npx tsx server/seed-competitor-bids.ts
 */
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.resolve(import.meta.dirname, '../data/map.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Ensure competitors have coordinates and structured addresses ──

const competitors = [
  {
    id: 'comp-1',
    name: 'Rival Grain Co',
    lng: -91.23,
    lat: 40.85,
    street: '789 Market St',
    city: 'Burlington',
    state: 'IA',
    zip: '52601',
  },
  {
    id: 'comp-midwest',
    name: 'Midwest Grain Hub',
    lng: -91.55,
    lat: 41.02,
    street: '500 Market Blvd',
    city: 'Wapello',
    state: 'IA',
    zip: '52653',
  },
  {
    id: 'comp-prairie',
    name: 'Prairie Valley Elevator',
    lng: -92.01,
    lat: 40.73,
    street: '300 Elevator Rd',
    city: 'Fairfield',
    state: 'IA',
    zip: '52556',
  },
  {
    id: 'comp-river',
    name: 'River Bend Grain',
    lng: -91.07,
    lat: 41.12,
    street: '150 River Ln',
    city: 'Muscatine',
    state: 'IA',
    zip: '52761',
  },
  {
    id: 'comp-central',
    name: 'Central Iowa Coop',
    lng: -91.68,
    lat: 41.18,
    street: '220 Coop Dr',
    city: 'Washington',
    state: 'IA',
    zip: '52353',
  },
];

// Upsert competitors
const upsertCompetitor = db.prepare(`
  INSERT INTO competitors (id, name, lng, lat, street, city, state, zip)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    lng = excluded.lng,
    lat = excluded.lat,
    street = excluded.street,
    city = excluded.city,
    state = excluded.state,
    zip = excluded.zip
`);

// Also ensure competitor_commodities exist
const upsertCommodity = db.prepare(`
  INSERT OR IGNORE INTO competitor_commodities (id, competitor_id, commodity)
  VALUES (?, ?, ?)
`);

// Remove old competitor that had different ID format
db.prepare(`DELETE FROM competitors WHERE id = ?`).run('5272b45e-c500-4d0a-8ec3-d7f0501273a9');

for (const c of competitors) {
  upsertCompetitor.run(c.id, c.name, c.lng, c.lat, c.street, c.city, c.state, c.zip);
  upsertCommodity.run(`${c.id}-corn`, c.id, 'corn');
}

console.log(`✓ Upserted ${competitors.length} competitors with coordinates`);

// ── Generate 30 days of daily bid snapshots ──

const contractCodes = ['N26', 'U26', 'Z26', 'H27', 'K27', 'N27'];

// Base posted bids per competitor per contract (cents basis)
// These are realistic corn basis values for Iowa
const baseBids: Record<string, Record<string, number>> = {
  'comp-1':       { N26: -28, U26: -25, Z26: -20, H27: -22, K27: -18, N27: -16 },
  'comp-midwest': { N26: -30, U26: -27, Z26: -22, H27: -24, K27: -20, N27: -18 },
  'comp-prairie': { N26: -32, U26: -29, Z26: -24, H27: -26, K27: -22, N27: -20 },
  'comp-river':   { N26: -26, U26: -23, Z26: -18, H27: -20, K27: -16, N27: -14 },
  'comp-central': { N26: -29, U26: -26, Z26: -21, H27: -23, K27: -19, N27: -17 },
};

// Clear existing bids
db.prepare('DELETE FROM competitor_bids').run();

const insertBid = db.prepare(`
  INSERT INTO competitor_bids (id, competitor_id, contract_code, bid_date, posted)
  VALUES (?, ?, ?, ?, ?)
`);

const today = new Date('2026-04-23');
let bidCount = 0;

const insertAll = db.transaction(() => {
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().slice(0, 10);

    for (const comp of competitors) {
      for (const contract of contractCodes) {
        const base = baseBids[comp.id][contract];
        // Random walk: each day varies ±0-3 cents from base, with some trend
        // Closer to expiry → tighter basis (less negative)
        const trendFactor = (30 - dayOffset) / 30; // 0 → 1 over 30 days
        const trend = Math.round(trendFactor * 3); // basis tightens ~3¢ over month
        const noise = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const posted = base + trend + noise;

        const id = crypto.randomUUID();
        insertBid.run(id, comp.id, contract, dateStr, posted);
        bidCount++;
      }
    }
  }
});

insertAll();

console.log(`✓ Seeded ${bidCount} competitor bid rows (${competitors.length} competitors × ${contractCodes.length} contracts × 30 days)`);

// Verify
const sample = db.prepare(`
  SELECT cb.bid_date, c.name, cb.contract_code, cb.posted
  FROM competitor_bids cb
  JOIN competitors c ON c.id = cb.competitor_id
  WHERE cb.bid_date = '2026-04-23'
  ORDER BY cb.contract_code, cb.posted DESC
`).all();
console.log(`\nSample: today's bids (${sample.length} rows):`);
for (const row of sample as any[]) {
  console.log(`  ${row.bid_date}  ${row.name.padEnd(24)} ${row.contract_code}  ${row.posted}¢`);
}

db.close();
