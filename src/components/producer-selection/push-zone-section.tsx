import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { mdiArrowDown, mdiVectorPolygon } from '@mdi/js';
import { cn } from '@/lib/utils';
import { PushZoneRow } from './push-zone-row';
import type { ZoneRow } from '@/lib/selection-math';

interface PushZoneSectionProps {
  zoneRows: ZoneRow[];
  /** Running area total displayed on the section header and footer. */
  selectedByArea: number | null;
  removedByFilters: number;
  isDrawing: boolean;
  onDrawPushZone: () => void;
  onRemovePushZone: (id: string) => void;
}

function formatCount(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

export function PushZoneSection({
  zoneRows,
  selectedByArea,
  removedByFilters,
  isDrawing,
  onDrawPushZone,
  onRemovePushZone,
}: PushZoneSectionProps) {
  // First row is the baseline ("All in zone").
  const baselineRow = zoneRows[0];
  const drawnRows = zoneRows.slice(1);

  return (
    <section className="border-t border-border px-4 py-3">
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <Icon path={mdiVectorPolygon} className="size-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold tracking-wider text-foreground uppercase">
            Select Push Zone
          </h3>
          <span className="text-xs text-muted-foreground">draw to add producers</span>
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatCount(selectedByArea)}
        </span>
      </div>

      <div className="pb-2">
        <Button
          variant={isDrawing ? 'default' : 'outline'}
          size="sm"
          className={cn('gap-2', isDrawing && 'ring-2 ring-primary/40')}
          onClick={onDrawPushZone}
        >
          <Icon path={mdiVectorPolygon} className="size-4" />
          Draw push zone
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            adds to selection
          </span>
        </Button>
      </div>

      <div className="divide-y divide-border/60">
        {baselineRow && (
          <PushZoneRow
            label={baselineRow.label}
            delta={baselineRow.delta}
            variant="baseline"
          />
        )}
        {drawnRows.map((row) => (
          <PushZoneRow
            key={row.id}
            label={row.label}
            delta={row.delta}
            variant="drawn"
            onRemove={() => onRemovePushZone(row.id)}
          />
        ))}
      </div>

      {/* Transition row */}
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
        <span className="tabular-nums">{formatCount(selectedByArea)}</span>
        <Icon path={mdiArrowDown} className="size-3" />
        <span>then narrow by attribute</span>
        <span className="ml-auto tabular-nums">
          {removedByFilters > 0 ? `-${removedByFilters.toLocaleString()}` : '—'}
        </span>
      </div>
    </section>
  );
}
