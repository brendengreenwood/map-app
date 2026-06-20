"use client"

import * as React from "react"
import {
  Search,
  Filter,
  Calendar,
  Plus,
  Upload,
  Trash2,
  MoreVertical,
  Pencil,
  Truck,
} from "lucide-react"

import { Section, Subhead } from "./section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, type Status } from "@/components/ui/status-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Load = {
  id: string
  farm: string
  grain: string
  status: Status
  bu: string
}

const loads: Load[] = [
  { id: "#4471", farm: "Hartmann Farms", grain: "Corn", status: "in_transit", bu: "18,400" },
  { id: "#4468", farm: "Valley Co-op", grain: "Soybean", status: "settled", bu: "9,120" },
  { id: "#4465", farm: "Birchwood Grain", grain: "Wheat", status: "on_hold", bu: "12,750" },
  { id: "#4460", farm: "Hartmann Farms", grain: "Corn", status: "rejected", bu: "0" },
]

function RowMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8"> <MoreVertical /> <span className="sr-only">Row actions</span> </Button>} />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem>View</DropdownMenuItem>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ListView() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set(["#4471", "#4468"]))
  const allChecked = selected.size === loads.length
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(loads.map((l) => l.id)))

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5">
        <div className="relative min-w-32 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search loads, farms, tickets…" className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter /> Status
          <Badge variant="secondary" className="ml-1 font-mono">2</Badge>
        </Button>
        <Button variant="outline">
          <Calendar /> This week
        </Button>
        <Button>
          <Plus /> New load
        </Button>
      </div>

      {/* bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 border-y bg-primary/[0.07] px-4 py-2.5">
          <span className="text-sm font-semibold">
            <span className="font-mono">{selected.size}</span> selected
          </span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline">
              <Upload /> Export
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 /> Delete
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-0 pr-0">
              <Checkbox checked={allChecked} onCheckedChange={toggleAll} aria-label="Select all" />
            </TableHead>
            <TableHead>Load</TableHead>
            <TableHead>Grain</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Net bu</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loads.map((l) => {
            const checked = selected.has(l.id)
            return (
              <TableRow key={l.id} data-state={checked ? "selected" : undefined}>
                <TableCell className="pr-0">
                  <Checkbox checked={checked} onCheckedChange={() => toggle(l.id)} aria-label={`Select ${l.id}`} />
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{l.id}</div>
                  <div className="text-xs text-muted-foreground">{l.farm}</div>
                </TableCell>
                <TableCell>{l.grain}</TableCell>
                <TableCell>
                  <StatusBadge status={l.status as Status} />
                </TableCell>
                <TableCell className="text-right font-mono">{l.bu}</TableCell>
                <TableCell>
                  <RowMenu />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t px-4 py-2.5">
        <div className="text-sm text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">1–4</span> of{" "}
          <span className="font-mono font-semibold text-foreground">128</span> loads
        </div>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
            <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationNext href="#" /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

function RecordForm() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-6 py-4">
        <div className="text-xs text-muted-foreground">Loads / New</div>
        <h4 className="mt-1 text-lg font-semibold tracking-tight">New load ticket</h4>
      </div>
      <div className="flex flex-col gap-7 p-6">
        <div className="grid gap-7 sm:grid-cols-[200px_1fr]">
          <div>
            <div className="text-sm font-semibold">Load details</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Who delivered and what they brought.
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Farm / supplier <span className="text-destructive">*</span></Label>
                <Input defaultValue="Hartmann Farms" />
              </div>
              <div className="grid gap-2">
                <Label>Ticket # <span className="text-destructive">*</span></Label>
                <Input defaultValue="4471" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Grain <span className="text-destructive">*</span></Label>
                <Select defaultValue="corn">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corn">Corn</SelectItem>
                    <SelectItem value="soybean">Soybean</SelectItem>
                    <SelectItem value="wheat">Wheat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Delivery date</Label>
                <Input defaultValue="Jun 7, 2026" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-7 sm:grid-cols-[200px_1fr]">
          <div>
            <div className="text-sm font-semibold">Weights &amp; grade</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Scale tickets and quality discounts.
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Gross weight (bu)</Label>
                <Input defaultValue="18,640" />
              </div>
              <div className="grid gap-2">
                <Label>Moisture %</Label>
                <Input defaultValue="16.2" aria-invalid />
                <p className="text-xs text-destructive">Over 15% — a drying discount will apply.</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea placeholder="Grading notes, dockage, foreign material…" />
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 flex items-center gap-2.5 border-t bg-muted/40 px-6 py-3.5">
        <Button variant="ghost">Cancel</Button>
        <div className="ml-auto flex gap-2.5">
          <Button variant="outline">Save draft</Button>
          <Button>Create load</Button>
        </div>
      </div>
    </div>
  )
}

function DetailView() {
  const rows: [string, React.ReactNode, boolean][] = [
    ["Status", <StatusBadge key="s" status="in_transit" />, false],
    ["Ticket #", "4471", true],
    ["Net weight", "18,400 bu", true],
    ["Cash price", "$4.62 / bu", true],
    ["Moisture", "16.2%", true],
    ["Delivered", "Jun 7, 2026", false],
  ]
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-start gap-3.5 border-b px-6 py-5">
        <div className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
          <Truck className="size-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-lg font-semibold tracking-tight">Load #4471</h4>
          <div className="text-sm text-muted-foreground">Hartmann Farms · Corn</div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline"><Pencil /> Edit</Button>
          <Button size="sm" variant="outline" className="size-8 p-0"><MoreVertical /></Button>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 px-6 pb-5 pt-2">
        {rows.map(([k, v, mono]) => (
          <div key={k} className="border-b py-3.5">
            <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
            <dd className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-lg border bg-card px-6 py-14 text-center">
      <div className="mb-4 grid size-13 place-items-center rounded-full bg-muted text-muted-foreground">
        <Truck className="size-6" />
      </div>
      <h4 className="text-base font-semibold">No loads yet</h4>
      <p className="mt-1.5 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
        Create your first load ticket to start tracking deliveries, grades, and settlements.
      </p>
      <Button className="mt-4"><Plus /> New load</Button>
    </div>
  )
}

function DeleteDialog() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-base font-semibold tracking-tight">Delete load #4471?</div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        This permanently removes the ticket, its scale weights, and grade data.
        This action cannot be undone.
      </p>
      <div className="mt-5 flex justify-end gap-2.5">
        <Dialog>
          <DialogTrigger render={<Button size="sm" variant="outline">Cancel</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wired example</DialogTitle>
              <DialogDescription>
                In product, pair this with AlertDialog for the real confirm flow.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button size="sm">Got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button size="sm" variant="destructive">Delete load</Button>
      </div>
    </div>
  )
}

export function PatternsSection() {
  return (
    <Section
      id="patterns"
      eyebrow="Recipes"
      title="CRUD patterns"
      lead="The components are parts; these are the assemblies merchants actually use. Each pattern is the canonical way to build a create / read / update / delete surface, so list views, forms, and detail pages stay consistent across the product."
    >
      <Subhead>List view</Subhead>
      <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
        Search + filters in a toolbar, selectable rows that reveal a bulk-action
        bar, a per-row overflow menu, and footer pagination — the default index
        surface for any record type.
      </p>
      <ListView />

      <Subhead>Create / edit form</Subhead>
      <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
        Grouped sections with a label/description rail, two-up fields, required
        markers, inline validation, and a sticky footer so Save is always reachable.
      </p>
      <RecordForm />

      <Subhead>Detail view · empty state · delete</Subhead>
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <DetailView />
        <div className="flex flex-col gap-4">
          <EmptyState />
          <DeleteDialog />
        </div>
      </div>
    </Section>
  )
}
