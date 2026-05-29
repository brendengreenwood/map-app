import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mdiArrowLeft, mdiContentSaveCheck } from '@mdi/js';

export type MapSelectionTab = 'configure' | 'select';

interface MapSelectionTopBarProps {
  scenarioTitle: string;
  activeTab: MapSelectionTab;
  onTabChange: (tab: MapSelectionTab) => void;
  onBack: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}

export function MapSelectionTopBar({
  scenarioTitle,
  activeTab,
  onTabChange,
  onBack,
  onSave,
  saveDisabled,
}: MapSelectionTopBarProps) {
  return (
    <header className="z-20 flex flex-col border-b border-border bg-background">
      {/* Row 1: Back + title + Save & Publish */}
      <div className="flex h-12 items-center justify-between gap-3 border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5"
            aria-label="Back"
          >
            <Icon path={mdiArrowLeft} className="size-3.5" />
            Back
          </Button>
          <span className="truncate text-sm font-semibold text-foreground">
            {scenarioTitle}
          </span>
        </div>
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

      {/* Row 2: tab nav */}
      <div className="px-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (value === 'configure' || value === 'select') {
              onTabChange(value);
            }
          }}
        >
          <TabsList variant="line">
            <TabsTrigger value="configure" className="after:bottom-0 after:bg-primary">
              Configure Market
            </TabsTrigger>
            <TabsTrigger value="select" className="after:bottom-0 after:bg-primary">
              Select Producers
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}
