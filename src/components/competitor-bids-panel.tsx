import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@/components/ui/icon';
import { mdiCalendar, mdiLoading, mdiMapMarkerOutline } from '@mdi/js';
import { cn } from '@/lib/utils';
import { fetchCompetitorBids, type CompetitorBidRow } from '@/lib/api';

/** Extended bid with a local edit value */
export interface EditableCompetitorBid extends CompetitorBidRow {
  /** The user's edited posted value (undefined = unchanged from fetched) */
  editedPosted?: number;
}

interface CompetitorBidsPanelProps {
  /** Contract code to fetch bids for (e.g. "N26"). Null = show placeholder. */
  contractCode: string | null;
  /** Called whenever bids change (initial fetch or user edits) */
  onBidsChange?: (bids: EditableCompetitorBid[]) => void;
}

export function CompetitorBidsPanel({
  contractCode,
  onBidsChange,
}: CompetitorBidsPanelProps) {
  const [lookbackDate, setLookbackDate] = useState<Date>(() => new Date());
  const [bids, setBids] = useState<EditableCompetitorBid[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch bids when contract or date changes
  useEffect(() => {
    if (!contractCode) {
      setBids([]);
      onBidsChange?.([]);
      return;
    }
    const dateStr = format(lookbackDate, 'yyyy-MM-dd');
    let cancelled = false;
    setLoading(true);
    fetchCompetitorBids(contractCode, dateStr)
      .then((rows) => {
        if (cancelled) return;
        const editable: EditableCompetitorBid[] = rows.map((r) => ({ ...r }));
        setBids(editable);
        onBidsChange?.(editable);
      })
      .catch(() => {
        if (!cancelled) {
          setBids([]);
          onBidsChange?.([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractCode, lookbackDate]);

  const handlePostedChange = useCallback(
    (bidId: string, value: string) => {
      setBids((prev) => {
        const next = prev.map((b) => {
          if (b.id !== bidId) return b;
          const num = parseInt(value, 10);
          return {
            ...b,
            editedPosted: isNaN(num) ? undefined : num,
          };
        });
        onBidsChange?.(next);
        return next;
      });
    },
    [onBidsChange],
  );

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-2.5">
        <div className="text-sm font-semibold">Competitor Bids</div>
        <div className="text-[10px] text-muted-foreground">
          Posted basis from competing elevators
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-4">
          {/* Lookback date picker */}
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">
              Lookback
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 flex-1 justify-start bg-transparent px-2.5 text-xs font-normal',
                    !lookbackDate && 'text-muted-foreground',
                  )}
                >
                  <Icon path={mdiCalendar} className="mr-1.5 size-3.5 text-muted-foreground" />
                  {lookbackDate
                    ? format(lookbackDate, 'MMMM do, yyyy')
                    : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={lookbackDate}
                  onSelect={(d) => d && setLookbackDate(d)}
                  disabled={(d) => d > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Bid list */}
          {loading ? (
            <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
              <Icon path={mdiLoading} className="mr-2 size-3 animate-spin" />
              Loading bids...
            </div>
          ) : !contractCode ? (
            <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
              Select a contract month to view bids
            </div>
          ) : bids.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
              No competitor bids for this date
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {/* Column headers */}
              <div className="flex items-center gap-2 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="flex-1">Competitor</span>
                <span className="w-20 text-right">Posted</span>
              </div>

              {bids.map((bid) => {
                const displayValue = bid.editedPosted ?? bid.posted;
                const isEdited = bid.editedPosted !== undefined && bid.editedPosted !== bid.posted;

                return (
                  <div
                    key={bid.id}
                    className={cn(
                      'flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs',
                      isEdited ? 'bg-primary/5' : 'bg-muted/50',
                    )}
                  >
                    <div className="flex flex-1 items-center gap-1.5 min-w-0">
                      <Icon
                        path={mdiMapMarkerOutline}
                        className="size-3 shrink-0 text-muted-foreground"
                      />
                      <span className="truncate">{bid.competitor_name}</span>
                    </div>
                    <Input
                      type="number"
                      value={`${displayValue}`}
                      onChange={(e) => handlePostedChange(bid.id, e.target.value)}
                      className={cn(
                        'h-6 w-20 px-1.5 text-right font-mono text-xs',
                        isEdited && 'border-primary/40 text-primary',
                      )}
                    />
                  </div>
                );
              })}

              {bids.some((b) => b.editedPosted !== undefined && b.editedPosted !== b.posted) && (
                <div className="mt-1 text-center text-[10px] text-muted-foreground">
                  Edited values will be used for scenario modeling
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
