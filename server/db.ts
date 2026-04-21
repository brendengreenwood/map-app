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

// ── Domain tables ──

db.exec(`
  CREATE TABLE IF NOT EXISTS elevators (
    id TEXT PRIMARY KEY,
    merchant_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    lng REAL NOT NULL,
    lat REAL NOT NULL,
    address TEXT,
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
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS producer_locations (
    id TEXT PRIMARY KEY,
    producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
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

  CREATE INDEX IF NOT EXISTS idx_producer_locations_producer ON producer_locations(producer_id);
  CREATE INDEX IF NOT EXISTS idx_producer_assignments_originator ON producer_assignments(originator_user_id);
`);

// ── Competitors (rival grain elevators) ──

db.exec(`
  CREATE TABLE IF NOT EXISTS competitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lng REAL,
    lat REAL,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS competitor_commodities (
    id TEXT PRIMARY KEY,
    competitor_id TEXT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    commodity TEXT NOT NULL,
    UNIQUE(competitor_id, commodity)
  );
`);

export default db;
