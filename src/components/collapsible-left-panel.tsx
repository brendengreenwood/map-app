import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/icon';
import { mdiMenuLeft, mdiMenuRight } from '@mdi/js';
import { cn } from '@/lib/utils';

interface CollapsibleLeftPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width?: number;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function CollapsibleLeftPanel({
  open,
  onOpenChange,
  width = 384,
  children,
  className,
  ariaLabel = 'Side panel',
}: CollapsibleLeftPanelProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute left-0 top-0 bottom-0 z-10 hidden transition-transform duration-300 ease-out md:block'
      )}
      style={{
        width: width + 'px',
        transform: open ? 'translateX(0)' : 'translateX(-' + width + 'px)',
      }}
      aria-hidden={!open}
    >
      {/* Handle — protrudes rightward from the panel's outer edge */}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={open ? 'Collapse ' + ariaLabel : 'Expand ' + ariaLabel}
        aria-expanded={open}
        className={cn(
          'pointer-events-auto absolute top-1/2 -right-6 z-10 flex h-14 w-6 -translate-y-1/2 cursor-pointer items-center justify-center',
          'rounded-r-md border border-l-0 border-border bg-background text-muted-foreground shadow-md',
          'transition-colors hover:bg-accent hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
        )}
      >
        <Icon path={open ? mdiMenuLeft : mdiMenuRight} className="size-4" />
      </button>

      {/* Panel body */}
      <aside
        className={cn(
          'pointer-events-auto flex h-full w-full flex-col overflow-hidden border-r border-border bg-background',
          className
        )}
      >
        {children}
      </aside>
    </div>
  );
}
