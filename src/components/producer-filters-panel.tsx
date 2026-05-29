import { Checkbox } from '@/components/ui/checkbox';
import type { AccountType, FilterState } from '@/lib/producer-filters';

interface ProducerFiltersPanelProps {
  filters: FilterState;
  onToggleAccountType: (t: AccountType) => void;
  onSetSpottedWindow: (days: number | null) => void;
  onSetContactedWindow: (days: number | null) => void;
  eligibleCount: number;
  totalCount: number;
}

const WINDOW_OPTIONS = [7, 14, 30, 60, 90] as const;

function WindowSelect({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="ml-1 rounded border border-input bg-background px-1 py-0.5 text-xs text-foreground disabled:opacity-50"
    >
      {WINDOW_OPTIONS.map((n) => (
        <option key={n} value={n}>
          {n} days
        </option>
      ))}
    </select>
  );
}

export function ProducerFiltersPanel({
  filters,
  onToggleAccountType,
  onSetSpottedWindow,
  onSetContactedWindow,
  eligibleCount,
  totalCount,
}: ProducerFiltersPanelProps) {
  const spottedActive = filters.excludeSpottedWithinDays != null;
  const contactedActive = filters.excludeContactedWithinDays != null;
  const spottedDays = filters.excludeSpottedWithinDays ?? 7;
  const contactedDays = filters.excludeContactedWithinDays ?? 14;

  return (
    <div className="border-b border-border bg-background">
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Producer Filters</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {eligibleCount.toLocaleString()} of {totalCount.toLocaleString()} eligible
        </p>
      </header>

      <div className="space-y-4 px-4 py-3">
        {/* Account type */}
        <section>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Account type
          </div>
          <ul className="mt-1.5 space-y-1.5">
            <li>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={filters.accountTypes.has('primary')}
                  onCheckedChange={() => onToggleAccountType('primary')}
                />
                Primary
              </label>
            </li>
            <li>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={filters.accountTypes.has('associated')}
                  onCheckedChange={() => onToggleAccountType('associated')}
                />
                Associated
              </label>
            </li>
          </ul>
        </section>

        {/* Recently spotted */}
        <section>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Recently spotted
          </div>
          <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={spottedActive}
              onCheckedChange={(c) => onSetSpottedWindow(c ? spottedDays : null)}
            />
            <span>
              Exclude spotted in last
              <WindowSelect
                value={spottedDays}
                disabled={!spottedActive}
                onChange={(n) => onSetSpottedWindow(n)}
              />
            </span>
          </label>
        </section>

        {/* Recently contacted */}
        <section>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Recently contacted
          </div>
          <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={contactedActive}
              onCheckedChange={(c) => onSetContactedWindow(c ? contactedDays : null)}
            />
            <span>
              Exclude contacted in last
              <WindowSelect
                value={contactedDays}
                disabled={!contactedActive}
                onChange={(n) => onSetContactedWindow(n)}
              />
            </span>
          </label>
        </section>
      </div>
    </div>
  );
}
