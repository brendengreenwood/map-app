import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  type CornContract,
  PRICING_DATA,
  DELIVERY_WINDOWS,
  getWindowPricing,
  formatBasis,
  formatFreight,
} from '@/lib/bid-data';
import { ChevronDown, Eye, Pencil } from 'lucide-react';

// ── Main contract row + expandable windows ────────────────

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
    <>
      {/* Contract header row */}
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <TableCell className="w-8 pl-3 pr-0">
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </TableCell>
        <TableCell className="font-semibold">
          <div>{contract.label}</div>
          <div className="font-mono text-[10px] font-normal text-muted-foreground">
            ZC · {contract.code}
          </div>
        </TableCell>
        <TableCell className="font-mono tabular-nums font-semibold">
          {formatBasis(p.posted)}
        </TableCell>
        <TableCell className="font-mono tabular-nums">
          {formatBasis(p.max)}
        </TableCell>
        <TableCell className="font-mono tabular-nums">{p.leeway}¢</TableCell>
        <TableCell className="font-mono tabular-nums">{p.increment}¢</TableCell>
        <TableCell className="font-mono tabular-nums">
          {formatFreight(p.freight)}
        </TableCell>
        <TableCell className="text-right text-xs text-muted-foreground">
          <div>{p.updated}</div>
          <div>{p.by}</div>
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm">
              <Eye data-icon="inline-start" />
              View
            </Button>
            <Button size="sm" onClick={onRevise}>
              <Pencil data-icon="inline-start" />
              Revise
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded delivery windows */}
      {expanded &&
        windows.map((w) => {
          const wp = getWindowPricing(contract.code, w.code);
          return (
            <TableRow
              key={w.code}
              className="bg-muted/30 hover:bg-muted/50"
            >
              <TableCell className="pl-3 pr-0" />
              <TableCell className="pl-8">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{w.label}</span>
                  {wp.isOverride ? (
                    <Badge variant="default" className="h-4 px-1 text-[9px]">
                      override
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      inherits
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {w.code}
                </div>
              </TableCell>
              <TableCell
                className={cn(
                  'font-mono tabular-nums',
                  wp.isOverride && 'font-semibold',
                )}
              >
                {formatBasis(wp.posted)}
              </TableCell>
              <TableCell className="font-mono tabular-nums">
                {formatBasis(wp.max)}
              </TableCell>
              <TableCell className="font-mono tabular-nums">
                {wp.leeway}¢
              </TableCell>
              <TableCell className="font-mono tabular-nums">
                {wp.increment}¢
              </TableCell>
              <TableCell className="font-mono tabular-nums">
                {formatFreight(wp.freight)}
              </TableCell>
              <TableCell />
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye data-icon="inline-start" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReviseWindow?.(w.code)}
                  >
                    <Pencil data-icon="inline-start" />
                    Revise
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
    </>
  );
}
