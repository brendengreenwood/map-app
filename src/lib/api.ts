const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '');

/** Fetch wrapper that throws on non-ok responses */
async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { error?: string } | null)?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

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
  return apiFetch(`${API_URL}/api/features?${qs}`);
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
  return apiFetch(`${API_URL}/api/features/geojson?${qs}`);
}

export async function fetchStats(): Promise<Stats> {
  return apiFetch(`${API_URL}/api/features/stats`);
}

export async function insertFeature(feature: {
  lng: number; lat: number; name?: string; category?: string;
  value?: number; properties?: Record<string, unknown>;
}): Promise<{ id: number }> {
  return apiFetch(`${API_URL}/api/features`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feature),
  });
}

export async function bulkInsert(features: {
  lng: number; lat: number; name?: string; category?: string;
  value?: number; properties?: Record<string, unknown>;
}[]): Promise<{ inserted: number }> {
  return apiFetch(`${API_URL}/api/features/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
  });
}

export async function deleteFeature(id: number): Promise<{ deleted: number }> {
  return apiFetch(`${API_URL}/api/features/${id}`, { method: 'DELETE' });
}

export async function clearFeatures(): Promise<{ deleted: number }> {
  return apiFetch(`${API_URL}/api/features`, { method: 'DELETE' });
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

export async function fetchUsers(signal?: AbortSignal): Promise<{ users: UserRow[] }> {
  return apiFetch(`${API_URL}/api/users`, signal ? { signal } : undefined);
}

export async function createUser(user: { id: string; name: string; types?: UserType[]; preferences?: Record<string, unknown> | { theme: string } }): Promise<UserRow> {
  return apiFetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
}

export async function updateUser(id: string, data: { name?: string; types?: UserType[]; preferences?: Record<string, unknown> }): Promise<UserRow> {
  return apiFetch(`${API_URL}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteUserApi(id: string): Promise<{ deleted: number }> {
  return apiFetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
}

// ── Address helpers ──

export interface AddressFields {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

/** Build a display string like "123 Main St, Des Moines, IA 50309" from structured fields. */
export function formatAddress(addr: Partial<AddressFields> | null | undefined): string {
  if (!addr) return '';
  const parts: string[] = [];
  if (addr.street) parts.push(addr.street);
  const cityStateZip = [addr.city, addr.state].filter(Boolean).join(', ')
    + (addr.zip ? ` ${addr.zip}` : '');
  if (cityStateZip.trim()) parts.push(cityStateZip.trim());
  return parts.join(', ');
}

// ── Elevators ──

export interface ElevatorRow {
  id: string;
  merchant_user_id: string | null;
  name: string;
  lng: number;
  lat: number;
  address: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  commodities: string[];
  created_at: string;
}

export async function fetchElevators(merchantUserId?: string): Promise<{ elevators: ElevatorRow[] }> {
  const qs = merchantUserId ? `?merchant_user_id=${merchantUserId}` : '';
  return apiFetch(`${API_URL}/api/elevators${qs}`);
}

export async function createElevator(elevator: {
  id: string; merchant_user_id?: string; name: string;
  lng: number; lat: number; address?: string;
  street?: string; city?: string; state?: string; zip?: string;
  commodities?: string[];
}): Promise<ElevatorRow> {
  return apiFetch(`${API_URL}/api/elevators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(elevator),
  });
}

export async function updateElevator(id: string, data: {
  name?: string; lng?: number; lat?: number; address?: string;
  street?: string; city?: string; state?: string; zip?: string;
  commodities?: string[]; merchant_user_id?: string | null;
}): Promise<ElevatorRow> {
  return apiFetch(`${API_URL}/api/elevators/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteElevator(id: string): Promise<{ deleted: number }> {
  return apiFetch(`${API_URL}/api/elevators/${id}`, { method: 'DELETE' });
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
  return apiFetch(`${API_URL}/api/assignments?${qs}`);
}

export async function createAssignment(merchant_user_id: string, originator_user_id: string): Promise<AssignmentRow> {
  return apiFetch(`${API_URL}/api/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_user_id, originator_user_id }),
  });
}

export async function deleteAssignment(merchant_user_id: string, originator_user_id: string): Promise<{ deleted: number }> {
  return apiFetch(`${API_URL}/api/assignments`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_user_id, originator_user_id }),
  });
}

// ── Producers (farmers) ──

export interface ProducerLocation {
  id: string;
  producer_id: string;
  name: string;
  address: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lng: number | null;
  lat: number | null;
  created_at: string;
}

export interface ProducerElevator {
  id: string;
  name: string;
  address: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export interface ProducerRow {
  id: string;
  name: string;
  business_name: string | null;
  lng: number | null;
  lat: number | null;
  address: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  commodities: string[];
  originator_user_ids: string[];
  locations: ProducerLocation[];
  elevators: ProducerElevator[];
  created_at: string;
}

export async function fetchProducers(): Promise<{ producers: ProducerRow[] }> {
  return apiFetch(`${API_URL}/api/producers`);
}

export async function createProducer(producer: {
  id: string;
  name: string;
  business_name?: string;
  lng?: number;
  lat?: number;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  commodities?: string[];
  originator_user_ids?: string[];
  locations?: { id?: string; name: string; address?: string; street?: string; city?: string; state?: string; zip?: string; lng?: number; lat?: number }[];
  elevator_ids?: string[];
}): Promise<ProducerRow> {
  return apiFetch(`${API_URL}/api/producers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producer),
  });
}

export async function updateProducer(id: string, data: {
  name?: string;
  business_name?: string;
  lng?: number;
  lat?: number;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  commodities?: string[];
  originator_user_ids?: string[];
  locations?: { id?: string; name: string; address?: string; street?: string; city?: string; state?: string; zip?: string; lng?: number; lat?: number }[];
  elevator_ids?: string[];
}): Promise<ProducerRow> {
  return apiFetch(`${API_URL}/api/producers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteProducer(id: string): Promise<{ deleted: number }> {
  return apiFetch(`${API_URL}/api/producers/${id}`, { method: 'DELETE' });
}

// ── Competitors (rival grain elevators) ──

export interface CompetitorRow {
  id: string;
  name: string;
  lng: number | null;
  lat: number | null;
  address: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  commodities: string[];
  created_at: string;
}

export async function fetchCompetitors(): Promise<{ competitors: CompetitorRow[] }> {
  return apiFetch(`${API_URL}/api/competitors`);
}

export async function createCompetitor(competitor: {
  id: string; name: string; lng?: number | null; lat?: number | null;
  address?: string; street?: string; city?: string; state?: string; zip?: string;
  commodities?: string[];
}): Promise<CompetitorRow> {
  return apiFetch(`${API_URL}/api/competitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(competitor),
  });
}

export async function updateCompetitor(id: string, data: {
  name?: string; lng?: number; lat?: number; address?: string;
  street?: string; city?: string; state?: string; zip?: string;
  commodities?: string[];
}): Promise<CompetitorRow> {
  return apiFetch(`${API_URL}/api/competitors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteCompetitor(id: string): Promise<{ deleted: number }> {
  return apiFetch(`${API_URL}/api/competitors/${id}`, { method: 'DELETE' });
}

// ── Competitor Bids (daily snapshots) ──

export interface CompetitorBidRow {
  id: string;
  competitor_id: string;
  contract_code: string;
  bid_date: string;
  posted: number;
  created_at: string;
  competitor_name: string;
  competitor_lng: number | null;
  competitor_lat: number | null;
}

export async function fetchCompetitorBids(
  contractCode: string,
  date?: string,
): Promise<CompetitorBidRow[]> {
  const params = new URLSearchParams({ contract_code: contractCode });
  if (date) params.set('date', date);
  return apiFetch(`${API_URL}/api/competitor-bids?${params}`);
}

// ── Scenarios (merchant bid pricing models) ──

export interface ScenarioWindowRow {
  id: string;
  scenario_id: string;
  window_code: string;
  window_label: string;
  is_override: number;
  posted: number | null;
  max: number | null;
  leeway: number | null;
  increment: number | null;
  freight: number | null;
}

export interface ScenarioRow {
  id: string;
  merchant_user_id: string;
  elevator_id: string;
  contract_code: string;
  contract_label: string;
  posted: number;
  max: number;
  leeway: number;
  increment: number;
  freight: number;
  is_active: number;
  updated_by: string | null;
  created_at: string;
  elevator_name: string | null;
  windows: ScenarioWindowRow[];
}

export async function fetchScenarios(merchantUserId: string): Promise<{ scenarios: ScenarioRow[] }> {
  return apiFetch(`${API_URL}/api/scenarios?merchant_user_id=${merchantUserId}`);
}

export async function checkScenarioExists(
  merchantUserId: string, elevatorId: string, contractCode: string
): Promise<{ exists: boolean; scenario: ScenarioRow | null }> {
  const qs = new URLSearchParams({ merchant_user_id: merchantUserId, elevator_id: elevatorId, contract_code: contractCode });
  return apiFetch(`${API_URL}/api/scenarios/check?${qs}`);
}

export async function createScenario(scenario: {
  id: string;
  merchant_user_id: string;
  elevator_id: string;
  contract_code: string;
  contract_label: string;
  posted: number;
  max: number;
  leeway: number;
  increment: number;
  freight: number;
  updated_by?: string;
  replace?: boolean;
  windows?: {
    id?: string;
    window_code: string;
    window_label: string;
    is_override?: boolean;
    posted?: number;
    max?: number;
    leeway?: number;
    increment?: number;
    freight?: number;
  }[];
}): Promise<ScenarioRow> {
  return apiFetch(`${API_URL}/api/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario),
  });
}

export async function deleteScenario(id: string): Promise<{ deleted: number }> {
  return apiFetch(`${API_URL}/api/scenarios/${id}`, { method: 'DELETE' });
}
