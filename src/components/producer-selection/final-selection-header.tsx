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
    <div className="border-b border-border bg-card/30 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-primary">
            Result
          </p>
          <h2 className="mt-1 text-sm font-semibold tracking-tight text-foreground">
            Final selection
          </h2>
          <p className="mt-2 text-[34px] font-semibold leading-none tracking-tight tabular-nums">
            {formatCount(finalCount)}
          </p>
        </div>
        <dl className="grid gap-1 pt-1 text-right text-[11.5px] leading-relaxed text-muted-foreground tabular-nums">
          <div className="flex items-center justify-end gap-2">
            <dt>Selected by area</dt>
            <dd className="font-medium text-foreground">{formatCount(selectedByArea)}</dd>
          </div>
          <div className="flex items-center justify-end gap-2">
            <dt>Removed by filters</dt>
            <dd
              className={
                removedByFilters > 0
                  ? 'font-medium text-error-700 dark:text-error-300'
                  : 'font-medium text-foreground'
              }
            >
              −{removedByFilters.toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
