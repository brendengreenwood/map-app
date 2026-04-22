import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BidContractRow } from '@/components/bid-contract-row';
import { BidRevisePanel } from '@/components/bid-revise-panel';
import { CORN_CONTRACTS, type CornContract } from '@/lib/bid-data';

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
    contract: CORN_CONTRACTS[0],
    expanded: false,
    onToggle: () => {},
    onRevise: () => {},
  },
};

export const Expanded: RowStory = {
  args: {
    contract: CORN_CONTRACTS[0],
    expanded: true,
    onToggle: () => {},
    onRevise: () => {},
  },
};

export const NoDeliveryWindows: RowStory = {
  name: 'Expanded (no windows)',
  args: {
    contract: CORN_CONTRACTS[5], // N27 — no delivery windows
    expanded: true,
    onToggle: () => {},
    onRevise: () => {},
  },
};

export const AllContracts: RowStory = {
  name: 'Full List (interactive)',
  render: function FullList() {
    const [expanded, setExpanded] = useState<Set<string>>(new Set(['N26']));
    const [revising, setRevising] = useState<CornContract | null>(null);

    const toggle = (code: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        return next;
      });
    };

    return (
      <div className="flex flex-col gap-2">
        {CORN_CONTRACTS.map((c) => (
          <BidContractRow
            key={c.code}
            contract={c}
            expanded={expanded.has(c.code)}
            onToggle={() => toggle(c.code)}
            onRevise={() => setRevising(c)}
          />
        ))}
        <BidRevisePanel
          contract={revising}
          open={revising !== null}
          onClose={() => setRevising(null)}
        />
      </div>
    );
  },
};
