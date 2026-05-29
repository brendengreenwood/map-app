/**
 * Shared deterministic 15-entry color palette for originator territories.
 * Used on both server (when assigning the palette index to each originator
 * in /api/originators) and client (map paint + panel swatches).
 *
 * Colors chosen to be visually distinct on a CARTO basemap (no near-greys,
 * no near-whites, avoid the selection-orange used by the map).
 */
export const ORIGINATOR_PALETTE = [
  '#1f77b4', // blue
  '#ff7f0e', // orange-amber
  '#2ca02c', // green
  '#d62728', // red
  '#9467bd', // purple
  '#8c564b', // brown
  '#e377c2', // pink
  '#17becf', // cyan
  '#bcbd22', // olive
  '#7f7f00', // dark yellow
  '#1abc9c', // teal
  '#3498db', // sky
  '#9b59b6', // amethyst
  '#e74c3c', // tomato
  '#34495e', // slate
] as const;

export const UNASSIGNED_COLOR = '#9ca3af';

/** Returns the palette color for the originator at `index`, wrapping around. */
export function colorByIndex(index: number): string {
  if (index < 0 || !Number.isFinite(index)) return UNASSIGNED_COLOR;
  return ORIGINATOR_PALETTE[index % ORIGINATOR_PALETTE.length];
}

export interface OriginatorLite {
  id: string;
  name: string;
}

/**
 * Sort originators canonically (by name) and return a Map of id → color.
 * Use this on the client to derive the palette without re-fetching.
 */
export function buildOriginatorColorMap(
  originators: OriginatorLite[]
): Map<string, string> {
  const sorted = [...originators].sort((a, b) => a.name.localeCompare(b.name));
  const map = new Map<string, string>();
  sorted.forEach((o, i) => map.set(o.id, colorByIndex(i)));
  return map;
}
