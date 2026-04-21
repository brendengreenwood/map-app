/**
 * Seed script — creates sample users (admin, merchants, originators) and elevators.
 * Run: npx tsx server/seed.ts
 */
import db from './db.js';
import crypto from 'crypto';

const uuid = () => crypto.randomUUID();

// Check if already seeded
const existing = db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number };
if (existing.n > 0) {
  console.log('Database already has users — skipping seed.');
  process.exit(0);
}

// ── Users ──

const adminUser = { id: uuid(), name: 'Brendan', types: ['admin'] };
const merchantUsers = [
  { id: uuid(), name: 'Jake Morrison', types: ['merchant'] },
  { id: uuid(), name: 'Sarah Chen', types: ['merchant'] },
];
const originatorUsers = [
  { id: uuid(), name: 'Mike Hendricks', types: ['originator'] },
  { id: uuid(), name: 'Rachel Whitfield', types: ['originator'] },
  { id: uuid(), name: 'Tom Brinkley', types: ['originator'] },
  { id: uuid(), name: 'Ana Rodriguez', types: ['originator'] },
  { id: uuid(), name: 'Chris Dahlgren', types: ['originator'] },
  { id: uuid(), name: 'Dustin Kowalski', types: ['originator'] },
  { id: uuid(), name: 'Lisa Bergstrom', types: ['originator'] },
  { id: uuid(), name: 'Kevin Tanaka', types: ['originator'] },
  { id: uuid(), name: 'Megan O\'Brien', types: ['originator'] },
  { id: uuid(), name: 'Carlos Vega', types: ['originator'] },
  { id: uuid(), name: 'Brett Sorensen', types: ['originator'] },
  { id: uuid(), name: 'Amy Patterson', types: ['originator'] },
  { id: uuid(), name: 'Nick Furman', types: ['originator'] },
];

const allUsers = [adminUser, ...merchantUsers, ...originatorUsers];
const insertUser = db.prepare('INSERT INTO users (id, name, types, preferences) VALUES (?, ?, ?, ?)');
for (const u of allUsers) {
  insertUser.run(u.id, u.name, JSON.stringify(u.types), JSON.stringify({}));
}

// ── Elevators (no merchant assigned yet — admin does that) ──

const elevators = [
  { id: uuid(), name: 'Ames Terminal',         lng: -93.6208, lat: 42.0347, address: 'Ames, IA',         commodities: ['corn', 'soybeans'] },
  { id: uuid(), name: 'Des Moines Elevator',   lng: -93.6091, lat: 41.5868, address: 'Des Moines, IA',   commodities: ['corn', 'soybeans', 'wheat'] },
  { id: uuid(), name: 'Cedar Rapids Grain',    lng: -91.6656, lat: 41.9779, address: 'Cedar Rapids, IA',  commodities: ['corn', 'soybeans'] },
  { id: uuid(), name: 'Peoria River Terminal', lng: -89.5890, lat: 40.6936, address: 'Peoria, IL',        commodities: ['corn', 'soybeans', 'wheat', 'sorghum'] },
  { id: uuid(), name: 'Lincoln Hub',           lng: -96.6852, lat: 40.8136, address: 'Lincoln, NE',       commodities: ['corn', 'soybeans', 'wheat'] },
  { id: uuid(), name: 'Omaha River Elevator',  lng: -95.9345, lat: 41.2565, address: 'Omaha, NE',         commodities: ['corn', 'soybeans'] },
  { id: uuid(), name: 'Indianapolis East',     lng: -86.1581, lat: 39.7684, address: 'Indianapolis, IN',  commodities: ['corn', 'soybeans', 'wheat'] },
];

const insertElevator = db.prepare('INSERT INTO elevators (id, merchant_user_id, name, lng, lat, address) VALUES (?, ?, ?, ?, ?, ?)');
const insertCommodity = db.prepare('INSERT INTO elevator_commodities (id, elevator_id, commodity) VALUES (?, ?, ?)');

for (const e of elevators) {
  insertElevator.run(e.id, null, e.name, e.lng, e.lat, e.address);
  for (const c of e.commodities) {
    insertCommodity.run(uuid(), e.id, c);
  }
}

// ── Assignments (originators → merchants) — none by default, admin assigns them ──

console.log(`Seeded:`);
console.log(`  1 admin user (${adminUser.name})`);
console.log(`  ${merchantUsers.length} merchant users`);
console.log(`  ${originatorUsers.length} originator users`);
console.log(`  ${elevators.length} elevators (unassigned)`);
console.log(`\nAdmin assigns originators to merchants and elevators to merchants via the Admin panel.`);
