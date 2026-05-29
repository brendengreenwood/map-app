import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(import.meta.dirname, '../data/map.db');

// Ensure data directory exists
import { mkdirSync } from 'fs';
mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Performance settings
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000'); // 64MB cache

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lng REAL NOT NULL,
    lat REAL NOT NULL,
    name TEXT,
    category TEXT,
    value REAL,
    properties TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_features_coords ON features(lng, lat);
  CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    types TEXT NOT NULL DEFAULT '[]',
    preferences TEXT NOT NULL DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migrations — add columns that may not exist in older DBs
const userColumns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
if (!userColumns.some((c) => c.name === 'types')) {
  db.exec("ALTER TABLE users ADD COLUMN types TEXT NOT NULL DEFAULT '[]'");
}

// Migration: add structured address columns (street, city, state, zip) to all entity tables
const addressMigrationTables = ['elevators', 'producers', 'producer_locations', 'competitors'];
for (const table of addressMigrationTables) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === 'street')) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN street TEXT`);
    db.exec(`ALTER TABLE ${table} ADD COLUMN city TEXT`);
    db.exec(`ALTER TABLE ${table} ADD COLUMN state TEXT`);
    db.exec(`ALTER TABLE ${table} ADD COLUMN zip TEXT`);
  }
}

// Migration: producer demo fields (farm size, primary commodity, county)
const producerCols = db.prepare("PRAGMA table_info(producers)").all() as { name: string }[];
if (producerCols.length > 0 && !producerCols.some((c) => c.name === 'farm_size_acres')) {
  db.exec(`ALTER TABLE producers ADD COLUMN farm_size_acres INTEGER`);
}
if (producerCols.length > 0 && !producerCols.some((c) => c.name === 'commodity')) {
  db.exec(`ALTER TABLE producers ADD COLUMN commodity TEXT`);
}
if (producerCols.length > 0 && !producerCols.some((c) => c.name === 'county')) {
  db.exec(`ALTER TABLE producers ADD COLUMN county TEXT`);
}
if (producerCols.length > 0 && !producerCols.some((c) => c.name === 'last_spotted_at')) {
  db.exec(`ALTER TABLE producers ADD COLUMN last_spotted_at TEXT`);
}
if (producerCols.length > 0 && !producerCols.some((c) => c.name === 'last_contacted_at')) {
  db.exec(`ALTER TABLE producers ADD COLUMN last_contacted_at TEXT`);
}
if (producerCols.length > 0 && !producerCols.some((c) => c.name === 'account_type')) {
  db.exec(`ALTER TABLE producers ADD COLUMN account_type TEXT`);
}
db.exec(`CREATE INDEX IF NOT EXISTS idx_producers_coords ON producers(lng, lat)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_producers_account_type ON producers(account_type)`);

// ── Domain tables ──

db.exec(`
  CREATE TABLE IF NOT EXISTS elevators (
    id TEXT PRIMARY KEY,
    merchant_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    lng REAL NOT NULL,
    lat REAL NOT NULL,
    address TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS elevator_commodities (
    id TEXT PRIMARY KEY,
    elevator_id TEXT NOT NULL REFERENCES elevators(id) ON DELETE CASCADE,
    commodity TEXT NOT NULL,
    UNIQUE(elevator_id, commodity)
  );

  CREATE TABLE IF NOT EXISTS merchant_originators (
    merchant_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    originator_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (merchant_user_id, originator_user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_elevators_merchant_user ON elevators(merchant_user_id);
  CREATE INDEX IF NOT EXISTS idx_merchant_originators_merchant ON merchant_originators(merchant_user_id);
  CREATE INDEX IF NOT EXISTS idx_merchant_originators_originator ON merchant_originators(originator_user_id);
`);

// ── Producers (farmers) ──

db.exec(`
  CREATE TABLE IF NOT EXISTS producers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business_name TEXT,
    lng REAL,
    lat REAL,
    address TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS producer_locations (
    id TEXT PRIMARY KEY,
    producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    lng REAL,
    lat REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS producer_commodities (
    id TEXT PRIMARY KEY,
    producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
    commodity TEXT NOT NULL,
    UNIQUE(producer_id, commodity)
  );

  CREATE TABLE IF NOT EXISTS producer_assignments (
    producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
    originator_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (producer_id, originator_user_id)
  );

  CREATE TABLE IF NOT EXISTS producer_elevators (
    producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
    elevator_id TEXT NOT NULL REFERENCES elevators(id) ON DELETE CASCADE,
    PRIMARY KEY (producer_id, elevator_id)
  );

  CREATE INDEX IF NOT EXISTS idx_producer_locations_producer ON producer_locations(producer_id);
  CREATE INDEX IF NOT EXISTS idx_producer_assignments_originator ON producer_assignments(originator_user_id);
  CREATE INDEX IF NOT EXISTS idx_producer_elevators_elevator ON producer_elevators(elevator_id);
`);

// ── Competitors (rival grain elevators) ──

db.exec(`
  CREATE TABLE IF NOT EXISTS competitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lng REAL,
    lat REAL,
    address TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS competitor_commodities (
    id TEXT PRIMARY KEY,
    competitor_id TEXT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    commodity TEXT NOT NULL,
    UNIQUE(competitor_id, commodity)
  );
`);

// ── Competitor bids (daily snapshots from GeoGrains) ──

db.exec(`
  CREATE TABLE IF NOT EXISTS competitor_bids (
    id TEXT PRIMARY KEY,
    competitor_id TEXT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    contract_code TEXT NOT NULL,
    bid_date TEXT NOT NULL,
    posted INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_competitor_bids_lookup
    ON competitor_bids(contract_code, bid_date);
  CREATE INDEX IF NOT EXISTS idx_competitor_bids_competitor
    ON competitor_bids(competitor_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_competitor_bids_unique
    ON competitor_bids(competitor_id, contract_code, bid_date);
`);

// ── Scenarios (merchant bid pricing models) ──

// Migration: recreate tables if FK constraints are missing (early schema had no CASCADE)
const scenarioCols = db.prepare("PRAGMA table_info(scenarios)").all() as { name: string }[];
if (scenarioCols.length > 0) {
  // Check if tables need recreation by looking at foreign_key_list
  const fks = db.prepare("PRAGMA foreign_key_list(scenarios)").all() as { on_delete: string }[];
  if (fks.length > 0 && fks.some((fk) => fk.on_delete !== 'CASCADE')) {
    db.exec(`DROP TABLE IF EXISTS scenario_windows; DROP TABLE IF EXISTS scenarios;`);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    merchant_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    elevator_id TEXT NOT NULL REFERENCES elevators(id) ON DELETE CASCADE,
    contract_code TEXT NOT NULL,
    contract_label TEXT NOT NULL,
    posted INTEGER NOT NULL,
    max INTEGER NOT NULL,
    leeway INTEGER NOT NULL,
    increment INTEGER NOT NULL,
    freight INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scenario_windows (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    window_code TEXT NOT NULL,
    window_label TEXT NOT NULL,
    is_override INTEGER NOT NULL DEFAULT 0,
    posted INTEGER,
    max INTEGER,
    leeway INTEGER,
    increment INTEGER,
    freight INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_scenarios_merchant ON scenarios(merchant_user_id);
  CREATE INDEX IF NOT EXISTS idx_scenarios_elevator ON scenarios(elevator_id);
  CREATE INDEX IF NOT EXISTS idx_scenarios_active ON scenarios(merchant_user_id, elevator_id, contract_code, is_active);
  CREATE INDEX IF NOT EXISTS idx_scenario_windows_scenario ON scenario_windows(scenario_id);
`);

export default db;
