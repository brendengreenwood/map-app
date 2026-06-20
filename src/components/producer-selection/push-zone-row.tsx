import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { mdiClose, mdiCircleOutline, mdiPlusCircleOutline } from '@mdi/js';
import { cn } from '@/lib/utils';

interface PushZoneRowProps {
  label: string;
  /** Net-new producers contributed by this zone. null → render dash. */
  delta: number | null;
  /** Baseline row has no remove control. */
  variant: 'baseline' | 'drawn';
  onRemove?: () => void;
}

function formatDelta(delta: number | null, variant: 'baseline' | 'drawn'): string {
  if (delta == null) return '—';
  if (variant === 'baseline') return delta.toLocaleString();
  return `+${delta.toLocaleString()}`;
}

export function PushZoneRow({ label, delta, variant, onRemove }: PushZoneRowProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-2 py-1.5 -mx-2',
        'transition-colors hover:bg-accent/50'
      )}
    >
      <Icon
        path={variant === 'baseline' ? mdiCircleOutline : mdiPlusCircleOutline}
        className={cn(
          'size-4 shrink-0',
          variant === 'baseline' ? 'text-muted-foreground' : 'text-primary'
        )}
      />
      <span className="flex-1 truncate text-sm">{label}</span>
      <span
        className={cn(
          'text-sm tabular-nums',
          variant === 'drawn' && delta != null
            ? 'font-medium text-success-700 dark:text-success-300'
            : 'text-muted-foreground'
        )}
      >
        {formatDelta(delta, variant)}
      </span>
      {variant === 'drawn' && onRemove ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
        >
          <Icon path={mdiClose} className="size-4" />
        </Button>
      ) : (
        <span className="w-7" aria-hidden />
      )}
    </div>
  );
}
