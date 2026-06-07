// Demo seeder: places ~10 competitor elevators around Cargill Sidney, OH,
// and writes a snapshot of competitor_bids for today across the corn
// contract slate. Idempotent — re-runs only fill in rows that are missing.

import db from './db.js';

const CARGILL_SIDNEY = { lng: -84.1555, lat: 40.2842 };
const CONTRACTS: Array<{ code: string; base: number }> = [
  { code: 'N26', base: -25 },
  { code: 'U26', base: -22 },
  { code: 'Z26', base: -18 },
  { code: 'H27', base: -20 },
  { code: 'K27', base: -16 },
  { code: 'N27', base: -14 },
  { code: 'U27', base: -12 },
  { code: 'Z27', base: -10 },
  { code: 'H28', base: -8 },
];

interface SeedCompetitor {
  id: string;
  name: string;
  /** offset in degrees from Cargill Sidney */
  dLng: number;
  dLat: number;
  city: string;
  state: string;
  /** Bid spread vs base, in cents */
  bidSpread: number;
}

const COMPETITORS: SeedCompetitor[] = [
  { id: 'comp-oh-anna',      name: 'Anna Farmers Coop',         dLng: -0.05, dLat:  0.08, city: 'Anna',        state: 'OH', bidSpread:  2 },
  { id: 'comp-oh-piqua',     name: 'Piqua Grain Terminal',      dLng:  0.22, dLat: -0.04, city: 'Piqua',       state: 'OH', bidSpread: -3 },
  { id: 'comp-oh-troy',      name: 'Troy River Elevator',       dLng:  0.30, dLat: -0.18, city: 'Troy',        state: 'OH', bidSpread:  1 },
  { id: 'comp-oh-versailles',name: 'Versailles Coop',           dLng: -0.18, dLat: -0.05, city: 'Versailles',  state: 'OH', bidSpread: -1 },
  { id: 'comp-oh-stparis',   name: 'St. Paris Grain LLC',       dLng:  0.04, dLat: -0.31, city: 'St. Paris',   state: 'OH', bidSpread:  3 },
  { id: 'comp-oh-celina',    name: 'Celina Lakeside Elevator',  dLng: -0.45, dLat:  0.10, city: 'Celina',      state: 'OH', bidSpread: -2 },
  { id: 'comp-oh-fortrec',   name: 'Fort Recovery Grain',       dLng: -0.62, dLat: -0.10, city: 'Fort Recovery', state: 'OH', bidSpread: -4 },
  { id: 'comp-oh-wapak',     name: 'Wapakoneta Grain Co',       dLng: -0.20, dLat:  0.30, city: 'Wapakoneta',  state: 'OH', bidSpread:  0 },
  { id: 'comp-oh-bellefon',  name: 'Bellefontaine Farmers',     dLng:  0.32, dLat:  0.20, city: 'Bellefontaine', state: 'OH', bidSpread:  4 },
  { id: 'comp-oh-greenville',name: 'Greenville River Grain',    dLng: -0.55, dLat: -0.25, city: 'Greenville',  state: 'OH', bidSpread: -1 },
];

export function seedOhioCompetitors(): {
  competitorsInserted: number;
  bidsInserted: number;
  skipped: boolean;
} {
  const existing = db
    .prepare("SELECT COUNT(*) AS n FROM competitors WHERE id LIKE 'comp-oh-%'")
    .get() as { n: number };

  let competitorsInserted = 0;
  let bidsInserted = 0;

  const insertCompetitor = db.prepare(`
    INSERT OR IGNORE INTO competitors (id, name, lng, lat, street, city, state, zip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCommodity = db.prepare(`
    INSERT OR IGNORE INTO competitor_commodities (competitor_id, commodity)
    VALUES (?, 'corn')
  `);

  for (const c of COMPETITORS) {
    const result = insertCompetitor.run(
      c.id,
      c.name,
      CARGILL_SIDNEY.lng + c.dLng,
      CARGILL_SIDNEY.lat + c.dLat,
      '100 Main St',
      c.city,
      c.state,
      '45000',
    );
    if (result.changes > 0) competitorsInserted += 1;
    insertCommodity.run(c.id);
  }

  // Seed today's bid snapshot across all corn contracts, and yesterday's too,
  // so a lookback date of "yesterday" still has data.
  const today = new Date();
  const dates = [
    today.toISOString().slice(0, 10),
    new Date(today.getTime() - 86400000).toISOString().slice(0, 10),
  ];

  const insertBid = db.prepare(`
    INSERT OR IGNORE INTO competitor_bids (id, competitor_id, contract_code, bid_date, posted)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const date of dates) {
    for (const contract of CONTRACTS) {
      for (const c of COMPETITORS) {
        const id = `bid-${c.id}-${contract.code}-${date}`;
        const posted = contract.base + c.bidSpread;
        const r = insertBid.run(id, c.id, contract.code, date, posted);
        if (r.changes > 0) bidsInserted += 1;
      }
    }
  }

  return {
    competitorsInserted,
    bidsInserted,
    skipped: existing.n >= COMPETITORS.length && bidsInserted === 0,
  };
}
