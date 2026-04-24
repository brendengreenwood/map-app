import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icon } from '@/components/ui/icon';
import { mdiCalendar, mdiLoading, mdiMapMarkerOutline } from '@mdi/js';
import { cn } from '@/lib/utils';
import { formatBasis, formatFreight, CORN_CONTRACTS } from '@/lib/bid-data';
import {
  createScenario, checkScenarioExists,
  type ScenarioRow, type ScenarioWindowRow, type ElevatorRow,
} from '@/lib/api';
import { useUsers } from '@/hooks/use-users';
import type { TosWindow } from '@/pages/map-page';

interface BidMapEditorProps {
  mode: 'create' | 'revise';
  /** The scenario being revised (revise mode only) */
  scenario?: ScenarioRow | null;
  /** Active delivery window tab (revise mode only, undefined = contract tab) */
  activeWindow?: ScenarioWindowRow;
  /** Active TOS window being edited (undefined = contract tab) */
  activeTosWindow?: TosWindow;
  /** Whether the contract tab is active */
  isContractTab?: boolean;
  /** Merchant's elevators (create mode only) */
  elevators?: ElevatorRow[];
  /** All TOS windows for the scenario */
  tosWindows?: TosWindow[];
  onSave?: () => void;
  onCancel?: () => void;
  /** Called to update a TOS window's data */
  onUpdateTosWindow?: (id: string, updates: Partial<TosWindow>) => void;
  /** Exposes save handler + disabled state to parent for external publish button */
  onPublishStateChange?: (state: { save: () => void; disabled: boolean; saving: boolean }) => void;
  /** Called when selected contract code changes (so competitor panel can fetch bids) */
  onContractCodeChange?: (code: string | null) => void;
  /** Lookback date for competitor bids */
  lookbackDate?: Date;
  /** Called when lookback date changes */
  onLookbackDateChange?: (date: Date) => void;
}

function getWindowPricing(scenario: ScenarioRow, window: ScenarioWindowRow) {
  return {
    posted: window.posted ?? scenario.posted,
    max: window.max ?? scenario.max,
    leeway: window.leeway ?? scenario.leeway,
    increment: window.increment ?? scenario.increment,
    freight: window.freight ?? scenario.freight,
    isOverride: window.is_override === 1,
  };
}

export function BidMapEditor({
  mode,
  scenario,
  activeWindow,
  activeTosWindow,
  isContractTab: isContractTabProp = true,
  elevators,
  tosWindows = [],
  onSave,
  onCancel,
  onUpdateTosWindow,
  onPublishStateChange,
  onContractCodeChange,
  lookbackDate,
  onLookbackDateChange,
}: BidMapEditorProps) {
  const { activeUser } = useUsers();
  const isCreateMode = mode === 'create';
  const isContractLevel = isContractTabProp;
  const isTosTab = !!activeTosWindow;

  // ── Create-mode selections ──
  const [selectedElevatorId, setSelectedElevatorId] = useState('');
  const [selectedContractCode, setSelectedContractCode] = useState('');

  const selectedContract = useMemo(
    () => CORN_CONTRACTS.find((c) => c.code === selectedContractCode),
    [selectedContractCode],
  );

  // Notify parent of current contract code for competitor bids panel
  const activeContractCode = isCreateMode ? selectedContractCode || null : scenario?.contract_code ?? null;
  useEffect(() => {
    onContractCodeChange?.(activeContractCode);
  }, [activeContractCode]);

  // ── Pricing fields ──
  const [posted, setPosted] = useState('');
  const [max, setMax] = useState('');
  const [leeway, setLeeway] = useState('');
  const [increment, setIncrement] = useState('');
  const [freight, setFreight] = useState('');

  // ── Save state ──
  const [saving, setSaving] = useState(false);

  // ── Conflict dialog ──
  const [conflictScenario, setConflictScenario] = useState<ScenarioRow | null>(null);

  // Compute the active pricing for the current view
  const activePricing = useMemo(() => {
    if (!scenario) return null;
    if (activeWindow) return getWindowPricing(scenario, activeWindow);
    return {
      posted: scenario.posted,
      max: scenario.max,
      leeway: scenario.leeway,
      increment: scenario.increment,
      freight: scenario.freight,
    };
  }, [scenario, activeWindow]);

  // Reset pricing fields when scenario or active tab changes
  const editKey = activeWindow?.window_code ?? scenario?.contract_code ?? '__new__';
  useEffect(() => {
    if (isCreateMode) {
      // Default values for new scenario
      setPosted('-25');
      setMax('-15');
      setLeeway('3');
      setIncrement('1');
      setFreight('12');
    } else if (activePricing) {
      setPosted(`${activePricing.posted}`);
      setMax(`${activePricing.max}`);
      setLeeway(`${activePricing.leeway}`);
      setIncrement(`${activePricing.increment}`);
      setFreight(`${activePricing.freight}`);
    }
  }, [editKey, isCreateMode, activePricing]);

  // ── Save logic ──

  const handleSave = async (replace = false) => {
    if (isCreateMode) {
      if (!selectedElevatorId || !selectedContract) return;

      const tosWindowPayloads = tosWindows
        .filter((w) => w.startDate && w.endDate)
        .map((w) => ({
          window_code: w.id,
          window_label: w.startDate && w.endDate
            ? `${format(w.startDate, 'MMM d')} – ${format(w.endDate, 'MMM d')}`
            : w.label,
          is_override: w.posted != null,
          ...(w.posted != null ? { posted: parseInt(w.posted) } : {}),
          ...(w.max != null ? { max: parseInt(w.max) } : {}),
          ...(w.leeway != null ? { leeway: parseInt(w.leeway) } : {}),
          ...(w.increment != null ? { increment: parseInt(w.increment) } : {}),
          ...(w.freight != null ? { freight: parseInt(w.freight) } : {}),
        }));

      const payload = {
        id: crypto.randomUUID(),
        merchant_user_id: activeUser.id,
        elevator_id: selectedElevatorId,
        contract_code: selectedContract.code,
        contract_label: selectedContract.label,
        posted: parseInt(posted) || 0,
        max: parseInt(max) || 0,
        leeway: parseInt(leeway) || 0,
        increment: parseInt(increment) || 0,
        freight: parseInt(freight) || 0,
        updated_by: activeUser.name,
        replace,
        ...(tosWindowPayloads.length > 0 ? { windows: tosWindowPayloads } : {}),
      };

      if (!replace) {
        // Check for conflict first
        setSaving(true);
        try {
          const check = await checkScenarioExists(
            activeUser.id, selectedElevatorId, selectedContract.code,
          );
          if (check.exists) {
            setConflictScenario(check.scenario);
            setSaving(false);
            return;
          }
        } catch {
          // If check fails, proceed anyway
        }
      }

      setSaving(true);
      try {
        await createScenario(payload);
        onSave?.();
      } catch (err) {
        console.error('Failed to create scenario:', err);
      } finally {
        setSaving(false);
      }
    } else if (scenario) {
      // Revise mode: create a new scenario revision (replace the old one)
      setSaving(true);
      try {
        const windowUpdates = tosWindows.map((w) => ({
          window_code: w.id,
          window_label: w.startDate && w.endDate
            ? `${format(w.startDate, 'MMM d')} – ${format(w.endDate, 'MMM d')}`
            : w.label,
          is_override: w.posted != null,
          ...(w.posted != null ? { posted: parseInt(w.posted) } : {}),
          ...(w.max != null ? { max: parseInt(w.max) } : {}),
          ...(w.leeway != null ? { leeway: parseInt(w.leeway) } : {}),
          ...(w.increment != null ? { increment: parseInt(w.increment) } : {}),
          ...(w.freight != null ? { freight: parseInt(w.freight) } : {}),
        }));

        await createScenario({
          id: crypto.randomUUID(),
          merchant_user_id: scenario.merchant_user_id,
          elevator_id: scenario.elevator_id,
          contract_code: scenario.contract_code,
          contract_label: scenario.contract_label,
          posted: isContractLevel ? parseInt(posted) || 0 : scenario.posted,
          max: isContractLevel ? parseInt(max) || 0 : scenario.max,
          leeway: isContractLevel ? parseInt(leeway) || 0 : scenario.leeway,
          increment: isContractLevel ? parseInt(increment) || 0 : scenario.increment,
          freight: isContractLevel ? parseInt(freight) || 0 : scenario.freight,
          updated_by: activeUser.name,
          replace: true,
          windows: windowUpdates,
        });
        onSave?.();
      } catch (err) {
        console.error('Failed to revise scenario:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleConfirmReplace = async () => {
    setConflictScenario(null);
    await handleSave(true);
  };

  const conflictElevator = elevators?.find((e) => e.id === selectedElevatorId);

  // Expose save state to parent for external publish button
  const publishDisabled = saving || (isCreateMode && (!selectedElevatorId || !selectedContractCode));
  useEffect(() => {
    onPublishStateChange?.({
      save: () => handleSave(),
      disabled: publishDisabled,
      saving,
    });
  }, [publishDisabled, saving, onPublishStateChange, selectedElevatorId, selectedContractCode]);

  // ── Render ──

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-2.5">
        {isCreateMode && isContractLevel ? (
          <>
            <div className="text-sm font-semibold">New Scenario</div>
            <div className="text-[10px] text-muted-foreground">
              Select an elevator, contract month, and pricing
            </div>
          </>
        ) : isCreateMode && isTosTab ? (
          <>
            <div className="text-sm font-semibold">{activeTosWindow!.label}</div>
            <div className="text-[10px] text-muted-foreground">
              Set delivery date range and optional pricing overrides
            </div>
          </>
        ) : isContractLevel ? (
          <>
            <div className="text-sm font-semibold">{scenario!.contract_label}</div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span>ZC {scenario!.contract_code}</span>
              <Badge variant="default" className="h-4 px-1 text-[9px]">
                contract
              </Badge>
              <span>· {tosWindows.length} window{tosWindows.length !== 1 ? 's' : ''}</span>
            </div>
          </>
        ) : isTosTab ? (
          <>
            <div className="text-sm font-semibold">{activeTosWindow!.label}</div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span>{activeTosWindow!.id}</span>
              <Badge
                variant={activeWindow?.is_override === 1 ? 'default' : 'secondary'}
                className="h-4 px-1 text-[9px]"
              >
                {activeWindow?.is_override === 1 ? 'override' : 'inherits'}
              </Badge>
            </div>
          </>
        ) : null}
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-4">
          {isTosTab ? (
            /* ══════════════════════════════════════════════════
               TOS TAB — date range + optional pricing overrides
               ══════════════════════════════════════════════════ */
            <>
              {/* Parent contract context */}
              <div className="rounded-md border border-dashed border-border p-3">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isCreateMode
                    ? `Contract · ${selectedContract ? `${selectedContract.label} (${selectedContract.code})` : '—'}`
                    : `Parent · ${scenario!.contract_label} (ZC ${scenario!.contract_code})`}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Posted: </span>
                    <span className="font-mono">{formatBasis(parseInt(posted) || 0)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max: </span>
                    <span className="font-mono">{formatBasis(parseInt(max) || 0)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Freight: </span>
                    <span className="font-mono">{formatFreight(parseInt(freight) || 0)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Delivery date range */}
              <FieldGroup className="gap-2 [&_[data-slot=field-label]]:flex-none">
                <Field orientation="horizontal">
                  <FieldLabel className="w-20 shrink-0 text-xs">Start</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'flex h-8 flex-1 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors',
                          'hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          !activeTosWindow?.startDate && 'text-muted-foreground',
                        )}
                      >
                        <Icon path={mdiCalendar} className="size-3.5 text-muted-foreground" />
                        {activeTosWindow?.startDate
                          ? format(activeTosWindow.startDate, 'MMM d, yyyy')
                          : 'Start date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={activeTosWindow?.startDate}
                        onSelect={(d) =>
                          d && onUpdateTosWindow?.(activeTosWindow!.id, { startDate: d })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel className="w-20 shrink-0 text-xs">End</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'flex h-8 flex-1 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors',
                          'hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          !activeTosWindow?.endDate && 'text-muted-foreground',
                        )}
                      >
                        <Icon path={mdiCalendar} className="size-3.5 text-muted-foreground" />
                        {activeTosWindow?.endDate
                          ? format(activeTosWindow.endDate, 'MMM d, yyyy')
                          : 'End date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={activeTosWindow?.endDate}
                        onSelect={(d) =>
                          d && onUpdateTosWindow?.(activeTosWindow!.id, { endDate: d })
                        }
                        disabled={(d) =>
                          activeTosWindow?.startDate ? d < activeTosWindow.startDate : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
              </FieldGroup>

              <Separator />

              {/* Override pricing (optional) */}
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Pricing overrides <span className="normal-case">(leave blank to inherit)</span>
              </div>
              <FieldGroup className="gap-2 [&_[data-slot=field-label]]:flex-none">
                <Field orientation="horizontal">
                  <FieldLabel className="w-20 shrink-0 text-xs">Posted</FieldLabel>
                  <Input
                    className="flex-1"
                    type="number"
                    placeholder={posted}
                    value={activeTosWindow?.posted ?? ''}
                    onChange={(e) =>
                      onUpdateTosWindow?.(activeTosWindow!.id, {
                        posted: e.target.value || undefined,
                      })
                    }
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel className="w-20 shrink-0 text-xs">Max</FieldLabel>
                  <Input
                    className="flex-1"
                    type="number"
                    placeholder={max}
                    value={activeTosWindow?.max ?? ''}
                    onChange={(e) =>
                      onUpdateTosWindow?.(activeTosWindow!.id, {
                        max: e.target.value || undefined,
                      })
                    }
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel className="w-20 shrink-0 text-xs">Leeway</FieldLabel>
                  <Input
                    className="flex-1"
                    type="number"
                    placeholder={leeway}
                    value={activeTosWindow?.leeway ?? ''}
                    onChange={(e) =>
                      onUpdateTosWindow?.(activeTosWindow!.id, {
                        leeway: e.target.value || undefined,
                      })
                    }
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel className="w-20 shrink-0 text-xs">Increment</FieldLabel>
                  <Input
                    className="flex-1"
                    type="number"
                    placeholder={increment}
                    value={activeTosWindow?.increment ?? ''}
                    onChange={(e) =>
                      onUpdateTosWindow?.(activeTosWindow!.id, {
                        increment: e.target.value || undefined,
                      })
                    }
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel className="w-20 shrink-0 text-xs">Freight</FieldLabel>
                  <Input
                    className="flex-1"
                    type="number"
                    placeholder={freight}
                    value={activeTosWindow?.freight ?? ''}
                    onChange={(e) =>
                      onUpdateTosWindow?.(activeTosWindow!.id, {
                        freight: e.target.value || undefined,
                      })
                    }
                  />
                </Field>
              </FieldGroup>

            </>
          ) : (
            /* ══════════════════════════════════════════════════
               CONTRACT TAB — selectors + pricing
               ══════════════════════════════════════════════════ */
            <>
              {/* ── Create-mode selectors ── */}
              {isCreateMode && (
                <>
                  <FieldGroup className="gap-2 [&_[data-slot=field-label]]:flex-none">
                    <Field orientation="horizontal">
                      <FieldLabel className="w-20 shrink-0 text-xs">Elevator</FieldLabel>
                      <Select value={selectedElevatorId} onValueChange={setSelectedElevatorId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select elevator..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(elevators ?? []).map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              <div className="flex items-center gap-2">
                                <Icon path={mdiMapMarkerOutline} className="size-3 text-muted-foreground" />
                                {e.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field orientation="horizontal">
                      <FieldLabel className="w-20 shrink-0 text-xs">Contract</FieldLabel>
                      <Select value={selectedContractCode} onValueChange={setSelectedContractCode}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select contract..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CORN_CONTRACTS.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.label} ({c.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* Lookback date picker */}
                    <Field orientation="horizontal">
                      <FieldLabel className="w-20 shrink-0 text-xs">Lookback</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'flex h-8 flex-1 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors',
                              'hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              !lookbackDate && 'text-muted-foreground',
                            )}
                          >
                            <Icon path={mdiCalendar} className="size-3.5 text-muted-foreground" />
                            {lookbackDate
                              ? format(lookbackDate, 'MMM d, yyyy')
                              : 'Pick a date'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={lookbackDate}
                            onSelect={(d) => d && onLookbackDateChange?.(d)}
                            disabled={(d) => d > new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>

                  </FieldGroup>
                  <Separator />
                </>
              )}

              {/* ── Revise mode: delivery windows summary (contract tab) ── */}
              {!isCreateMode && isContractLevel && scenario && tosWindows.length > 0 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Time of shipment windows
                    </div>
                    {tosWindows.map((w) => {
                      const hasOverride = w.posted != null;
                      const displayPosted = w.posted ? parseInt(w.posted) : scenario.posted;
                      return (
                        <div
                          key={w.id}
                          className="flex items-center justify-between rounded-sm bg-muted/50 px-2 py-1 text-xs"
                        >
                          <span>{w.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground">
                              {formatBasis(displayPosted)}
                            </span>
                            <Badge
                              variant={hasOverride ? 'default' : 'secondary'}
                              className="h-4 px-1 text-[9px]"
                            >
                              {hasOverride ? 'override' : 'inherits'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                </>
              )}

              {/* ── TOS summary (create mode, contract tab) ── */}
              {isCreateMode && tosWindows.length > 0 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Time of shipment windows
                    </div>
                    {tosWindows.map((w) => {
                      const range =
                        w.startDate && w.endDate
                          ? `${format(w.startDate, 'MMM d')} – ${format(w.endDate, 'MMM d')}`
                          : 'No dates set';
                      return (
                        <div
                          key={w.id}
                          className="flex items-center justify-between rounded-sm bg-muted/50 px-2 py-1 text-xs"
                        >
                          <span>{w.label}</span>
                          <span className="font-mono text-muted-foreground">{range}</span>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                </>
              )}

              {/* ── Lookback date picker (revise mode, contract tab) ── */}
              {!isCreateMode && isContractLevel && (
                <>
                  <FieldGroup className="gap-2 [&_[data-slot=field-label]]:flex-none">
                    <Field orientation="horizontal">
                      <FieldLabel className="w-20 shrink-0 text-xs">Lookback</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'flex h-8 flex-1 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors',
                              'hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              !lookbackDate && 'text-muted-foreground',
                            )}
                          >
                            <Icon path={mdiCalendar} className="size-3.5 text-muted-foreground" />
                            {lookbackDate
                              ? format(lookbackDate, 'MMM d, yyyy')
                              : 'Pick a date'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={lookbackDate}
                            onSelect={(d) => d && onLookbackDateChange?.(d)}
                            disabled={(d) => d > new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                  </FieldGroup>
                  <Separator />
                </>
              )}

              {/* ── Editable pricing fields ── */}
              <FieldGroup className="gap-2 [&_[data-slot=field-label]]:flex-none">
                <Field orientation="horizontal">
                  <FieldLabel htmlFor={`posted-${editKey}`} className="w-20 shrink-0 text-xs">Posted</FieldLabel>
                  <Input
                    id={`posted-${editKey}`}
                    className="flex-1"
                    type="number"
                    value={posted}
                    onChange={(e) => setPosted(e.target.value)}
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor={`max-${editKey}`} className="w-20 shrink-0 text-xs">Max</FieldLabel>
                  <Input
                    id={`max-${editKey}`}
                    className="flex-1"
                    type="number"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor={`leeway-${editKey}`} className="w-20 shrink-0 text-xs">Leeway</FieldLabel>
                  <Input
                    id={`leeway-${editKey}`}
                    className="flex-1"
                    type="number"
                    value={leeway}
                    onChange={(e) => setLeeway(e.target.value)}
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor={`increment-${editKey}`} className="w-20 shrink-0 text-xs">Increment</FieldLabel>
                  <Input
                    id={`increment-${editKey}`}
                    className="flex-1"
                    type="number"
                    value={increment}
                    onChange={(e) => setIncrement(e.target.value)}
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor={`freight-${editKey}`} className="w-20 shrink-0 text-xs">Freight</FieldLabel>
                  <Input
                    id={`freight-${editKey}`}
                    className="flex-1"
                    type="number"
                    value={freight}
                    onChange={(e) => setFreight(e.target.value)}
                  />
                </Field>
              </FieldGroup>

              {/* ── Propagation info (contract tab with windows) ── */}
              {tosWindows.length > 0 && (
                <div className="text-center text-xs text-muted-foreground">
                  Changes propagate to {tosWindows.filter((w) => !w.posted).length} inheriting window{tosWindows.filter((w) => !w.posted).length !== 1 ? 's' : ''}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer — cancel only; publish lives in the tab bar */}
      <div className="flex shrink-0 border-t border-border p-3">
        <Button variant="outline" size="sm" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* ── Conflict Dialog ── */}
      <AlertDialog open={!!conflictScenario} onOpenChange={(open) => { if (!open) setConflictScenario(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Scenario already exists</AlertDialogTitle>
            <AlertDialogDescription>
              A scenario for <strong>{conflictScenario?.contract_label} ({conflictScenario?.contract_code})</strong> at{' '}
              <strong>{conflictElevator?.name}</strong> already exists. Do you want to replace it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace} disabled={saving}>
              {saving && <Icon path={mdiLoading} className="mr-2 size-4 animate-spin" />}
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
