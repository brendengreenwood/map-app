import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mdiClose, mdiFilterOutline } from '@mdi/js';
import type { LastContactFilter } from '@/lib/selection-math';

interface LastContactFilterCardProps {
  filter: LastContactFilter;
  /** Producers this filter removed from the running set. */
  delta: number;
  onChange: (patch: Partial<LastContactFilter>) => void;
  onRemove: () => void;
}

export function LastContactFilterCard({
  filter,
  delta,
  onChange,
  onRemove,
}: LastContactFilterCardProps) {
  return (
    <div className="rounded-md border border-border bg-card/60 p-3">
      <div className="flex items-center gap-2 pb-2">
        <span className="grid size-7 place-items-center rounded-sm bg-muted/60">
          <Icon path={mdiFilterOutline} className="size-4 text-muted-foreground" />
        </span>
        <span className="flex-1 text-sm font-medium">Last contact</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {delta > 0 ? `-${delta.toLocaleString()}` : '—'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={onRemove}
          aria-label="Remove filter"
        >
          <Icon path={mdiClose} className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 pl-9">
        <Select
          value={filter.op}
          onValueChange={(v) =>
            onChange({ op: (v ?? 'more_than') as LastContactFilter['op'] })
          }
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="More than" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="more_than">More than</SelectItem>
            <SelectItem value="less_than">Less than</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={0}
          value={filter.days}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange({ days: Number.isFinite(n) && n >= 0 ? n : 0 });
          }}
          className="h-8 w-20 tabular-nums"
        />
        <span className="text-sm text-muted-foreground">d</span>
      </div>
    </div>
  );
}
