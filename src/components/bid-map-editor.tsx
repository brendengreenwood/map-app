import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type CornContract,
  type DeliveryWindow,
  PRICING_DATA,
  getWindowPricing,
  formatBasis,
} from '@/lib/bid-data';

interface BidMapEditorProps {
  contract: CornContract;
  window: DeliveryWindow;
  onSave?: () => void;
  onCancel?: () => void;
}

export function BidMapEditor({ contract, window: dw, onSave, onCancel }: BidMapEditorProps) {
  const parentPricing = PRICING_DATA[contract.code];
  const wp = getWindowPricing(contract.code, dw.code);

  const [posted, setPosted] = useState('');
  const [max, setMax] = useState('');
  const [leeway, setLeeway] = useState('');
  const [increment, setIncrement] = useState('');

  // Reset when the active window changes
  useEffect(() => {
    setPosted(`${wp.posted}`);
    setMax(`${wp.max}`);
    setLeeway(`${wp.leeway}`);
    setIncrement(`${wp.increment}`);
  }, [dw.code, wp.posted, wp.max, wp.leeway, wp.increment]);

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="text-sm font-semibold">{dw.label}</div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <span>{dw.code}</span>
          <Badge
            variant={wp.isOverride ? 'default' : 'secondary'}
            className="h-4 px-1 text-[9px]"
          >
            {wp.isOverride ? 'override' : 'inherits'}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-5 p-4">
          {/* Parent contract reference */}
          <div className="rounded-md border border-dashed border-border p-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Parent contract · {contract.label} ({contract.code})
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Posted: </span>
                <span className="font-mono">{formatBasis(parentPricing.posted)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Max: </span>
                <span className="font-mono">{formatBasis(parentPricing.max)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Leeway: </span>
                <span className="font-mono">{parentPricing.leeway}¢</span>
              </div>
              <div>
                <span className="text-muted-foreground">Increment: </span>
                <span className="font-mono">{parentPricing.increment}¢</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Editable pricing fields */}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`posted-${dw.code}`}>Posted bid (basis)</FieldLabel>
              <Input
                id={`posted-${dw.code}`}
                value={posted}
                onChange={(e) => setPosted(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`max-${dw.code}`}>Max bid (basis)</FieldLabel>
              <Input
                id={`max-${dw.code}`}
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`leeway-${dw.code}`}>Price leeway (¢)</FieldLabel>
              <Input
                id={`leeway-${dw.code}`}
                value={leeway}
                onChange={(e) => setLeeway(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`increment-${dw.code}`}>Bid increment (¢)</FieldLabel>
              <Input
                id={`increment-${dw.code}`}
                value={increment}
                onChange={(e) => setIncrement(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <Separator />

          {/* Preview placeholder */}
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
            Preview: resulting flat price for {dw.label}
          </div>
        </div>
      </ScrollArea>

      {/* Footer actions */}
      <div className="flex shrink-0 gap-2 border-t border-border p-4">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" className="flex-1" onClick={onSave}>
          Save &amp; Publish
        </Button>
      </div>
    </div>
  );
}
