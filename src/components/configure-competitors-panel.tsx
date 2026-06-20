import type { ConfigureCompetitor } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConfigureCompetitorsPanelProps {
  competitors: ConfigureCompetitor[];
  overrides: Record<string, number>;
  loading: boolean;
  onBidChange: (competitorId: string, cents: number | null) => void;
  onFlyTo: (competitorId: string) => void;
  onBack?: () => void;
}

function effectivePosted(c: ConfigureCompetitor, overrides: Record<string, number>): number | null {
  if (c.id in overrides) return overrides[c.id];
  return c.posted;
}

export function ConfigureCompetitorsPanel({
  competitors,
  overrides,
  loading,
  onBidChange,
  onFlyTo,
  onBack,
}: ConfigureCompetitorsPanelProps) {
  const editedCount = Object.keys(overrides).length;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="-ml-1 inline-flex h-6 items-center rounded px-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Back to Market Setup"
            >
              ← Back
            </button>
          )}
          <h2 className="text-sm font-semibold">Competitors</h2>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {loading
            ? 'Loading…'
            : `${competitors.length} in region${editedCount ? ` · ${editedCount} edited` : ''}`}
        </p>
      </div>

      {competitors.length === 0 && !loading ? (
        <div className="flex flex-1 items-center justify-center px-6 py-8 text-center text-xs text-muted-foreground">
          No competitor bids in region — adjust lookback date or contract.
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <ul className="divide-y divide-border">
            {competitors.map((c) => {
              const posted = effectivePosted(c, overrides);
              const isEdited = c.id in overrides;
              const distance = c.distance_miles.toFixed(1);
              return (
                <li key={c.id} className="px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onFlyTo(c.id)}
                      className="flex-1 text-left text-sm font-medium hover:underline"
                    >
                      {c.name}
                    </button>
                    {c.stale && !isEdited && (
                      <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:text-yellow-300">
                        stale
                      </span>
                    )}
                    {isEdited && (
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        edited
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{distance} mi</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={posted ?? ''}
                        placeholder="—"
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') {
                            onBidChange(c.id, null);
                          } else {
                            const n = parseFloat(raw);
                            onBidChange(c.id, Number.isFinite(n) ? Math.round(n) : 0);
                          }
                        }}
                        className="w-20 rounded border border-input bg-transparent px-1.5 py-0.5 text-right text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      <span>¢</span>
                      {isEdited && (
                        <button
                          type="button"
                          onClick={() => onBidChange(c.id, null)}
                          className="ml-1 text-[10px] text-muted-foreground hover:text-foreground"
                          title="Reset to source value"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
