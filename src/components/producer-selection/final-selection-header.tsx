interface FinalSelectionHeaderProps {
  /** Final count. null → render a dash. */
  finalCount: number | null;
  /** Total before filters were applied. null → unknown. */
  selectedByArea: number | null;
  /** How many filters removed in total (already positive). */
  removedByFilters: number;
}

function formatCount(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

export function FinalSelectionHeader({
  finalCount,
  selectedByArea,
  removedByFilters,
}: FinalSelectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-3">
      <div>
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Final Selection
        </div>
        <div className="text-3xl font-semibold tabular-nums">{formatCount(finalCount)}</div>
      </div>
      <div className="pt-4 text-right text-xs leading-relaxed text-muted-foreground tabular-nums">
        <div>{formatCount(selectedByArea)} selected by area</div>
        <div>-{removedByFilters.toLocaleString()} removed by filters</div>
      </div>
    </div>
  );
}
