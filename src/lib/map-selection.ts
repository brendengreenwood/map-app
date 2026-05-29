/**
 * Pure-JS geometry helpers for map selection tools.
 *
 * All point-in-shape tests operate in screen (pixel) space — the selection
 * hook projects geographic coordinates to screen coordinates before
 * delegating here, so we can use straightforward Cartesian math without
 * worrying about spherical distortion at the selection scale.
 */

export interface ScreenPoint {
  id: string;
  x: number;
  y: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** Test which points fall inside a screen-space axis-aligned rectangle. */
export function pointsInRectangle(
  points: ScreenPoint[],
  rect: { minX: number; minY: number; maxX: number; maxY: number }
): string[] {
  const out: string[] = [];
  for (const p of points) {
    if (p.x >= rect.minX && p.x <= rect.maxX && p.y >= rect.minY && p.y <= rect.maxY) {
      out.push(p.id);
    }
  }
  return out;
}

/** Ray-casting point-in-polygon for screen-space polygons. */
export function pointsInPolygon(points: ScreenPoint[], polygon: Vec2[]): string[] {
  if (polygon.length < 3) return [];
  const out: string[] = [];
  for (const p of points) {
    if (pointInPolygon(p.x, p.y, polygon)) out.push(p.id);
  }
  return out;
}

function pointInPolygon(x: number, y: number, polygon: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Magnetic: returns points within `snapRadiusPx` of any segment of the path.
 */
export function pointsAlongPath(
  points: ScreenPoint[],
  path: Vec2[],
  snapRadiusPx: number
): string[] {
  if (path.length < 2) return [];
  const r2 = snapRadiusPx * snapRadiusPx;
  const out: string[] = [];
  for (const p of points) {
    let minDist2 = Infinity;
    for (let i = 1; i < path.length; i += 1) {
      const d2 = distSqPointSegment(p, path[i - 1], path[i]);
      if (d2 < minDist2) minDist2 = d2;
      if (minDist2 <= r2) break;
    }
    if (minDist2 <= r2) out.push(p.id);
  }
  return out;
}

function distSqPointSegment(p: { x: number; y: number }, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return ex * ex + ey * ey;
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  const ex = p.x - cx;
  const ey = p.y - cy;
  return ex * ex + ey * ey;
}
