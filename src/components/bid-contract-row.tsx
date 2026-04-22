import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  type CornContract,
  type DeliveryWindow,
  type WindowPricing,
  PRICING_DATA,
  DELIVERY_WINDOWS,
  getWindowPricing,
  formatBasis,
} from '@/lib/bid-data';
import { ChevronDown, Eye, Pencil } from 'lucide-react';

// ── Pricing field ──────────────────────────────────────────

function PricingField({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-[60px]">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'font-mono text-sm tabular-nums',
          emphasis ? 'font-semibold text-foreground' : 'text-foreground',
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ── Delivery window row ────────────────────────────────────

function WindowRow({
  window: w,
  pricing,
  onRevise,
}: {
  window: DeliveryWindow;
  pricing: WindowPricing;
  onRevise?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-sm border-l-2 bg-muted/50 px-3 py-2',
        pricing.isOverride ? 'border-l-primary' : 'border-l-muted-foreground/30',
      )}
    >
      <div className="min-w-[140px]">
        <div className="text-sm font-medium">{w.label}</div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          {w.code}
          {pricing.isOverride ? (
            <Badge variant="default" className="h-4 px-1 text-[9px]">
              override
            </Badge>
          ) : (
            <span>· inherits</span>
          )}
        </div>
      </div>
      <PricingField label="posted" value={formatBasis(pricing.posted)} />
      <PricingField label="max" value={formatBasis(pricing.max)} />
      <PricingField label="leeway" value={`${pricing.leeway}¢`} />
      <PricingField label="increment" value={`${pricing.increment}¢`} />
      <div className="flex-1" />
      <div className="flex gap-1">
        <Button variant="ghost" size="sm">
          <Eye data-icon="inline-start" />
          View
        </Button>
        <Button variant="ghost" size="sm" onClick={onRevise}>
          <Pencil data-icon="inline-start" />
          Revise
        </Button>
      </div>
    </div>
  );
}

// ── Main contract row ──────────────────────────────────────

interface BidContractRowProps {
  contract: CornContract;
  expanded: boolean;
  onToggle: () => void;
  onRevise: () => void;
  onReviseWindow?: (windowCode: string) => void;
}

export function BidContractRow({
  contract,
  expanded,
  onToggle,
  onRevise,
  onReviseWindow,
}: BidContractRowProps) {
  const p = PRICING_DATA[contract.code];
  const windows = DELIVERY_WINDOWS[contract.code] ?? [];

  return (
    <div
      className={cn(
        'rounded-md border transition-colors',
        expanded ? 'border-border bg-card' : 'border-border/60 bg-card/60',
      )}
    >
      {/* Contract header row */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
      >
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
        />

        <div className="min-w-[120px]">
          <div className="text-base font-semibold">{contract.label}</div>
          <div className="font-mono text-[10px] text-muted-foreground">
            ZC · {contract.code}
          </div>
        </div>

        <PricingField label="posted bid" value={formatBasis(p.posted)} emphasis />
        <PricingField label="max bid" value={formatBasis(p.max)} />
        <PricingField label="leeway" value={`${p.leeway}¢`} />
        <PricingField label="increment" value={`${p.increment}¢`} />

        <div className="flex-1" />

        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">updated {p.updated}</div>
          <div className="text-xs text-foreground">by {p.by}</div>
        </div>

        <div
          className="flex gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="outline" size="sm">
            <Eye data-icon="inline-start" />
            View
          </Button>
          <Button size="sm" onClick={onRevise}>
            <Pencil data-icon="inline-start" />
            Revise
          </Button>
        </div>
      </button>

      {/* Expanded delivery windows */}
      {expanded && windows.length > 0 && (
        <div className="border-t border-dashed border-border px-4 pb-4 pl-12 pt-3">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            Forward delivery → maps to {contract.code}
          </div>
          <div className="flex flex-col gap-1.5">
            {windows.map((w) => (
              <WindowRow
                key={w.code}
                window={w}
                pricing={getWindowPricing(contract.code, w.code)}
                onRevise={() => onReviseWindow?.(w.code)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
