import { useCallback, useEffect, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import type { ProducerGeo } from '@/lib/api';
import { pointsInPolygon, type ScreenPoint, type Vec2 } from '@/lib/map-selection';

export type SelectionTool = 'none' | 'push_zone';

/** A user-drawn push zone in map space (lng/lat polygon). */
export interface PushZone {
  id: string;
  label: string;
  /** Closed polygon in [lng, lat] pairs. */
  polygon: [number, number][];
  /** Producer ids captured by the polygon at draw time. */
  producerIds: string[];
  createdAt: number;
}

interface UseMapSelectionOptions {
  mapRef: React.RefObject<maplibregl.Map | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  producers: ProducerGeo[];
  /** Called once a push zone is successfully drawn. The page persists it. */
  onPushZoneDrawn?: (zone: PushZone) => void;
}

function projectProducers(
  map: maplibregl.Map,
  producers: ProducerGeo[]
): ScreenPoint[] {
  return producers.map((p) => {
    const pt = map.project([p.lng, p.lat]);
    return { id: p.id, x: pt.x, y: pt.y };
  });
}

function unprojectPath(map: maplibregl.Map, path: Vec2[]): [number, number][] {
  return path.map((pt) => {
    const ll = map.unproject([pt.x, pt.y]);
    return [ll.lng, ll.lat];
  });
}

export function useMapSelection({
  mapRef,
  overlayRef,
  producers,
  onPushZoneDrawn,
}: UseMapSelectionOptions) {
  const [tool, setTool] = useState<SelectionTool>('none');
  const [isDrawing, setIsDrawing] = useState(false);

  const producersRef = useRef(producers);
  producersRef.current = producers;
  const onPushZoneDrawnRef = useRef(onPushZoneDrawn);
  onPushZoneDrawnRef.current = onPushZoneDrawn;
  const zoneCounterRef = useRef(0);

  // ── Gesture capture (lasso → push zone) ─────────────────────────────
  useEffect(() => {
    const canvas = overlayRef.current;
    const map = mapRef.current;
    if (!canvas || !map) return;
    if (tool === 'none') return;

    // Resize canvas to map container
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const c = canvas.getContext('2d');
      c?.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    let drawing = false;
    let path: Vec2[] = [];

    const ctx = () => canvas.getContext('2d');

    const getPos = (e: PointerEvent): Vec2 => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const clearOverlay = () => {
      const c = ctx();
      if (!c) return;
      c.clearRect(0, 0, canvas.width, canvas.height);
    };

    const drawPath = (pts: Vec2[], close: boolean) => {
      const c = ctx();
      if (!c || pts.length === 0) return;
      clearOverlay();
      c.strokeStyle = '#e8a735';
      c.fillStyle = 'rgba(232, 167, 53, 0.15)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) c.lineTo(pts[i].x, pts[i].y);
      if (close) {
        c.closePath();
        c.fill();
      }
      c.stroke();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      drawing = true;
      setIsDrawing(true);
      const start = getPos(e);
      path = [start];
      canvas.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!drawing) return;
      const pos = getPos(e);
      path.push(pos);
      drawPath(path, true);
    };

    const onUp = (e: PointerEvent) => {
      if (!drawing) {
        drawing = false;
        setIsDrawing(false);
        return;
      }
      const screenPts = projectProducers(map, producersRef.current);
      const hits = path.length >= 3 ? pointsInPolygon(screenPts, path) : [];
      const drawnPath = path.slice();

      drawing = false;
      setIsDrawing(false);
      path = [];
      clearOverlay();

      if (hits.length > 0) {
        zoneCounterRef.current += 1;
        const zone: PushZone = {
          id: `push-zone-${Date.now()}`,
          label: `Push zone #${zoneCounterRef.current}`,
          polygon: unprojectPath(map, drawnPath),
          producerIds: hits,
          createdAt: Date.now(),
        };
        onPushZoneDrawnRef.current?.(zone);
      }

      // Leave drawing mode after a single shape — user re-enters via the panel.
      setTool('none');
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // pointer may already be released
      }
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      window.removeEventListener('resize', resize);
      clearOverlay();
    };
  }, [tool, mapRef, overlayRef]);

  /** Initialize the zone counter from already-persisted zones so labels keep numbering forward. */
  const seedCounter = useCallback((startAt: number) => {
    if (startAt > zoneCounterRef.current) zoneCounterRef.current = startAt;
  }, []);

  return {
    tool,
    setTool,
    isDrawing,
    seedCounter,
  };
}
