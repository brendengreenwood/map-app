import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { mdiArchiveOutline, mdiChevronRight, mdiContentSaveCheck } from '@mdi/js';

interface MapSelectionTopBarProps {
  scenarioTitle: string;
  subtitle?: string;
  crumbs?: string[];
  onArchive: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}

/**
 * Scenario page header — mirrors the Kernel app-shell PageHeader pattern:
 * breadcrumbs on top, title + optional subtitle, actions cluster pushed right.
 */
export function MapSelectionTopBar({
  scenarioTitle,
  subtitle,
  crumbs,
  onArchive,
  onSave,
  saveDisabled,
}: MapSelectionTopBarProps) {
  return (
    <header className="z-20 shrink-0 border-b border-border bg-background px-6 py-3">
      {crumbs && crumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {crumbs.map((c, i) => (
            <React.Fragment key={`${c}-${i}`}>
              {i > 0 && <Icon path={mdiChevronRight} className="size-3 opacity-50" />}
              <span className={i === crumbs.length - 1 ? 'font-medium text-foreground' : ''}>
                {c}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="mt-1 flex items-start gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-[18px] font-semibold leading-tight tracking-tight text-foreground">
            {scenarioTitle}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={onArchive} className="gap-1.5">
            <Icon path={mdiArchiveOutline} className="size-3.5" />
            Archive
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={saveDisabled}
            className="gap-1.5"
          >
            <Icon path={mdiContentSaveCheck} className="size-3.5" />
            Save &amp; Publish
          </Button>
        </div>
      </div>
    </header>
  );
}
