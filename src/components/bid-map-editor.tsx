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
  DELIVERY_WINDOWS,
  getWindowPricing,
  formatBasis,
} from '@/lib/bid-data';

interface BidMapEditorProps {
  contract: CornContract;
  /** When undefined, editing the parent contract pricing. */
  window?: DeliveryWindow;
  onSave?: () => void;
  onCancel?: () => void;
}

export function BidMapEditor({ contract, window: dw, onSave, onCancel }: BidMapEditorProps) {
  const parentPricing = PRICING_DATA[contract.code];
  const isContractLevel = !dw;
  const wp = dw ? getWindowPricing(contract.code, dw.code) : null;
  const windows = DELIVERY_WINDOWS[contract.code] ?? [];

  // Use window pricing when on a window tab, contract pricing on the parent tab
  const activePricing = wp ?? parentPricing;
  const editKey = dw?.code ?? contract.code;

  const [posted, setPosted] = useState('');
  const [max, setMax] = useState('');
  const [leeway, setLeeway] = useState('');
  const [increment, setIncrement] = useState('');

  // Reset when the active tab changes
  useEffect(() => {
    setPosted(`${activePricing.posted}`);
    setMax(`${activePricing.max}`);
    setLeeway(`${activePricing.leeway}`);
    setIncrement(`${activePricing.increment}`);
  }, [editKey, activePricing.posted, activePricing.max, activePricing.leeway, activePricing.increment]);

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        {isContractLevel ? (
          <>
            <div className="text-sm font-semibold">{contract.label}</div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span>ZC {contract.code}</span>
              <Badge variant="default" className="h-4 px-1 text-[9px]">
                contract
              </Badge>
              <span>· {windows.length} window{windows.length !== 1 ? 's' : ''}</span>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold">{dw.label}</div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span>{dw.code}</span>
              <Badge
                variant={wp!.isOverride ? 'default' : 'secondary'}
                className="h-4 px-1 text-[9px]"
              >
                {wp!.isOverride ? 'override' : 'inherits'}
              </Badge>
            </div>
          </>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-5 p-4">
          {/* Context: parent pricing shown when on a delivery window tab */}
          {!isContractLevel && (
            <>
              <div className="rounded-md border border-dashed border-border p-3">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Parent · {contract.label} (ZC {contract.code})
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
            </>
          )}

          {/* Context: window summary shown when on the contract tab */}
          {isContractLevel && windows.length > 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Delivery windows
                </div>
                {windows.map((w) => {
                  const wPricing = getWindowPricing(contract.code, w.code);
                  return (
                    <div
                      key={w.code}
                      className="flex items-center justify-between rounded-sm bg-muted/50 px-2 py-1 text-xs"
                    >
                      <span>{w.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">
                          {formatBasis(wPricing.posted)}
                        </span>
                        <Badge
                          variant={wPricing.isOverride ? 'default' : 'secondary'}
                          className="h-4 px-1 text-[9px]"
                        >
                          {wPricing.isOverride ? 'override' : 'inherits'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Separator />
            </>
          )}

          {/* Editable pricing fields */}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`posted-${editKey}`}>Posted bid (basis)</FieldLabel>
              <Input
                id={`posted-${editKey}`}
                value={posted}
                onChange={(e) => setPosted(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`max-${editKey}`}>Max bid (basis)</FieldLabel>
              <Input
                id={`max-${editKey}`}
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`leeway-${editKey}`}>Price leeway (¢)</FieldLabel>
              <Input
                id={`leeway-${editKey}`}
                value={leeway}
                onChange={(e) => setLeeway(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`increment-${editKey}`}>Bid increment (¢)</FieldLabel>
              <Input
                id={`increment-${editKey}`}
                value={increment}
                onChange={(e) => setIncrement(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <Separator />

          {/* Preview placeholder */}
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
            {isContractLevel
              ? `Changes propagate to ${windows.filter((w) => !getWindowPricing(contract.code, w.code).isOverride).length} inheriting window${windows.filter((w) => !getWindowPricing(contract.code, w.code).isOverride).length !== 1 ? 's' : ''}`
              : `Preview: resulting flat price for ${dw.label}`}
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
