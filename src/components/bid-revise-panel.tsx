import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import {
  type CornContract,
  PRICING_DATA,
  DELIVERY_WINDOWS,
  getWindowPricing,
} from '@/lib/bid-data';

interface BidRevisePanelProps {
  contract: CornContract | null;
  open: boolean;
  onClose: () => void;
}

export function BidRevisePanel({ contract, open, onClose }: BidRevisePanelProps) {
  const p = contract ? PRICING_DATA[contract.code] : null;
  const windows = contract ? (DELIVERY_WINDOWS[contract.code] ?? []) : [];

  const [posted, setPosted] = useState('');
  const [max, setMax] = useState('');
  const [leeway, setLeeway] = useState('');
  const [increment, setIncrement] = useState('');
  const [checkedWindows, setCheckedWindows] = useState<Set<string>>(new Set());

  // Reset form when contract changes
  const resetForm = () => {
    if (!p) return;
    setPosted(`${p.posted}`);
    setMax(`${p.max}`);
    setLeeway(`${p.leeway}`);
    setIncrement(`${p.increment}`);
    // Default: all inheriting windows checked, overrides unchecked
    const defaults = new Set<string>();
    windows.forEach((w) => {
      const wp = getWindowPricing(contract!.code, w.code);
      if (!wp.isOverride) defaults.add(w.code);
    });
    setCheckedWindows(defaults);
  };

  const toggleWindow = (code: string) => {
    setCheckedWindows((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  if (!contract || !p) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg"
        onOpenAutoFocus={() => resetForm()}
      >
        <SheetHeader>
          <SheetTitle>Revise · {contract.label}</SheetTitle>
          <SheetDescription>
            ZC {contract.code} · applies to {windows.length} delivery window
            {windows.length !== 1 ? 's' : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-4">
          {/* Pricing fields */}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="posted">Posted bid (basis)</FieldLabel>
              <Input
                id="posted"
                value={posted}
                onChange={(e) => setPosted(e.target.value)}
                placeholder="-25"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="max">Max bid (basis)</FieldLabel>
              <Input
                id="max"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder="-15"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="leeway">Price leeway (¢)</FieldLabel>
              <Input
                id="leeway"
                value={leeway}
                onChange={(e) => setLeeway(e.target.value)}
                placeholder="3"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="increment">Bid increment (¢)</FieldLabel>
              <Input
                id="increment"
                value={increment}
                onChange={(e) => setIncrement(e.target.value)}
                placeholder="1"
              />
            </Field>
          </FieldGroup>

          <Separator />

          {/* Delivery window checkboxes */}
          {windows.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="text-sm font-semibold">
                Apply to forward delivery windows?
              </div>
              {windows.map((w) => {
                const wp = getWindowPricing(contract.code, w.code);
                const checked = checkedWindows.has(w.code);
                return (
                  <Label
                    key={w.code}
                    className="flex items-center gap-3 text-sm font-normal"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleWindow(w.code)}
                    />
                    <span className="min-w-[120px]">{w.label}</span>
                    <Badge
                      variant={wp.isOverride ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {wp.isOverride
                        ? checked
                          ? 'override → update'
                          : 'override (keep)'
                        : checked
                          ? 'inherit new values'
                          : 'keep current'}
                    </Badge>
                  </Label>
                );
              })}
            </div>
          )}

          <Separator />

          {/* Preview placeholder */}
          <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Preview: resulting flat prices
          </div>
        </div>

        <SheetFooter className="px-6 pb-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Save &amp; Publish</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
