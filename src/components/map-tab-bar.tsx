import { type ReactNode, type ComponentType, type SVGProps } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Tab                                                                */
/* ------------------------------------------------------------------ */

export interface MapTab {
  id: string;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  closable?: boolean;
}

/* ------------------------------------------------------------------ */
/*  MapTabBar                                                          */
/* ------------------------------------------------------------------ */

interface MapTabBarProps {
  tabs: MapTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onTabClose?: (id: string) => void;

  /** Element rendered at the far-left of the bar (e.g. back button). */
  leadingAction?: ReactNode;
  /** Title block between leading action and tabs (e.g. contract name). */
  title?: ReactNode;
  /** Element rendered inline after the last tab (e.g. "+" add button). */
  inlineAction?: ReactNode;
  /** Element rendered at the far-right of the bar (e.g. publish button). */
  trailingAction?: ReactNode;
}

export function MapTabBar({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  leadingAction,
  title,
  inlineAction,
  trailingAction,
}: MapTabBarProps) {
  return (
    <div className="flex h-10 items-stretch gap-0 border-b border-border bg-card">
      {/* Leading action slot */}
      {leadingAction && (
        <div className="flex shrink-0 items-center border-r border-border px-1">
          {leadingAction}
        </div>
      )}

      {/* Title slot */}
      {title && (
        <div className="flex shrink-0 items-center border-r border-border px-3">
          {title}
        </div>
      )}

      {/* Tab strip */}
      <div className="flex min-w-0 flex-1 items-end gap-0 overflow-x-auto pl-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'group relative flex shrink-0 items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-2 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'z-10 border-border bg-background text-foreground -mb-px'
                  : 'border-border/50 bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {Icon && <Icon className="size-3.5 shrink-0" />}
              <span className="truncate">{tab.label}</span>
              {tab.closable !== false && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose?.(tab.id);
                  }}
                  className={cn(
                    'ml-0.5 flex size-4 items-center justify-center rounded-sm transition-colors',
                    'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100',
                  )}
                >
                  <X className="size-3" />
                </span>
              )}
            </button>
          );
        })}

        {/* Inline action (e.g. + button, right after last tab) */}
        {inlineAction && (
          <div className="flex shrink-0 items-center px-1 self-center">
            {inlineAction}
          </div>
        )}
      </div>

      {/* Trailing action slot */}
      {trailingAction && (
        <div className="flex shrink-0 items-center border-l border-border px-1">
          {trailingAction}
        </div>
      )}
    </div>
  );
}
