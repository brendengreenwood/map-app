import { useId } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

/** Convert cents (number) to a formatted "$X.XX" or "-X¢" string for inputs. */
function centsToInput(cents: number): string {
  return cents.toString();
}

function parseCents(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
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
    <div className="flex h-full w-full flex-col overflow-y-auto p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Market Setup</h2>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor={facilityId} className="text-xs font-medium text-muted-foreground">
            Facility
          </label>
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
        </div>

        <div className="space-y-1">
          <label htmlFor={commodityId} className="text-xs font-medium text-muted-foreground">
            Commodity
          </label>
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
        </div>

        <div className="space-y-1">
          <label htmlFor={contractId} className="text-xs font-medium text-muted-foreground">
            Futures contract
          </label>
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
        </div>

        <div className="space-y-1">
          <label htmlFor={lookbackId} className="text-xs font-medium text-muted-foreground">
            Bid lookback date
          </label>
          <input
            id={lookbackId}
            type="date"
            value={setup.lookbackDate}
            onChange={(e) => onSetupChange({ lookbackDate: e.target.value })}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <h3 className="mb-2 text-sm font-semibold">Pricing Spread</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor={postedId} className="text-xs font-medium text-muted-foreground">
              Posted (¢)
            </label>
            <input
              id={postedId}
              type="number"
              value={centsToInput(pricing.postedCents)}
              onChange={(e) => onPricingChange({ postedCents: parseCents(e.target.value) })}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={maxId} className="text-xs font-medium text-muted-foreground">
              Max (¢)
            </label>
            <input
              id={maxId}
              type="number"
              value={centsToInput(pricing.maxCents)}
              onChange={(e) => onPricingChange({ maxCents: parseCents(e.target.value) })}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={leewayId} className="text-xs font-medium text-muted-foreground">
              Leeway (¢)
            </label>
            <input
              id={leewayId}
              type="number"
              value={centsToInput(pricing.leewayCents)}
              onChange={(e) => onPricingChange({ leewayCents: parseCents(e.target.value) })}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={distanceId} className="text-xs font-medium text-muted-foreground">
              ¢/mile
            </label>
            <input
              id={distanceId}
              type="number"
              value={centsToInput(pricing.distanceCostCentsPerMile)}
              onChange={(e) =>
                onPricingChange({ distanceCostCentsPerMile: parseCents(e.target.value) })
              }
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onMapZones}
          disabled={!canMapZones}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Map Competitive Zones
        </button>
        {zonesMapped && (
          <button
            type="button"
            onClick={onClearZones}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
