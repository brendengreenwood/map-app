// Competitive-zones engine — v1 grid + nearest-winner heuristic.
//
// Given a merchant facility, a set of competitors, and a per-mile distance cost,
// compute who is most competitive at every point in a bounding box around the
// parties. We rasterize a uniform grid (delivered price per party per cell),
// pick the winner per cell, then emit a single Feature<Polygon> per party that
// represents the union of cells where that party wins.
//
// The output is intentionally not a smooth isoband — the goal is something the
// merchant can see at a glance, not a perfectly contoured surface. The pure
// `computeZones` function can be swapped for marching-squares / Voronoi later
// without touching the page or map hook.

import type { CompetitiveZone } from './api';

export interface ZoneParty {
  /** Stable id; appears as Feature.properties.partyId. */
  id: string;
  name: string;
  /** Hex string, e.g. #1f77b4. */
  color: string;
  lng: number;
  lat: number;
  /** Posted bid in cents at the party's own location. */
  postedCents: number;
}

export interface ComputeZonesOptions {
  /**
   * Distance cost in cents per mile. Delivered price = posted − distance × cost.
   * 0 means distance is free → posted dominates everywhere.
   */
  distanceCostCentsPerMile: number;
  /** Grid resolution along the longer axis. Default 80. */
  gridSize?: number;
  /** Padding (degrees) around the bounding box of all parties. Default 0.4°. */
  padDegrees?: number;
}

const MILES_PER_DEGREE_LAT = 69;

function milesBetween(aLng: number, aLat: number, bLng: number, bLat: number): number {
  const phi1 = (aLat * Math.PI) / 180;
  const phi2 = (bLat * Math.PI) / 180;
  const dphi = ((bLat - aLat) * Math.PI) / 180;
  const dlam = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(x));
}

/**
 * Compute one polygon per party covering the cells where that party offers the
 * highest delivered price. Parties with no winning cells are omitted.
 */
export function computeZones(parties: ZoneParty[], options: ComputeZonesOptions): CompetitiveZone[] {
  if (parties.length === 0) return [];

  const gridSize = options.gridSize ?? 80;
  const pad = options.padDegrees ?? 0.4;
  const costPerMile = options.distanceCostCentsPerMile;

  const lngs = parties.map((p) => p.lng);
  const lats = parties.map((p) => p.lat);
  const west = Math.min(...lngs) - pad;
  const east = Math.max(...lngs) + pad;
  const south = Math.min(...lats) - pad;
  const north = Math.max(...lats) + pad;

  // Keep cells roughly square in geographic terms by scaling X by cos(lat).
  const midLat = (south + north) / 2;
  const lngSpan = east - west;
  const latSpan = north - south;
  const lngSpanMiles = lngSpan * MILES_PER_DEGREE_LAT * Math.cos((midLat * Math.PI) / 180);
  const latSpanMiles = latSpan * MILES_PER_DEGREE_LAT;
  const isWider = lngSpanMiles >= latSpanMiles;
  const nx = isWider ? gridSize : Math.max(8, Math.round((lngSpanMiles / latSpanMiles) * gridSize));
  const ny = isWider ? Math.max(8, Math.round((latSpanMiles / lngSpanMiles) * gridSize)) : gridSize;
  const dx = lngSpan / nx;
  const dy = latSpan / ny;

  // winners[y * nx + x] = party index, or -1 if no party.
  const winners = new Int16Array(nx * ny);
  for (let y = 0; y < ny; y++) {
    const lat = south + (y + 0.5) * dy;
    for (let x = 0; x < nx; x++) {
      const lng = west + (x + 0.5) * dx;
      let bestIdx = -1;
      let bestPrice = -Infinity;
      for (let i = 0; i < parties.length; i++) {
        const p = parties[i];
        const dist = milesBetween(p.lng, p.lat, lng, lat);
        const delivered = p.postedCents - dist * costPerMile;
        if (delivered > bestPrice) {
          bestPrice = delivered;
          bestIdx = i;
        }
      }
      winners[y * nx + x] = bestIdx;
    }
  }

  // For each party, build a polygon: rectangular outline of bounding box of
  // its winning cells. Crude but readable — and avoids pulling in turf/jsts.
  // We emit ONE Feature per party; the union of cells is approximated by the
  // bounding box of all winning cells. That's fine for a heuristic v1.
  const zones: CompetitiveZone[] = [];
  for (let i = 0; i < parties.length; i++) {
    let minX = nx;
    let maxX = -1;
    let minY = ny;
    let maxY = -1;
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        if (winners[y * nx + x] === i) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) continue;
    const w = west + minX * dx;
    const e = west + (maxX + 1) * dx;
    const s = south + minY * dy;
    const n = south + (maxY + 1) * dy;
    zones.push({
      partyId: parties[i].id,
      partyName: parties[i].name,
      color: parties[i].color,
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [w, s],
            [e, s],
            [e, n],
            [w, n],
            [w, s],
          ],
        ],
      },
    });
  }

  return zones;
}
