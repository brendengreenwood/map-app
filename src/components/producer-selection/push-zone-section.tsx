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
    <section className="border-b border-border px-5 py-4">
      <header className="flex items-center justify-between gap-2 pb-3">
        <div className="flex items-baseline gap-2">
          <Icon path={mdiVectorPolygon} className="size-3.5 text-muted-foreground" />
          <h3 className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-foreground">
            Select push zone
          </h3>
          <span className="text-[11px] text-muted-foreground">draw to add producers</span>
        </div>
        <span className="text-[13px] font-medium tabular-nums text-muted-foreground">
          {formatCount(selectedByArea)}
        </span>
      </header>

      <div className="pb-3">
        <Button
          variant={isDrawing ? 'default' : 'outline'}
          size="sm"
          className={cn('w-full justify-start gap-2', isDrawing && 'ring-2 ring-primary/30')}
          onClick={onDrawPushZone}
        >
          <Icon path={mdiVectorPolygon} className="size-4" />
          <span>Draw push zone</span>
          <span className="ml-auto text-[11px] font-normal opacity-70">
            adds to selection
          </span>
        </Button>
      </div>

      <div className="space-y-0.5">
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
      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3 text-[11.5px] text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">{formatCount(selectedByArea)}</span>
        <Icon path={mdiArrowDown} className="size-3" />
        <span>then narrow by attribute</span>
        <span
          className={cn(
            'ml-auto tabular-nums',
            removedByFilters > 0 && 'font-medium text-error-700 dark:text-error-300'
          )}
        >
          {removedByFilters > 0 ? `−${removedByFilters.toLocaleString()}` : '—'}
        </span>
      </div>
    </section>
  );
}
