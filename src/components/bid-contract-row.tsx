import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatBasis, formatFreight } from '@/lib/bid-data';
import type { ScenarioRow, ScenarioWindowRow } from '@/lib/api';
import { Icon } from '@/components/ui/icon';
import { mdiChevronDown, mdiEyeOutline, mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';

interface BidContractRowProps {
  scenario: ScenarioRow;
  expanded: boolean;
  onToggle: () => void;
  onRevise: () => void;
  onDelete: () => void;
  onReviseWindow?: (windowCode: string) => void;
}

function getWindowPricing(scenario: ScenarioRow, window: ScenarioWindowRow) {
  const isOverride = window.is_override === 1;
  return {
    posted: window.posted ?? scenario.posted,
    max: window.max ?? scenario.max,
    leeway: window.leeway ?? scenario.leeway,
    increment: window.increment ?? scenario.increment,
    freight: window.freight ?? scenario.freight,
    isOverride,
  };
}

export function BidContractRow({
  scenario,
  expanded,
  onToggle,
  onRevise,
  onDelete,
  onReviseWindow,
}: BidContractRowProps) {
  const windows = scenario.windows ?? [];

  return (
    <>
      {/* Contract header row */}
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <TableCell className="w-8 pl-3 pr-0">
          <Icon
            path={mdiChevronDown}
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </TableCell>
        <TableCell className="font-semibold">
          <div>{scenario.contract_label}</div>
          <div className="text-[10px] font-normal text-muted-foreground">
            ZC · {scenario.contract_code}
          </div>
        </TableCell>
        <TableCell className="tabular-nums font-semibold">
          {formatBasis(scenario.posted)}
        </TableCell>
        <TableCell className="tabular-nums">
          {formatBasis(scenario.max)}
        </TableCell>
        <TableCell className="tabular-nums">{scenario.leeway}¢</TableCell>
        <TableCell className="tabular-nums">{scenario.increment}¢</TableCell>
        <TableCell className="tabular-nums">
          {formatFreight(scenario.freight)}
        </TableCell>
        <TableCell className="text-right text-xs text-muted-foreground">
          <div>{new Date(scenario.created_at).toLocaleDateString()}</div>
          {scenario.updated_by && <div>{scenario.updated_by}</div>}
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm">
              <Icon path={mdiEyeOutline} data-icon="inline-start" />
              View
            </Button>
            <Button size="sm" onClick={onRevise}>
              <Icon path={mdiPencilOutline} data-icon="inline-start" />
              Revise
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Icon path={mdiTrashCanOutline} className="size-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded delivery windows */}
      {expanded &&
        windows.map((w) => {
          const wp = getWindowPricing(scenario, w);
          return (
            <TableRow
              key={w.window_code}
              className="bg-muted/30 hover:bg-muted/50"
            >
              <TableCell className="pl-3 pr-0" />
              <TableCell className="pl-8">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{w.window_label}</span>
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
                <div className="text-[10px] text-muted-foreground">
                  {w.window_code}
                </div>
              </TableCell>
              <TableCell
                className={cn(
                  'tabular-nums',
                  wp.isOverride && 'font-semibold',
                )}
              >
                {formatBasis(wp.posted)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatBasis(wp.max)}
              </TableCell>
              <TableCell className="tabular-nums">
                {wp.leeway}¢
              </TableCell>
              <TableCell className="tabular-nums">
                {wp.increment}¢
              </TableCell>
              <TableCell className="tabular-nums">
                {formatFreight(wp.freight)}
              </TableCell>
              <TableCell />
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm">
                    <Icon path={mdiEyeOutline} data-icon="inline-start" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReviseWindow?.(w.window_code)}
                  >
                    <Icon path={mdiPencilOutline} data-icon="inline-start" />
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
