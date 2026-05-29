import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import type { ProducerGeo } from '@/lib/api';
import {
  pointsAlongPath,
  pointsInPolygon,
  pointsInRectangle,
  type ScreenPoint,
  type Vec2,
} from '@/lib/map-selection';

export type SelectionTool = 'none' | 'rectangle' | 'lasso' | 'magnetic';
export type SelectionMode = 'replace' | 'add' | 'subtract';

export interface SelectionLayer {
  id: string;
  tool: Exclude<SelectionTool, 'none'>;
  label: string;
  count: number;
  createdAt: number;
  producerIds: string[];
}

interface UseMapSelectionOptions {
  mapRef: React.RefObject<maplibregl.Map | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  producers: ProducerGeo[];
  /** When provided, sweeps only commit producers whose id is in this set. */
  eligibleIds?: Set<string> | null;
  /** Magnetic-mode snap radius in screen pixels. */
  magneticRadiusPx?: number;
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

function describeRect(label: string, count: number): SelectionLayer['label'] {
  return `${label} (${count})`;
}

export function useMapSelection({
  mapRef,
  overlayRef,
  producers,
  eligibleIds = null,
  magneticRadiusPx = 28,
}: UseMapSelectionOptions) {
  const [tool, setTool] = useState<SelectionTool>('none');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [layers, setLayers] = useState<SelectionLayer[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const toolRef = useRef(tool);
  toolRef.current = tool;
  const producersRef = useRef(producers);
  producersRef.current = producers;
  const eligibleRef = useRef<Set<string> | null>(eligibleIds);
  eligibleRef.current = eligibleIds;

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    setLayers([]);
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== layerId);
      // recompute selectedIds = union of remaining layer ids
      const ids = new Set<string>();
      for (const l of next) {
        for (const id of l.producerIds) ids.add(id);
      }
      setSelectedIds(ids);
      return next;
    });
  }, []);

  const removeProducer = useCallback((producerId: string) => {
    setLayers((prev) =>
      prev
        .map((l) => ({
          ...l,
          producerIds: l.producerIds.filter((id) => id !== producerId),
          count: l.producerIds.filter((id) => id !== producerId).length,
        }))
        .filter((l) => l.producerIds.length > 0)
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(producerId);
      return next;
    });
  }, []);

  const commitSelection = useCallback(
    (
      newIds: string[],
      layer: { tool: Exclude<SelectionTool, 'none'>; label: string }
    ) => {
      if (newIds.length === 0) return;
      const id = `layer-${Date.now()}`;
      const next: SelectionLayer = {
        id,
        tool: layer.tool,
        label: describeRect(layer.label, newIds.length),
        count: newIds.length,
        createdAt: Date.now(),
        producerIds: newIds,
      };
      setLayers((prev) => [...prev, next]);
      setSelectedIds((prev) => {
        const merged = new Set(prev);
        for (const i of newIds) merged.add(i);
        return merged;
      });
    },
    []
  );

  // ── Gesture capture ───────────────────────────────────────────────
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
      const ctx = canvas.getContext('2d');
      ctx?.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    let drawing = false;
    let start: Vec2 | null = null;
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

    const drawRect = (a: Vec2, b: Vec2) => {
      const c = ctx();
      if (!c) return;
      clearOverlay();
      c.strokeStyle = '#e8a735';
      c.fillStyle = 'rgba(232, 167, 53, 0.15)';
      c.lineWidth = 2;
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const w = Math.abs(a.x - b.x);
      const h = Math.abs(a.y - b.y);
      c.fillRect(x, y, w, h);
      c.strokeRect(x, y, w, h);
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
      start = getPos(e);
      path = [start];
      canvas.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!drawing || !start) return;
      const pos = getPos(e);
      if (toolRef.current === 'rectangle') {
        drawRect(start, pos);
      } else {
        path.push(pos);
        drawPath(path, toolRef.current === 'lasso');
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!drawing || !start) {
        drawing = false;
        setIsDrawing(false);
        return;
      }
      const end = getPos(e);
      const currentTool = toolRef.current;
      const screenPts = projectProducers(map, producersRef.current);
      let hits: string[] = [];
      let label = '';

      if (currentTool === 'rectangle') {
        const minX = Math.min(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxX = Math.max(start.x, end.x);
        const maxY = Math.max(start.y, end.y);
        hits = pointsInRectangle(screenPts, { minX, minY, maxX, maxY });
        label = 'Rectangle';
      } else if (currentTool === 'lasso') {
        hits = pointsInPolygon(screenPts, path);
        label = 'Lasso';
      } else if (currentTool === 'magnetic') {
        hits = pointsAlongPath(screenPts, path, magneticRadiusPx);
        label = 'Magnetic';
      }

      drawing = false;
      setIsDrawing(false);
      start = null;
      path = [];
      clearOverlay();

      // Intersect with the eligibility set so sweeps never grab dimmed producers.
      const elig = eligibleRef.current;
      const eligibleHits = elig === null ? hits : hits.filter((id) => elig.has(id));

      if (eligibleHits.length > 0 && currentTool !== 'none') {
        commitSelection(eligibleHits, {
          tool: currentTool,
          label,
        });
      }
      canvas.releasePointerCapture(e.pointerId);
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
  }, [tool, mapRef, overlayRef, commitSelection, magneticRadiusPx]);

  const selectedProducers = useMemo(
    () => producers.filter((p) => selectedIds.has(p.id)),
    [producers, selectedIds]
  );

  return {
    tool,
    setTool,
    isDrawing,
    selectedIds,
    selectedProducers,
    layers,
    clear,
    removeLayer,
    removeProducer,
  };
}
