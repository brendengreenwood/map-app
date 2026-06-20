import type { ConfigureCompetitor } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { mdiArrowLeft, mdiRefresh } from '@mdi/js';

interface ConfigureCompetitorsPanelProps {
  competitors: ConfigureCompetitor[];
  overrides: Record<string, number>;
  loading: boolean;
  onBidChange: (competitorId: string, cents: number | null) => void;
  onFlyTo: (competitorId: string) => void;
  onBack?: () => void;
}

function effectivePosted(
  c: ConfigureCompetitor,
  overrides: Record<string, number>
): number | null {
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
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              className="-ml-1"
              aria-label="Back to Market Setup"
            >
              <Icon path={mdiArrowLeft} className="size-4" />
            </Button>
          )}
          <div className="min-w-0">
            <p className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-primary">
              Reference
            </p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight">
              Competitors
            </h2>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
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
                <li
                  key={c.id}
                  className="group px-5 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onFlyTo(c.id)}
                      className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground hover:underline"
                    >
                      {c.name}
                    </button>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {isEdited && (
                        <Badge variant="info" className="px-1.5 py-0 text-[10px]">
                          Edited
                        </Badge>
                      )}
                      {c.stale && !isEdited && (
                        <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
                          Stale
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {distance} mi
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Input
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
                        className="h-8 w-20 text-right text-xs"
                      />
                      <span className="text-xs text-muted-foreground">¢</span>
                      {isEdited && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onBidChange(c.id, null)}
                          aria-label="Reset to source value"
                          title="Reset to source value"
                        >
                          <Icon path={mdiRefresh} className="size-3.5" />
                        </Button>
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
