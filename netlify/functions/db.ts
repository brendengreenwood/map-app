import { neon } from '@netlify/neon';

const sql = neon();

export default sql;

// ── Schema initialization (Postgres syntax) ──

let schemaReady: Promise<void> | null = null;

export function initSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = createSchema();
  return schemaReady;
}

async function createSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS features (
      id SERIAL PRIMARY KEY,
      lng DOUBLE PRECISION NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      name TEXT,
      category TEXT,
      value DOUBLE PRECISION,
      properties JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_features_coords ON features(lng, lat)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_features_category ON features(category)`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      types JSONB NOT NULL DEFAULT '[]',
      preferences JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS elevators (
      id TEXT PRIMARY KEY,
      merchant_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS elevator_commodities (
      id TEXT PRIMARY KEY,
      elevator_id TEXT NOT NULL REFERENCES elevators(id) ON DELETE CASCADE,
      commodity TEXT NOT NULL,
      UNIQUE(elevator_id, commodity)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS merchant_originators (
      merchant_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      originator_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (merchant_user_id, originator_user_id)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_elevators_merchant_user ON elevators(merchant_user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_merchant_originators_merchant ON merchant_originators(merchant_user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_merchant_originators_originator ON merchant_originators(originator_user_id)`;

  // Producers
  await sql`
    CREATE TABLE IF NOT EXISTS producers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_name TEXT,
      lng DOUBLE PRECISION,
      lat DOUBLE PRECISION,
      address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS producer_locations (
      id TEXT PRIMARY KEY,
      producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT,
      lng DOUBLE PRECISION,
      lat DOUBLE PRECISION,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS producer_commodities (
      id TEXT PRIMARY KEY,
      producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
      commodity TEXT NOT NULL,
      UNIQUE(producer_id, commodity)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS producer_assignments (
      producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
      originator_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (producer_id, originator_user_id)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_producer_locations_producer ON producer_locations(producer_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_producer_assignments_originator ON producer_assignments(originator_user_id)`;

  // Competitors
  await sql`
    CREATE TABLE IF NOT EXISTS competitors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lng DOUBLE PRECISION,
      lat DOUBLE PRECISION,
      address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS competitor_commodities (
      id TEXT PRIMARY KEY,
      competitor_id TEXT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
      commodity TEXT NOT NULL,
      UNIQUE(competitor_id, commodity)
    )
  `;
}
