import { Square, Lasso, Magnet, MousePointer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SelectionTool } from '@/hooks/use-map-selection';

interface MapSelectionToolbarProps {
  tool: SelectionTool;
  onToolChange: (tool: SelectionTool) => void;
  onClear: () => void;
  selectedCount: number;
}

const TOOLS: { id: SelectionTool; label: string; icon: typeof Square; description: string }[] = [
  { id: 'none', label: 'Pan', icon: MousePointer, description: 'Pan and zoom the map' },
  { id: 'rectangle', label: 'Rectangle', icon: Square, description: 'Drag a rectangle' },
  { id: 'lasso', label: 'Lasso', icon: Lasso, description: 'Draw a freeform shape' },
  { id: 'magnetic', label: 'Magnetic', icon: Magnet, description: 'Snap nodes along a line' },
];

export function MapSelectionToolbar({
  tool,
  onToolChange,
  onClear,
  selectedCount,
}: MapSelectionToolbarProps) {
  return (
    <div
      className="absolute top-4 left-4 z-10 flex flex-col items-stretch gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-md backdrop-blur-sm"
      role="toolbar"
      aria-label="Selection tools"
      aria-orientation="vertical"
    >
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const active = tool === t.id;
        return (
          <Button
            key={t.id}
            variant={active ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onToolChange(t.id)}
            title={`${t.label} — ${t.description}`}
            aria-label={t.label}
            aria-pressed={active}
            className={cn('size-9', active && 'pointer-events-auto')}
          >
            <Icon className="size-4" />
          </Button>
        );
      })}

      <div className="my-1 h-px w-full bg-border" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        disabled={selectedCount === 0}
        title="Clear all selections"
        aria-label="Clear all selections"
        className="size-9 text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>

      <div className="pt-0.5 pb-1 text-center text-[10px] font-medium tabular-nums text-muted-foreground">
        {selectedCount}
      </div>
    </div>
  );
}
