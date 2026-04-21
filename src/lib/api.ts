const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface FeatureRow {
  id: number;
  lng: number;
  lat: number;
  name: string | null;
  category: string | null;
  value: number | null;
  properties: string | null;
}

export interface Stats {
  total: number;
  categories: { category: string; count: number }[];
  bounds: { west: number; east: number; south: number; north: number } | null;
}

export async function fetchFeatures(params?: {
  west?: number; south?: number; east?: number; north?: number;
  category?: string; limit?: number; offset?: number;
}): Promise<{ features: FeatureRow[]; total: number }> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) qs.set(k, String(v));
    }
  }
  const res = await fetch(`${API_URL}/api/features?${qs}`);
  return res.json();
}

export async function fetchFeaturesGeoJSON(params?: {
  west?: number; south?: number; east?: number; north?: number;
  category?: string; limit?: number;
}): Promise<GeoJSON.FeatureCollection> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) qs.set(k, String(v));
    }
  }
  const res = await fetch(`${API_URL}/api/features/geojson?${qs}`);
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_URL}/api/features/stats`);
  return res.json();
}

export async function insertFeature(feature: {
  lng: number; lat: number; name?: string; category?: string;
  value?: number; properties?: Record<string, unknown>;
}): Promise<{ id: number }> {
  const res = await fetch(`${API_URL}/api/features`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feature),
  });
  return res.json();
}

export async function bulkInsert(features: {
  lng: number; lat: number; name?: string; category?: string;
  value?: number; properties?: Record<string, unknown>;
}[]): Promise<{ inserted: number }> {
  const res = await fetch(`${API_URL}/api/features/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
  });
  return res.json();
}

export async function deleteFeature(id: number): Promise<{ deleted: number }> {
  const res = await fetch(`${API_URL}/api/features/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function clearFeatures(): Promise<{ deleted: number }> {
  const res = await fetch(`${API_URL}/api/features`, { method: 'DELETE' });
  return res.json();
}

// ── Users ──

export type UserType = 'merchant' | 'originator' | 'admin';

export interface UserRow {
  id: string;
  name: string;
  types: UserType[];
  preferences: Record<string, unknown>;
  created_at?: string;
}

export async function fetchUsers(): Promise<{ users: UserRow[] }> {
  const res = await fetch(`${API_URL}/api/users`);
  return res.json();
}

export async function createUser(user: { id: string; name: string; types?: UserType[]; preferences?: Record<string, unknown> }): Promise<UserRow> {
  const res = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return res.json();
}

export async function updateUser(id: string, data: { name?: string; types?: UserType[]; preferences?: Record<string, unknown> }): Promise<UserRow> {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteUserApi(id: string): Promise<{ deleted: number }> {
  const res = await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
  return res.json();
}

// ── Elevators ──

export interface ElevatorRow {
  id: string;
  merchant_user_id: string | null;
  name: string;
  lng: number;
  lat: number;
  address: string | null;
  commodities: string[];
  created_at: string;
}

export async function fetchElevators(merchantUserId?: string): Promise<{ elevators: ElevatorRow[] }> {
  const qs = merchantUserId ? `?merchant_user_id=${merchantUserId}` : '';
  const res = await fetch(`${API_URL}/api/elevators${qs}`);
  return res.json();
}

export async function createElevator(elevator: {
  id: string; merchant_user_id?: string; name: string;
  lng: number; lat: number; address?: string; commodities?: string[];
}): Promise<ElevatorRow> {
  const res = await fetch(`${API_URL}/api/elevators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(elevator),
  });
  return res.json();
}

export async function updateElevator(id: string, data: {
  name?: string; lng?: number; lat?: number; address?: string;
  commodities?: string[]; merchant_user_id?: string | null;
}): Promise<ElevatorRow> {
  const res = await fetch(`${API_URL}/api/elevators/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteElevator(id: string): Promise<{ deleted: number }> {
  const res = await fetch(`${API_URL}/api/elevators/${id}`, { method: 'DELETE' });
  return res.json();
}

// ── Merchant–Originator Assignments ──

export interface AssignmentRow {
  merchant_user_id: string;
  originator_user_id: string;
  created_at: string;
}

export async function fetchAssignments(params?: {
  merchant_user_id?: string; originator_user_id?: string;
}): Promise<{ assignments: AssignmentRow[] }> {
  const qs = new URLSearchParams();
  if (params?.merchant_user_id) qs.set('merchant_user_id', params.merchant_user_id);
  if (params?.originator_user_id) qs.set('originator_user_id', params.originator_user_id);
  const res = await fetch(`${API_URL}/api/assignments?${qs}`);
  return res.json();
}

export async function createAssignment(merchant_user_id: string, originator_user_id: string): Promise<AssignmentRow> {
  const res = await fetch(`${API_URL}/api/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_user_id, originator_user_id }),
  });
  return res.json();
}

export async function deleteAssignment(merchant_user_id: string, originator_user_id: string): Promise<{ deleted: number }> {
  const res = await fetch(`${API_URL}/api/assignments`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_user_id, originator_user_id }),
  });
  return res.json();
}

// ── Producers (farmers) ──

export interface ProducerLocation {
  id: string;
  producer_id: string;
  name: string;
  address: string | null;
  lng: number | null;
  lat: number | null;
  created_at: string;
}

export interface ProducerRow {
  id: string;
  name: string;
  business_name: string | null;
  lng: number | null;
  lat: number | null;
  address: string | null;
  commodities: string[];
  originator_user_ids: string[];
  locations: ProducerLocation[];
  created_at: string;
}

export async function fetchProducers(): Promise<{ producers: ProducerRow[] }> {
  const res = await fetch(`${API_URL}/api/producers`);
  return res.json();
}

export async function createProducer(producer: {
  id: string;
  name: string;
  business_name?: string;
  lng?: number;
  lat?: number;
  address?: string;
  commodities?: string[];
  originator_user_ids?: string[];
  locations?: { id?: string; name: string; address?: string; lng?: number; lat?: number }[];
}): Promise<ProducerRow> {
  const res = await fetch(`${API_URL}/api/producers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producer),
  });
  return res.json();
}

export async function updateProducer(id: string, data: {
  name?: string;
  business_name?: string;
  lng?: number;
  lat?: number;
  address?: string;
  commodities?: string[];
  originator_user_ids?: string[];
  locations?: { id?: string; name: string; address?: string; lng?: number; lat?: number }[];
}): Promise<ProducerRow> {
  const res = await fetch(`${API_URL}/api/producers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteProducer(id: string): Promise<{ deleted: number }> {
  const res = await fetch(`${API_URL}/api/producers/${id}`, { method: 'DELETE' });
  return res.json();
}

// ── Competitors (rival grain elevators) ──

export interface CompetitorRow {
  id: string;
  name: string;
  lng: number | null;
  lat: number | null;
  address: string | null;
  commodities: string[];
  created_at: string;
}

export async function fetchCompetitors(): Promise<{ competitors: CompetitorRow[] }> {
  const res = await fetch(`${API_URL}/api/competitors`);
  return res.json();
}

export async function createCompetitor(competitor: {
  id: string; name: string; lng: number; lat: number;
  address?: string; commodities?: string[];
}): Promise<CompetitorRow> {
  const res = await fetch(`${API_URL}/api/competitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(competitor),
  });
  return res.json();
}

export async function updateCompetitor(id: string, data: {
  name?: string; lng?: number; lat?: number; address?: string;
  commodities?: string[];
}): Promise<CompetitorRow> {
  const res = await fetch(`${API_URL}/api/competitors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCompetitor(id: string): Promise<{ deleted: number }> {
  const res = await fetch(`${API_URL}/api/competitors/${id}`, { method: 'DELETE' });
  return res.json();
}
