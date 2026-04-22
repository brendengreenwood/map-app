import {
  pgTable,
  serial,
  text,
  doublePrecision,
  jsonb,
  timestamp,
  index,
  unique,
  primaryKey,
} from 'drizzle-orm/pg-core';

// ── Features ────────────────────────────────────────────

export const features = pgTable(
  'features',
  {
    id: serial('id').primaryKey(),
    lng: doublePrecision('lng').notNull(),
    lat: doublePrecision('lat').notNull(),
    name: text('name'),
    category: text('category'),
    value: doublePrecision('value'),
    properties: jsonb('properties'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('idx_features_coords').on(t.lng, t.lat),
    index('idx_features_category').on(t.category),
  ],
);

// ── Users ───────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  types: jsonb('types').notNull().default([]),
  preferences: jsonb('preferences').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Elevators ───────────────────────────────────────────

export const elevators = pgTable(
  'elevators',
  {
    id: text('id').primaryKey(),
    merchantUserId: text('merchant_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    lng: doublePrecision('lng').notNull(),
    lat: doublePrecision('lat').notNull(),
    address: text('address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [index('idx_elevators_merchant_user').on(t.merchantUserId)],
);

export const elevatorCommodities = pgTable(
  'elevator_commodities',
  {
    id: text('id').primaryKey(),
    elevatorId: text('elevator_id')
      .notNull()
      .references(() => elevators.id, { onDelete: 'cascade' }),
    commodity: text('commodity').notNull(),
  },
  (t) => [unique('elevator_commodities_unique').on(t.elevatorId, t.commodity)],
);

// ── Merchant ↔ Originator assignments ───────────────────

export const merchantOriginators = pgTable(
  'merchant_originators',
  {
    merchantUserId: text('merchant_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    originatorUserId: text('originator_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.merchantUserId, t.originatorUserId] }),
    index('idx_merchant_originators_merchant').on(t.merchantUserId),
    index('idx_merchant_originators_originator').on(t.originatorUserId),
  ],
);

// ── Producers ───────────────────────────────────────────

export const producers = pgTable('producers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  businessName: text('business_name'),
  lng: doublePrecision('lng'),
  lat: doublePrecision('lat'),
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const producerLocations = pgTable(
  'producer_locations',
  {
    id: text('id').primaryKey(),
    producerId: text('producer_id')
      .notNull()
      .references(() => producers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    address: text('address'),
    lng: doublePrecision('lng'),
    lat: doublePrecision('lat'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [index('idx_producer_locations_producer').on(t.producerId)],
);

export const producerCommodities = pgTable(
  'producer_commodities',
  {
    id: text('id').primaryKey(),
    producerId: text('producer_id')
      .notNull()
      .references(() => producers.id, { onDelete: 'cascade' }),
    commodity: text('commodity').notNull(),
  },
  (t) => [unique('producer_commodities_unique').on(t.producerId, t.commodity)],
);

export const producerAssignments = pgTable(
  'producer_assignments',
  {
    producerId: text('producer_id')
      .notNull()
      .references(() => producers.id, { onDelete: 'cascade' }),
    originatorUserId: text('originator_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.producerId, t.originatorUserId] }),
    index('idx_producer_assignments_originator').on(t.originatorUserId),
  ],
);

// ── Competitors ─────────────────────────────────────────

export const competitors = pgTable('competitors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  lng: doublePrecision('lng'),
  lat: doublePrecision('lat'),
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const competitorCommodities = pgTable(
  'competitor_commodities',
  {
    id: text('id').primaryKey(),
    competitorId: text('competitor_id')
      .notNull()
      .references(() => competitors.id, { onDelete: 'cascade' }),
    commodity: text('commodity').notNull(),
  },
  (t) => [
    unique('competitor_commodities_unique').on(t.competitorId, t.commodity),
  ],
);
