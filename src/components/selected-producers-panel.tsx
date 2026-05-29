import { useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Originator, ProducerGeo } from '@/lib/api';
import { UNASSIGNED_COLOR } from '@/lib/originator-colors';

interface SelectedProducersPanelProps {
  producers: ProducerGeo[];
  onRemove: (id: string) => void;
  originators?: Originator[];
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-full border border-border/60"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export function SelectedProducersPanel({
  producers,
  onRemove,
  originators = [],
}: SelectedProducersPanelProps) {
  const colorById = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of originators) m.set(o.id, o.color);
    return m;
  }, [originators]);

  const totals = useMemo(() => {
    let acres = 0;
    const byCommodity = new Map<string, number>();
    const byOriginator = new Map<string, { name: string; color: string; count: number }>();
    for (const p of producers) {
      acres += p.farm_size_acres ?? 0;
      const key = p.commodity ?? 'Unknown';
      byCommodity.set(key, (byCommodity.get(key) ?? 0) + 1);

      const oid = p.originator_id ?? '__unassigned__';
      const oname = p.originator_name ?? 'Unassigned';
      const color = p.originator_id ? colorById.get(p.originator_id) ?? UNASSIGNED_COLOR : UNASSIGNED_COLOR;
      const prev = byOriginator.get(oid);
      if (prev) prev.count += 1;
      else byOriginator.set(oid, { name: oname, color, count: 1 });
    }
    const originatorRollup = [...byOriginator.values()].sort((a, b) => b.count - a.count);
    return { acres, byCommodity, originatorRollup };
  }, [producers, colorById]);

  return (
    <div className="flex h-full flex-col border-l border-border bg-background">
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Selected Producers</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {producers.length} producer{producers.length === 1 ? '' : 's'} ·{' '}
          {totals.acres.toLocaleString()} acres
        </p>

        {totals.originatorRollup.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              By originator
            </div>
            <ul className="flex flex-wrap gap-x-2 gap-y-1">
              {totals.originatorRollup.map((row) => (
                <li
                  key={row.name}
                  className="flex items-center gap-1.5 text-[11px] text-foreground"
                >
                  <Swatch color={row.color} />
                  <span className="truncate">{row.name}</span>
                  <span className="text-muted-foreground">({row.count})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {totals.byCommodity.size > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {[...totals.byCommodity.entries()].map(([k, n]) => (
              <span
                key={k}
                className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {k}: {n}
              </span>
            ))}
          </div>
        )}
      </header>

      <ScrollArea className="flex-1">
        {producers.length === 0 ? (
          <div className="px-4 py-6 text-xs text-muted-foreground">
            Use the toolbar to draw a selection.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {producers.map((p) => {
              const color = p.originator_id
                ? colorById.get(p.originator_id) ?? UNASSIGNED_COLOR
                : UNASSIGNED_COLOR;
              return (
                <li
                  key={p.id}
                  className="flex items-start gap-2 px-4 py-2.5 hover:bg-muted/40"
                >
                  <Swatch color={color} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.county ?? '—'} · {(p.farm_size_acres ?? 0).toLocaleString()} ac ·{' '}
                      {p.commodity ?? 'Unknown'} · {p.originator_name ?? 'Unassigned'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={() => onRemove(p.id)}
                    title="Remove from selection"
                  >
                    <X className="size-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
