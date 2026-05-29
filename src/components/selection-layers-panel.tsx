import { Square, Lasso, Magnet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SelectionLayer } from '@/hooks/use-map-selection';

const TOOL_ICONS = {
  rectangle: Square,
  lasso: Lasso,
  magnetic: Magnet,
} as const;

interface SelectionLayersPanelProps {
  layers: SelectionLayer[];
  onRemoveLayer: (id: string) => void;
}

export function SelectionLayersPanel({ layers, onRemoveLayer }: SelectionLayersPanelProps) {
  return (
    <div className="flex w-64 flex-col overflow-hidden rounded-lg border border-border bg-background/95 shadow-md backdrop-blur-sm">
      <header className="border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold">Selection Layers</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {layers.length === 0
            ? 'No layers yet'
            : `${layers.length} layer${layers.length === 1 ? '' : 's'}`}
        </p>
      </header>
      {layers.length === 0 ? (
        <div className="px-3 py-3 text-[11px] text-muted-foreground">
          Draw a selection to add a layer here.
        </div>
      ) : (
        <ScrollArea className="max-h-[60vh]">
          <ul className="divide-y divide-border">
            {layers.map((layer) => {
              const Icon = TOOL_ICONS[layer.tool];
              return (
                <li
                  key={layer.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40"
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs">{layer.label}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(layer.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground"
                    onClick={() => onRemoveLayer(layer.id)}
                    title="Remove layer"
                    aria-label={`Remove ${layer.label}`}
                  >
                    <X className="size-3" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
