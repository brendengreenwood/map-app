import { useEffect, useMemo, useRef } from 'react';
import type { ProducerGeo } from '@/lib/api';
import type { PushZone } from '@/hooks/use-map-selection';
import {
  computeSelection,
  type Filter,
  type SelectionResult,
  type ZoneInput,
} from '@/lib/selection-math';
import { FinalSelectionHeader } from './final-selection-header';
import { PushZoneSection } from './push-zone-section';
import { FilteringSection } from './filtering-section';

interface ProducerSelectionPanelProps {
  producers: ProducerGeo[];
  pushZones: PushZone[];
  filters: Filter[];
  isDrawing: boolean;
  onDrawPushZone: () => void;
  onRemovePushZone: (id: string) => void;
  onAddFilter: (filter: Filter) => void;
  onUpdateFilter: (id: string, patch: Partial<Filter>) => void;
  onRemoveFilter: (id: string) => void;
  /** Surface the computed final id set to the parent (drives map highlighting). */
  onSelectionChange?: (finalIds: Set<string>) => void;
}

export function ProducerSelectionPanel({
  producers,
  pushZones,
  filters,
  isDrawing,
  onDrawPushZone,
  onRemovePushZone,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onSelectionChange,
}: ProducerSelectionPanelProps) {
  // Build the zone list: baseline placeholder first, then user-drawn zones.
  const zones: ZoneInput[] = useMemo(() => {
    const baseline: ZoneInput = {
      id: 'baseline',
      label: 'All in zone',
      producerIds: null, // unknown until contour system exists
    };
    return [
      baseline,
      ...pushZones.map((z) => ({
        id: z.id,
        label: z.label,
        producerIds: new Set(z.producerIds),
      })),
    ];
  }, [pushZones]);

  const result: SelectionResult = useMemo(
    () => computeSelection(zones, filters, producers, new Date()),
    [zones, filters, producers]
  );

  // Forward the final id set to the parent for map highlighting.
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  useEffect(() => {
    onSelectionChangeRef.current?.(result.finalIds);
  }, [result.finalIds]);

  return (
    <div className="flex flex-col">
      <FinalSelectionHeader
        finalCount={result.finalCount}
        selectedByArea={result.selectedByArea}
        removedByFilters={result.removedByFilters}
      />
      <PushZoneSection
        zoneRows={result.zoneRows}
        selectedByArea={result.selectedByArea}
        removedByFilters={result.removedByFilters}
        isDrawing={isDrawing}
        onDrawPushZone={onDrawPushZone}
        onRemovePushZone={onRemovePushZone}
      />
      <FilteringSection
        filters={filters}
        filterRows={result.filterRows}
        finalCount={result.finalCount}
        onAddFilter={onAddFilter}
        onUpdateFilter={onUpdateFilter}
        onRemoveFilter={onRemoveFilter}
      />
    </div>
  );
}
