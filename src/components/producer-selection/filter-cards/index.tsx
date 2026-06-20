import type { Filter, FilterType } from '@/lib/selection-math';
import { LastContactFilterCard } from './last-contact-filter';

interface FilterCardProps {
  filter: Filter;
  delta: number;
  onChange: (patch: Partial<Filter>) => void;
  onRemove: () => void;
}

/**
 * Registry mapping a filter type to its card component. Adding a new filter
 * type is a one-file change: add a card, register here, extend the math.
 */
export function FilterCard({ filter, delta, onChange, onRemove }: FilterCardProps) {
  switch (filter.type) {
    case 'last_contact':
      return (
        <LastContactFilterCard
          filter={filter}
          delta={delta}
          onChange={onChange as (patch: Partial<typeof filter>) => void}
          onRemove={onRemove}
        />
      );
  }
}

/** Filter types that the user can currently add via the "+ Add filter" menu. */
export const ADDABLE_FILTER_TYPES: { type: FilterType; label: string }[] = [
  { type: 'last_contact', label: 'Last contact' },
];

/** Build a fresh default filter for a given type. */
export function createDefaultFilter(type: FilterType): Filter {
  const id = `filter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  switch (type) {
    case 'last_contact':
      return { id, type: 'last_contact', op: 'more_than', days: 30 };
  }
}
