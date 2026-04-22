import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BidRevisePanel } from '@/components/bid-revise-panel';
import { Button } from '@/components/ui/button';
import { CORN_CONTRACTS } from '@/lib/bid-data';

const meta: Meta<typeof BidRevisePanel> = {
  title: 'Compositions/BidRevisePanel',
  component: BidRevisePanel,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Interactive',
  render: function ReviseStory() {
    const [open, setOpen] = useState(false);
    const contract = CORN_CONTRACTS[0]; // Jul 2026

    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>
          Open Revise Panel — {contract.label}
        </Button>
        <BidRevisePanel
          contract={contract}
          open={open}
          onClose={() => setOpen(false)}
        />
      </div>
    );
  },
};

export const DecContract: Story = {
  name: 'Dec 2026 Contract',
  render: function DecStory() {
    const [open, setOpen] = useState(false);
    const contract = CORN_CONTRACTS[2]; // Dec 2026

    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>
          Open Revise Panel — {contract.label}
        </Button>
        <BidRevisePanel
          contract={contract}
          open={open}
          onClose={() => setOpen(false)}
        />
      </div>
    );
  },
};
