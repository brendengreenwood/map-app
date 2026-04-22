import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { BidContractRow } from '@/components/bid-contract-row';
import { BidRevisePanel } from '@/components/bid-revise-panel';
import { CORN_CONTRACTS, type CornContract } from '@/lib/bid-data';
import { TrendingUp, ChevronsUpDown, ChevronsDownUp, Plus } from 'lucide-react';

export default function BidManagementPage() {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['N26']));
  const [revising, setRevising] = useState<CornContract | null>(null);

  const toggle = useCallback((code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const expandAll = () => setExpanded(new Set(CORN_CONTRACTS.map((c) => c.code)));
  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={TrendingUp}
        title="Bid Management"
        description="Manage corn futures contract bids and forward delivery pricing."
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronsUpDown data-icon="inline-start" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronsDownUp data-icon="inline-start" />
            Collapse All
          </Button>
          <Button size="sm">
            <Plus data-icon="inline-start" />
            New Scenario
          </Button>
        </div>
      </PageHeader>

      <div className="text-xs text-muted-foreground">
        {CORN_CONTRACTS.length} contracts · click a row to see delivery windows
      </div>

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
      </div>

      <BidRevisePanel
        contract={revising}
        open={revising !== null}
        onClose={() => setRevising(null)}
      />
    </div>
  );
}
