import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { BidContractRow } from '@/components/bid-contract-row';
import {
  CORN_CONTRACTS, ELEVATOR_LOCATIONS, type CornContract,
} from '@/lib/bid-data';
import {
  TrendingUp, ChevronsUpDown, ChevronsDownUp, Plus, MapPin,
} from 'lucide-react';

function ContractTable({
  expanded,
  onToggle,
  onRevise,
  onReviseWindow,
}: {
  expanded: Set<string>;
  onToggle: (code: string) => void;
  onRevise: (contract: CornContract) => void;
  onReviseWindow: (contract: CornContract, windowCode: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Contract</TableHead>
          <TableHead>Posted</TableHead>
          <TableHead>Max</TableHead>
          <TableHead>Leeway</TableHead>
          <TableHead>Increment</TableHead>
          <TableHead>Freight</TableHead>
          <TableHead className="text-right">Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {CORN_CONTRACTS.map((c) => (
          <BidContractRow
            key={c.code}
            contract={c}
            expanded={expanded.has(c.code)}
            onToggle={() => onToggle(c.code)}
            onRevise={() => onRevise(c)}
            onReviseWindow={(windowCode) => onReviseWindow(c, windowCode)}
          />
        ))}
      </TableBody>
    </Table>
  );
}

export default function BidManagementPage() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['N26']));

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

  const reviseContract = useCallback(
    (contract: CornContract) => {
      navigate('/map', { state: { contract } });
    },
    [navigate],
  );

  const reviseWindow = useCallback(
    (contract: CornContract, windowCode: string) => {
      navigate('/map', { state: { contract, initialWindowCode: windowCode } });
    },
    [navigate],
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={TrendingUp}
        title="Scenarios"
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

      <Tabs defaultValue={ELEVATOR_LOCATIONS[0].id}>
        <Card className="gap-0 py-0">
          <div className="border-b px-4 pt-3 pb-3">
            <TabsList variant="line">
              {ELEVATOR_LOCATIONS.map((loc) => (
                <TabsTrigger key={loc.id} value={loc.id} className="gap-1.5">
                  <MapPin className="size-3.5" />
                  {loc.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {ELEVATOR_LOCATIONS.map((loc) => (
            <TabsContent key={loc.id} value={loc.id} className="mt-0">
              <CardContent className="p-0 px-4 pb-4">
                <ContractTable
                  expanded={expanded}
                  onToggle={toggle}
                  onRevise={reviseContract}
                  onReviseWindow={reviseWindow}
                />
              </CardContent>
            </TabsContent>
          ))}
        </Card>
      </Tabs>
    </div>
  );
}
