import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/page-header';
import { BidContractRow } from '@/components/bid-contract-row';
import { useUsers } from '@/hooks/use-users';
import {
  fetchElevators, fetchScenarios, deleteScenario,
  type ElevatorRow, type ScenarioRow,
} from '@/lib/api';
import {
  TrendingUp, ChevronsUpDown, ChevronsDownUp, Plus, MapPin, Loader2,
} from 'lucide-react';

// ── Contract table for a single elevator ─────────────────

function ContractTable({
  scenarios,
  expanded,
  onToggle,
  onRevise,
  onDelete,
  onReviseWindow,
}: {
  scenarios: ScenarioRow[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onRevise: (scenario: ScenarioRow) => void;
  onDelete: (scenario: ScenarioRow) => void;
  onReviseWindow: (scenario: ScenarioRow, windowCode: string) => void;
}) {
  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <TrendingUp className="mb-2 size-8 opacity-40" />
        <p className="text-sm">No scenarios for this elevator yet.</p>
        <p className="text-xs">Click "New Scenario" to create one.</p>
      </div>
    );
  }

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
        {scenarios.map((s) => (
          <BidContractRow
            key={s.id}
            scenario={s}
            expanded={expanded.has(s.id)}
            onToggle={() => onToggle(s.id)}
            onRevise={() => onRevise(s)}
            onDelete={() => onDelete(s)}
            onReviseWindow={(windowCode) => onReviseWindow(s, windowCode)}
          />
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main page ────────────────────────────────────────────

export default function BidManagementPage() {
  const navigate = useNavigate();
  const { activeUser } = useUsers();
  const isMerchant = activeUser.types.includes('merchant');

  const [elevators, setElevators] = useState<ElevatorRow[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [activeElevatorId, setActiveElevatorId] = useState<string>('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ScenarioRow | null>(null);

  // Load data when active user changes
  const loadData = useCallback(async () => {
    if (!isMerchant) {
      setElevators([]);
      setScenarios([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [elevRes, scenRes] = await Promise.all([
        fetchElevators(activeUser.id),
        fetchScenarios(activeUser.id),
      ]);
      setElevators(elevRes.elevators);
      setScenarios(scenRes.scenarios);
      if (elevRes.elevators.length > 0 && !activeElevatorId) {
        setActiveElevatorId(elevRes.elevators[0].id);
      }
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    } finally {
      setLoading(false);
    }
  }, [activeUser.id, isMerchant, activeElevatorId]);

  useEffect(() => {
    setActiveElevatorId('');
    loadData();
  }, [activeUser.id]);

  // Filter scenarios by elevator
  const scenariosForElevator = (elevatorId: string) =>
    scenarios.filter((s) => s.elevator_id === elevatorId);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => setExpanded(new Set(scenarios.map((s) => s.id)));
  const collapseAll = () => setExpanded(new Set());

  const reviseScenario = useCallback(
    (scenario: ScenarioRow) => {
      navigate('/map', {
        state: { mode: 'revise', scenario },
      });
    },
    [navigate],
  );

  const reviseWindow = useCallback(
    (scenario: ScenarioRow, windowCode: string) => {
      navigate('/map', {
        state: { mode: 'revise', scenario, initialWindowCode: windowCode },
      });
    },
    [navigate],
  );

  const openNewScenario = () => {
    navigate('/map', {
      state: { mode: 'create', elevators },
    });
  };

  const handleDeleteScenario = async () => {
    if (!deleteTarget) return;
    try {
      await deleteScenario(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete scenario:', err);
    }
  };

  if (!isMerchant) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          icon={TrendingUp}
          title="Scenarios"
          description="Switch to a merchant user to manage scenarios."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          icon={TrendingUp}
          title="Scenarios"
          description="Loading scenarios..."
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (elevators.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          icon={TrendingUp}
          title="Scenarios"
          description="No elevators assigned to your account. Add elevators in the Admin page first."
        />
      </div>
    );
  }

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
          <Button size="sm" onClick={openNewScenario}>
            <Plus data-icon="inline-start" />
            New Scenario
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeElevatorId} onValueChange={setActiveElevatorId}>
        <Card className="gap-0 py-0">
          <div className="border-b px-4 pt-3 pb-3">
            <TabsList variant="line">
              {elevators.map((elev) => (
                <TabsTrigger key={elev.id} value={elev.id} className="gap-1.5">
                  <MapPin className="size-3.5" />
                  {elev.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {elevators.map((elev) => (
            <TabsContent key={elev.id} value={elev.id} className="mt-0">
              <CardContent className="p-0 px-4 pb-4">
                <ContractTable
                  scenarios={scenariosForElevator(elev.id)}
                  expanded={expanded}
                  onToggle={toggle}
                  onRevise={reviseScenario}
                  onDelete={setDeleteTarget}
                  onReviseWindow={reviseWindow}
                />
              </CardContent>
            </TabsContent>
          ))}
        </Card>
      </Tabs>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scenario?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the scenario for{' '}
              <strong>{deleteTarget?.contract_label} ({deleteTarget?.contract_code})</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteScenario}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
