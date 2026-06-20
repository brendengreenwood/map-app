import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { mdiFilterOutline, mdiPlus, mdiMenuDown } from '@mdi/js';
import type { Filter, FilterRow, FilterType } from '@/lib/selection-math';
import { FilterCard, ADDABLE_FILTER_TYPES, createDefaultFilter } from './filter-cards';

interface FilteringSectionProps {
  filters: Filter[];
  filterRows: FilterRow[];
  finalCount: number | null;
  onAddFilter: (filter: Filter) => void;
  onUpdateFilter: (id: string, patch: Partial<Filter>) => void;
  onRemoveFilter: (id: string) => void;
}

function formatCount(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

export function FilteringSection({
  filters,
  filterRows,
  finalCount,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
}: FilteringSectionProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const deltaById = new Map<string, number>();
  for (const row of filterRows) deltaById.set(row.id, row.delta);

  const handleAdd = (type: FilterType) => {
    onAddFilter(createDefaultFilter(type));
    setMenuOpen(false);
  };

  return (
    <section className="border-t border-border px-4 py-3">
      <div className="flex items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <Icon path={mdiFilterOutline} className="size-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold tracking-wider text-foreground uppercase">
            Filtering
          </h3>
          <span className="text-xs text-muted-foreground">by attribute</span>
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatCount(finalCount)}
        </span>
      </div>

      <div className="space-y-2">
        {filters.map((filter) => (
          <FilterCard
            key={filter.id}
            filter={filter}
            delta={deltaById.get(filter.id) ?? 0}
            onChange={(patch) => onUpdateFilter(filter.id, patch)}
            onRemove={() => onRemoveFilter(filter.id)}
          />
        ))}
      </div>

      <div className="mt-3 flex justify-center">
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <Icon path={mdiPlus} className="size-4" />
                Add filter
                <Icon path={mdiMenuDown} className="size-4" />
              </Button>
            }
          />
          <PopoverContent className="w-48 p-1" align="center">
            <div className="flex flex-col">
              {ADDABLE_FILTER_TYPES.map((entry) => (
                <button
                  key={entry.type}
                  type="button"
                  className="rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => handleAdd(entry.type)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}
