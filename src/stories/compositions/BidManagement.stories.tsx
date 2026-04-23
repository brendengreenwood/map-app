import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BidContractRow } from '@/components/bid-contract-row';
import { BidRevisePanel } from '@/components/bid-revise-panel';
import type { ScenarioRow } from '@/lib/api';
import { CORN_CONTRACTS } from '@/lib/bid-data';

// ── Mock scenario for stories ──────────────────────────────

function mockScenario(contractIndex: number, overrides?: Partial<ScenarioRow>): ScenarioRow {
  const c = CORN_CONTRACTS[contractIndex];
  return {
    id: `story-${c.code}`,
    merchant_user_id: 'story-merchant',
    elevator_id: 'story-elevator',
    contract_code: c.code,
    contract_label: c.label,
    posted: -25,
    max: -15,
    leeway: 3,
    increment: 1,
    freight: 12,
    is_active: 1,
    updated_by: 'R. Miller',
    created_at: new Date().toISOString(),
    elevator_name: 'Riverside Terminal',
    windows: contractIndex === 0 ? [
      { id: 'w1', scenario_id: `story-${c.code}`, window_code: `${c.code}-JUN-A`, window_label: 'Jun 1–15', is_override: 1, posted: -23, max: null, leeway: null, increment: null, freight: 10 },
      { id: 'w2', scenario_id: `story-${c.code}`, window_code: `${c.code}-JUN-B`, window_label: 'Jun 16–30', is_override: 0, posted: null, max: null, leeway: null, increment: null, freight: null },
      { id: 'w3', scenario_id: `story-${c.code}`, window_code: `${c.code}-JUL-A`, window_label: 'Jul 1–15', is_override: 0, posted: null, max: null, leeway: null, increment: null, freight: null },
    ] : [],
    ...overrides,
  };
}

// ── BidContractRow stories ─────────────────────────────────

const rowMeta: Meta<typeof BidContractRow> = {
  title: 'Compositions/BidContractRow',
  component: BidContractRow,
  decorators: [
    (Story) => (
      <div className="max-w-5xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default rowMeta;
type RowStory = StoryObj<typeof rowMeta>;

export const Collapsed: RowStory = {
  args: {
    scenario: mockScenario(0),
    expanded: false,
    onToggle: () => {},
    onRevise: () => {},
    onDelete: () => {},
  },
};

export const Expanded: RowStory = {
  args: {
    scenario: mockScenario(0),
    expanded: true,
    onToggle: () => {},
    onRevise: () => {},
    onDelete: () => {},
  },
};

export const NoDeliveryWindows: RowStory = {
  name: 'Expanded (no windows)',
  args: {
    scenario: mockScenario(5),
    expanded: true,
    onToggle: () => {},
    onRevise: () => {},
    onDelete: () => {},
  },
};

export const AllContracts: RowStory = {
  name: 'Full List (interactive)',
  render: function FullList() {
    const allScenarios = CORN_CONTRACTS.map((_, i) => mockScenario(i));
    const [expanded, setExpanded] = useState<Set<string>>(new Set([allScenarios[0].id]));
    const [revising, setRevising] = useState<ScenarioRow | null>(null);

    const toggle = (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    return (
      <div className="flex flex-col gap-2">
        {allScenarios.map((s) => (
          <BidContractRow
            key={s.id}
            scenario={s}
            expanded={expanded.has(s.id)}
            onToggle={() => toggle(s.id)}
            onRevise={() => setRevising(s)}
            onDelete={() => {}}
          />
        ))}
        <BidRevisePanel
          contract={revising ? { code: revising.contract_code, label: revising.contract_label } : null}
          open={revising !== null}
          onClose={() => setRevising(null)}
        />
      </div>
    );
  },
};
