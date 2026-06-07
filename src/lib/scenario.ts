// Shared scenario constants — both Configure Market and Select Producers pages
// reference the same id so localStorage keys, persisted filters, and the soon-to-come
// server scenario row line up across the two halves of the flow.

export const SCENARIO_ID = 'cargill-sidney-spring-2026';
export const SCENARIO_TITLE = 'Cargill Sidney — Spring 2026 Bid';

/** Default merchant facility for the demo scenario (Cargill Sidney, OH). */
export const DEFAULT_FACILITY = {
  id: 'elev-cargill-sidney',
  name: 'Cargill Sidney',
  lng: -84.1555,
  lat: 40.2842,
} as const;
