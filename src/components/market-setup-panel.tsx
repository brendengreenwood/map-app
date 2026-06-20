import { useId } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CORN_CONTRACTS } from '@/lib/bid-data';
import type { MarketSetup, PricingSpread } from '@/lib/api';

interface FacilityOption {
  id: string;
  name: string;
}

interface MarketSetupPanelProps {
  setup: MarketSetup;
  pricing: PricingSpread;
  facilities: FacilityOption[];
  onSetupChange: (patch: Partial<MarketSetup>) => void;
  onPricingChange: (patch: Partial<PricingSpread>) => void;
  onMapZones: () => void;
  canMapZones: boolean;
  zonesMapped: boolean;
  onClearZones: () => void;
}

const COMMODITIES: { value: MarketSetup['commodity']; label: string }[] = [
  { value: 'corn', label: 'Corn' },
  { value: 'soybeans', label: 'Soybeans' },
  { value: 'wheat', label: 'Wheat' },
];

function centsToInput(cents: number): string {
  return cents.toString();
}

function parseCents(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Reusable field shell matching the Kernel form-elements `Field` helper:
 * grid stack with Label on top and the control beneath, optional hint below.
 */
function Field({
  htmlFor,
  label,
  hint,
  children,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PanelSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function MarketSetupPanel({
  setup,
  pricing,
  facilities,
  onSetupChange,
  onPricingChange,
  onMapZones,
  canMapZones,
  zonesMapped,
  onClearZones,
}: MarketSetupPanelProps) {
  const facilityId = useId();
  const commodityId = useId();
  const contractId = useId();
  const lookbackId = useId();
  const postedId = useId();
  const maxId = useId();
  const leewayId = useId();
  const distanceId = useId();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <p className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-primary">
          Configure
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-tight">Market setup</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          The facility, commodity, and pricing window this scenario plays out in.
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <PanelSection title="Scope" description="Where and what you're buying.">
          <Field htmlFor={facilityId} label="Facility">
            <Select
              value={setup.facilityId}
              onValueChange={(v) => onSetupChange({ facilityId: v ?? '' })}
            >
              <SelectTrigger id={facilityId} className="w-full">
                <SelectValue placeholder="Select facility..." />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field htmlFor={commodityId} label="Commodity">
            <Select
              value={setup.commodity}
              onValueChange={(v) =>
                onSetupChange({ commodity: (v ?? 'corn') as MarketSetup['commodity'] })
              }
            >
              <SelectTrigger id={commodityId} className="w-full">
                <SelectValue placeholder="Select commodity..." />
              </SelectTrigger>
              <SelectContent>
                {COMMODITIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field htmlFor={contractId} label="Futures contract">
            <Select
              value={setup.contractCode}
              onValueChange={(v) => onSetupChange({ contractCode: v ?? '' })}
            >
              <SelectTrigger id={contractId} className="w-full">
                <SelectValue placeholder="Select contract..." />
              </SelectTrigger>
              <SelectContent>
                {CORN_CONTRACTS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            htmlFor={lookbackId}
            label="Bid lookback date"
            hint="Pulls public competitor bids posted on or before this date."
          >
            <Input
              id={lookbackId}
              type="date"
              value={setup.lookbackDate}
              onChange={(e) => onSetupChange({ lookbackDate: e.target.value })}
            />
          </Field>
        </PanelSection>

        <PanelSection
          title="Pricing spread"
          description="Posted bid plus how far you'll move to win a load."
        >
          <div className="grid grid-cols-2 gap-3">
            <Field htmlFor={postedId} label="Posted (¢)">
              <Input
                id={postedId}
                type="number"
                inputMode="numeric"
                value={centsToInput(pricing.postedCents)}
                onChange={(e) => onPricingChange({ postedCents: parseCents(e.target.value) })}
              />
            </Field>
            <Field htmlFor={maxId} label="Max (¢)">
              <Input
                id={maxId}
                type="number"
                inputMode="numeric"
                value={centsToInput(pricing.maxCents)}
                onChange={(e) => onPricingChange({ maxCents: parseCents(e.target.value) })}
              />
            </Field>
            <Field htmlFor={leewayId} label="Leeway (¢)">
              <Input
                id={leewayId}
                type="number"
                inputMode="numeric"
                value={centsToInput(pricing.leewayCents)}
                onChange={(e) => onPricingChange({ leewayCents: parseCents(e.target.value) })}
              />
            </Field>
            <Field htmlFor={distanceId} label="¢ / mile">
              <Input
                id={distanceId}
                type="number"
                inputMode="numeric"
                value={centsToInput(pricing.distanceCostCentsPerMile)}
                onChange={(e) =>
                  onPricingChange({
                    distanceCostCentsPerMile: parseCents(e.target.value),
                  })
                }
              />
            </Field>
          </div>
        </PanelSection>
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-card/30 px-5 py-3">
        <Button
          type="button"
          variant="default"
          className="flex-1"
          onClick={onMapZones}
          disabled={!canMapZones}
        >
          Map competitive zones
        </Button>
        {zonesMapped && (
          <Button type="button" variant="outline" onClick={onClearZones}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
