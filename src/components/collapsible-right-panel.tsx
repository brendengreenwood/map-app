import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/icon';
import { mdiMenuLeft, mdiMenuRight } from '@mdi/js';
import { cn } from '@/lib/utils';

interface CollapsibleRightPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width?: number;
  children: ReactNode;
  controls?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function CollapsibleRightPanel({
  open,
  onOpenChange,
  width = 384,
  children,
  controls,
  className,
  ariaLabel = 'Side panel',
}: CollapsibleRightPanelProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute right-0 top-0 bottom-0 z-10 hidden transition-transform duration-300 ease-out md:block'
      )}
      style={{
        width: width + 'px',
        transform: open ? 'translateX(0)' : 'translateX(' + width + 'px)',
      }}
      aria-hidden={!open}
    >
      {controls && (
        <div className='pointer-events-auto absolute -left-12 top-1/2 z-10 flex -translate-y-[calc(50%+2rem)] flex-col gap-1'>
          {controls}
        </div>
      )}

      <button
        type='button'
        onClick={() => onOpenChange(!open)}
        aria-label={open ? 'Collapse ' + ariaLabel : 'Expand ' + ariaLabel}
        aria-expanded={open}
        className={cn(
          'pointer-events-auto absolute top-1/2 -left-5 z-10 flex h-12 w-5 -translate-y-1/2 cursor-pointer items-center justify-center',
          'rounded-l-md border border-r-0 border-border bg-card text-muted-foreground shadow-sm',
          'transition-colors hover:bg-accent hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
        )}
      >
        <Icon path={open ? mdiMenuRight : mdiMenuLeft} className='size-3.5' />
      </button>

      <aside
        className={cn(
          'pointer-events-auto flex h-full w-full flex-col overflow-hidden border-l border-border bg-background shadow-sm',
          className
        )}
      >
        {children}
      </aside>
    </div>
  );
}
