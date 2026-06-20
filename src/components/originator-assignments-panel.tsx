import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mdiAccountOutline, mdiClose, mdiMapMarkerOutline } from '@mdi/js';
import type { ProducerGeo, Originator } from '@/lib/api';

interface OriginatorAssignmentsPanelProps {
  /** Producers in the final selection (already filtered + zoned). */
  selectedProducers: ProducerGeo[];
  /** All available originators (the dropdown options). */
  originators: Originator[];
  /** Override map: producerId → originatorId. Falls back to producer.originator_id. */
  assignments: Map<string, string | null>;
  onAssignmentChange: (producerId: string, originatorId: string | null) => void;
  onRemoveProducer: (producerId: string) => void;
}

interface OriginatorRollup {
  id: string | null;
  name: string;
  color: string;
  count: number;
  acres: number;
}

const UNASSIGNED_COLOR = '#9ca3af';

function formatAcres(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export function OriginatorAssignmentsPanel({
  selectedProducers,
  originators,
  assignments,
  onAssignmentChange,
  onRemoveProducer,
}: OriginatorAssignmentsPanelProps) {
  const originatorById = useMemo(() => {
    const m = new Map<string, Originator>();
    for (const o of originators) m.set(o.id, o);
    return m;
  }, [originators]);

  const rollups = useMemo<OriginatorRollup[]>(() => {
    const totals = new Map<string | null, { count: number; acres: number }>();
    for (const p of selectedProducers) {
      const assigned = assignments.has(p.id) ? assignments.get(p.id)! : p.originator_id;
      const key = assigned ?? null;
      const acres = p.farm_size_acres ?? 0;
      const prev = totals.get(key) ?? { count: 0, acres: 0 };
      totals.set(key, { count: prev.count + 1, acres: prev.acres + acres });
    }
    const result: OriginatorRollup[] = [];
    for (const [id, { count, acres }] of totals) {
      const o = id ? originatorById.get(id) : null;
      result.push({
        id,
        name: o?.name ?? 'Unassigned',
        color: o?.color ?? UNASSIGNED_COLOR,
        count,
        acres,
      });
    }
    return result.sort((a, b) => b.count - a.count);
  }, [selectedProducers, assignments, originatorById]);

  const totalCount = selectedProducers.length;
  const totalAcres = useMemo(
    () => selectedProducers.reduce((sum, p) => sum + (p.farm_size_acres ?? 0), 0),
    [selectedProducers]
  );

  if (totalCount === 0) {
    return (
      <div className="flex flex-1 flex-col px-5 py-6">
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <Icon
            path={mdiAccountOutline}
            className="mx-auto size-6 text-muted-foreground"
          />
          <p className="mt-2 text-sm font-medium text-foreground">No producers selected</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Draw a push zone in <span className="font-medium">Producer Selection</span> to
            start assigning originators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Summary ───────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/30 px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-primary">
              Routing
            </p>
            <h2 className="mt-1 text-sm font-semibold tracking-tight text-foreground">
              Originator roll-up
            </h2>
          </div>
          <div className="text-right text-[11.5px] text-muted-foreground tabular-nums">
            <div>
              <span className="font-medium text-foreground">{totalCount}</span> producers
            </div>
            <div>
              <span className="font-medium text-foreground">{formatAcres(totalAcres)}</span> ac
            </div>
          </div>
        </div>

        <ul className="mt-3 space-y-1">
          {rollups.map((r) => (
            <li
              key={r.id ?? '__unassigned'}
              className="flex items-center gap-2.5 text-[13px]"
            >
              <span
                className="inline-block size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: r.color }}
                aria-hidden
              />
              <span className="flex-1 truncate text-foreground">{r.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {r.count} <span className="opacity-60">·</span> {formatAcres(r.acres)} ac
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── List ─────────────────────────────────────────────── */}
      <section className="px-5 py-4">
        <header className="flex items-baseline gap-2 pb-3">
          <Icon path={mdiAccountOutline} className="size-3.5 text-muted-foreground" />
          <h3 className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-foreground">
            Selected producers
          </h3>
          <span className="text-[11px] text-muted-foreground">reassign as needed</span>
        </header>

        <ul className="divide-y divide-border/60">
          {selectedProducers.map((p) => {
            const assignedId = assignments.has(p.id)
              ? assignments.get(p.id)
              : p.originator_id;
            const color = assignedId
              ? originatorById.get(assignedId)?.color ?? UNASSIGNED_COLOR
              : UNASSIGNED_COLOR;
            return (
              <li key={p.id} className="group flex items-center gap-2.5 py-2.5">
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {p.name}
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-[11.5px] text-muted-foreground">
                    <Icon path={mdiMapMarkerOutline} className="size-3 shrink-0" />
                    <span className="truncate">
                      {p.county ?? '—'}
                      {p.farm_size_acres != null && (
                        <>
                          {' '}
                          <span className="opacity-60">·</span>{' '}
                          <span className="tabular-nums">
                            {p.farm_size_acres.toLocaleString()} ac
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <Select
                  value={assignedId ?? '__unassigned'}
                  onValueChange={(v) =>
                    onAssignmentChange(
                      p.id,
                      v === '__unassigned' || v == null ? null : v
                    )
                  }
                >
                  <SelectTrigger size="sm" className="w-36 shrink-0">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned">Unassigned</SelectItem>
                    {originators.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onRemoveProducer(p.id)}
                  aria-label={`Remove ${p.name}`}
                >
                  <Icon path={mdiClose} className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
