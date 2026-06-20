import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { mdiArchiveOutline, mdiContentSaveCheck } from '@mdi/js';

interface MapSelectionTopBarProps {
  scenarioTitle: string;
  onArchive: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}

export function MapSelectionTopBar({
  scenarioTitle,
  onArchive,
  onSave,
  saveDisabled,
}: MapSelectionTopBarProps) {
  return (
    <header className="z-20 flex h-12 items-center justify-between gap-3 border-b border-border bg-background px-4">
      <span className="truncate text-sm font-semibold text-foreground">
        {scenarioTitle}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onArchive}
          className="gap-1.5"
        >
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
    </header>
  );
}
