import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { Originator } from '@/lib/api';
import type { FilterState } from '@/lib/producer-filters';

interface OriginatorRoutingPanelProps {
  originators: Originator[];
  filters: FilterState;
  producerCountsByOriginator: Map<string, number>;
  visibleProducerCount: number;
  onToggleOriginator: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function OriginatorRoutingPanel({
  originators,
  filters,
  producerCountsByOriginator,
  visibleProducerCount,
  onToggleOriginator,
  onSelectAll,
  onClearAll,
}: OriginatorRoutingPanelProps) {
  const selectedCount = filters.enabledOriginatorIds.size;
  const totalOriginators = originators.length;

  return (
    <div className="flex min-h-0 flex-col border-b border-border bg-background">
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Originator Routing</h3>
          <div className="flex items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-primary hover:underline"
            >
              Select all
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-primary hover:underline"
            >
              Clear all
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {selectedCount} of {totalOriginators} selected ·{' '}
          {visibleProducerCount.toLocaleString()} producers visible
        </p>
      </header>

      <ScrollArea className="max-h-64">
        <ul className="divide-y divide-border">
          {originators.map((o) => {
            const checked = filters.enabledOriginatorIds.has(o.id);
            const count = producerCountsByOriginator.get(o.id) ?? 0;
            return (
              <li key={o.id}>
                <label className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-muted/40">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggleOriginator(o.id)}
                  />
                  <span
                    className="inline-block size-2.5 shrink-0 rounded-full border border-border/60"
                    style={{ backgroundColor: o.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{o.name}</span>
                  <span className="text-xs text-muted-foreground">{count.toLocaleString()}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
