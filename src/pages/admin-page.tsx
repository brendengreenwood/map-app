import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUsers } from '@/hooks/use-users';
import {
  fetchElevators, updateElevator,
  fetchAssignments, createAssignment, deleteAssignment,
  fetchUsers,
  type ElevatorRow, type AssignmentRow, type UserRow,
} from '@/lib/api';

export default function AdminPage() {
  const { activeUser, loading } = useUsers();

  if (loading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading...</div>;
  }

  if (!activeUser.types.includes('admin')) {
    return <Navigate to="/" replace />;
  }

  return <AdminContent />;
}

function AdminContent() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [elevators, setElevators] = useState<ElevatorRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const merchants = users.filter((u) => u.types.includes('merchant'));
  const originators = users.filter((u) => u.types.includes('originator'));

  const reload = useCallback(async () => {
    setLoading(true);
    const [u, e, a] = await Promise.all([fetchUsers(), fetchElevators(), fetchAssignments()]);
    setUsers(u.users);
    setElevators(e.elevators);
    setAssignments(a.assignments);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleElevatorAssign = async (elevatorId: string, merchantUserId: string) => {
    await updateElevator(elevatorId, { merchant_user_id: merchantUserId || null });
    reload();
  };

  const handleOriginatorAssign = async (originatorUserId: string, merchantUserId: string) => {
    // Remove existing assignment for this originator
    const existing = assignments.filter((a) => a.originator_user_id === originatorUserId);
    for (const a of existing) {
      await deleteAssignment(a.merchant_user_id, a.originator_user_id);
    }
    // Create new assignment if a merchant was selected
    if (merchantUserId) {
      await createAssignment(merchantUserId, originatorUserId);
    }
    reload();
  };

  const getAssignedMerchant = (originatorUserId: string): string => {
    const a = assignments.find((a) => a.originator_user_id === originatorUserId);
    return a?.merchant_user_id ?? '';
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Assign originators to merchants and elevators to merchants.</p>
      </div>

      {/* Originator → Merchant Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Originator → Merchant</CardTitle>
          <CardDescription>Assign each originator user to a merchant user.</CardDescription>
        </CardHeader>
        <CardContent>
          {originators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users with "originator" type.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {originators.map((originator) => (
                <div key={originator.id} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-sm truncate">{originator.name}</span>
                  </div>
                  <Select
                    value={getAssignedMerchant(originator.id)}
                    onValueChange={(v) => handleOriginatorAssign(originator.id, v)}
                  >
                    <SelectTrigger className="w-48 shrink-0">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Elevator → Merchant Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Elevator → Merchant</CardTitle>
          <CardDescription>Assign each elevator to a merchant user.</CardDescription>
        </CardHeader>
        <CardContent>
          {elevators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No elevators in the system.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {elevators.map((elevator) => (
                <div key={elevator.id} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-sm truncate">{elevator.name}</span>
                    <span className="text-xs text-muted-foreground">{elevator.address}</span>
                    <div className="flex gap-1 mt-0.5">
                      {elevator.commodities.map((c) => (
                        <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">{c}</Badge>
                      ))}
                    </div>
                  </div>
                  <Select
                    value={elevator.merchant_user_id ?? ''}
                    onValueChange={(v) => handleElevatorAssign(elevator.id, v)}
                  >
                    <SelectTrigger className="w-48 shrink-0">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={reload}>Refresh</Button>
      </div>
    </div>
  );
}
