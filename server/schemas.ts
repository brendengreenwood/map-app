import { z } from 'zod';

// ── Shared schemas ──

export const idParamSchema = z.object({
  id: z.string().min(1),
});

const lngSchema = z.number().min(-180).max(180);
const latSchema = z.number().min(-90).max(90);

const addressFieldsSchema = z.object({
  address: z.string().nullish(),
  street: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  zip: z.string().nullish(),
});

// ── Features ──

export const featureQuerySchema = z.object({
  west: z.coerce.number().optional(),
  south: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
  north: z.coerce.number().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(100000).default(100000),
  offset: z.coerce.number().int().min(0).default(0),
});

export const featureGeoJsonQuerySchema = z.object({
  west: z.coerce.number().optional(),
  south: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
  north: z.coerce.number().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(100000).default(100000),
});

export const createFeatureSchema = z.object({
  lng: lngSchema,
  lat: latSchema,
  name: z.string().nullish(),
  category: z.string().nullish(),
  value: z.number().nullish(),
  properties: z.record(z.string(), z.unknown()).nullish(),
});

export const bulkFeaturesSchema = z.object({
  features: z.array(
    z.object({
      lng: lngSchema,
      lat: latSchema,
      name: z.string().optional(),
      category: z.string().optional(),
      value: z.number().optional(),
      properties: z.record(z.string(), z.unknown()).optional(),
    })
  ).min(1).max(500000),
});

// ── Users ──

export const createUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  types: z.array(z.string()).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  types: z.array(z.string()).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Nothing to update',
});

// ── Elevators ──

export const elevatorQuerySchema = z.object({
  merchant_user_id: z.string().optional(),
});

export const createElevatorSchema = z.object({
  id: z.string().min(1),
  merchant_user_id: z.string().nullish(),
  name: z.string().min(1),
  lng: lngSchema,
  lat: latSchema,
  commodities: z.array(z.string()).optional(),
}).extend(addressFieldsSchema.shape);

export const updateElevatorSchema = z.object({
  name: z.string().min(1).optional(),
  merchant_user_id: z.string().nullish(),
  lng: lngSchema.optional(),
  lat: latSchema.optional(),
  commodities: z.array(z.string()).optional(),
}).extend(addressFieldsSchema.shape);

// ── Assignments ──

export const assignmentQuerySchema = z.object({
  merchant_user_id: z.string().optional(),
  originator_user_id: z.string().optional(),
});

export const createAssignmentSchema = z.object({
  merchant_user_id: z.string().min(1),
  originator_user_id: z.string().min(1),
});

export const deleteAssignmentSchema = z.object({
  merchant_user_id: z.string().min(1),
  originator_user_id: z.string().min(1),
});

// ── Producers ──

const producerLocationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  lng: lngSchema.nullish(),
  lat: latSchema.nullish(),
}).extend(addressFieldsSchema.shape);

export const producerQuerySchema = z.object({
  originator_user_id: z.string().optional(),
});

export const createProducerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  business_name: z.string().nullish(),
  lng: lngSchema.nullish(),
  lat: latSchema.nullish(),
  commodities: z.array(z.string()).optional(),
  originator_user_ids: z.array(z.string()).optional(),
  locations: z.array(producerLocationSchema).optional(),
  elevator_ids: z.array(z.string()).optional(),
}).extend(addressFieldsSchema.shape);

export const updateProducerSchema = z.object({
  name: z.string().min(1).optional(),
  business_name: z.string().nullish(),
  lng: lngSchema.nullish(),
  lat: latSchema.nullish(),
  commodities: z.array(z.string()).optional(),
  originator_user_ids: z.array(z.string()).optional(),
  locations: z.array(producerLocationSchema).optional(),
  elevator_ids: z.array(z.string()).optional(),
}).extend(addressFieldsSchema.shape);

// ── Competitors ──

export const createCompetitorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lng: lngSchema.nullish(),
  lat: latSchema.nullish(),
  commodities: z.array(z.string()).optional(),
}).extend(addressFieldsSchema.shape);

export const updateCompetitorSchema = z.object({
  name: z.string().min(1).optional(),
  lng: lngSchema.nullish(),
  lat: latSchema.nullish(),
  commodities: z.array(z.string()).optional(),
}).extend(addressFieldsSchema.shape);

// ── Competitor Bids ──

export const competitorBidQuerySchema = z.object({
  contract_code: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ── Scenarios ──

export const scenarioQuerySchema = z.object({
  merchant_user_id: z.string().min(1),
});

export const scenarioCheckQuerySchema = z.object({
  merchant_user_id: z.string().min(1),
  elevator_id: z.string().min(1),
  contract_code: z.string().min(1),
});

const scenarioWindowSchema = z.object({
  id: z.string().optional(),
  window_code: z.string().min(1),
  window_label: z.string().min(1),
  is_override: z.union([z.boolean(), z.number()]).optional(),
  posted: z.number().nullish(),
  max: z.number().nullish(),
  leeway: z.number().nullish(),
  increment: z.number().nullish(),
  freight: z.number().nullish(),
});

export const createScenarioSchema = z.object({
  id: z.string().min(1),
  merchant_user_id: z.string().min(1),
  elevator_id: z.string().min(1),
  contract_code: z.string().min(1),
  contract_label: z.string().min(1),
  posted: z.number(),
  max: z.number(),
  leeway: z.number(),
  increment: z.number(),
  freight: z.number(),
  updated_by: z.string().nullish(),
  windows: z.array(scenarioWindowSchema).optional(),
  replace: z.boolean().optional(),
});
