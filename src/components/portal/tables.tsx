"use client"

import * as React from "react"
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  BarChart3,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Section, Subhead } from "./section"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge, type Status } from "@/components/ui/status-badge"

/* ---- shared bits ---- */

type Density = "compact" | "default" | "comfortable"
type TStyle = "default" | "striped" | "bordered" | "borderless"

const pad: Record<Density, string> = {
  compact: "px-3 py-1.5",
  default: "px-4 py-3",
  comfortable: "px-[18px] py-[17px]",
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="inline-flex gap-0.5 rounded-md border bg-muted p-[3px]">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-sm px-3.5 py-1.5 text-sm font-medium",
              value === o.value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const headBase =
  "bg-muted/55 text-left text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground whitespace-nowrap"
const numCls = "text-right font-mono tabular-nums whitespace-nowrap"

type Row = { id: string; farm: string; grain: string; status: Status; bu: string; price: string }
const rows: Row[] = [
  { id: "#4471", farm: "Hartmann Farms", grain: "Corn", status: "in_transit", bu: "18,400", price: "4.62" },
  { id: "#4468", farm: "Valley Co-op", grain: "Soybean", status: "settled", bu: "9,120", price: "11.08" },
  { id: "#4465", farm: "Birchwood Grain", grain: "Wheat", status: "on_hold", bu: "12,750", price: "5.94" },
  { id: "#4460", farm: "Hartmann Farms", grain: "Corn", status: "rejected", bu: "0", price: "—" },
]

function Playground() {
  const [density, setDensity] = React.useState<Density>("default")
  const [tstyle, setTStyle] = React.useState<TStyle>("default")
  const p = pad[density]
  const borderless = tstyle === "borderless"
  const bordered = tstyle === "bordered"
  const striped = tstyle === "striped"
  const cell = cn(p, !borderless && "border-b", bordered && "border-r last:border-r-0")
  const head = cn(headBase, p, !borderless && "border-b", bordered && "border-r last:border-r-0")

  return (
    <>
      <div className="mb-3.5 flex flex-wrap items-center gap-4">
        <Segmented
          label="Density"
          value={density}
          onChange={setDensity}
          options={[
            { value: "compact", label: "Compact" },
            { value: "default", label: "Default" },
            { value: "comfortable", label: "Comfortable" },
          ]}
        />
        <Segmented
          label="Style"
          value={tstyle}
          onChange={setTStyle}
          options={[
            { value: "default", label: "Default" },
            { value: "striped", label: "Striped" },
            { value: "bordered", label: "Bordered" },
            { value: "borderless", label: "Borderless" },
          ]}
        />
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-[13.5px]">
            <thead>
              <tr>
                <th className={head}>Load</th>
                <th className={head}>Farm</th>
                <th className={head}>Grain</th>
                <th className={head}>Status</th>
                <th className={cn(head, "text-right")}>Net bu</th>
                <th className={cn(head, "text-right")}>$/bu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={cn("transition-colors hover:bg-muted/40", striped && i % 2 === 1 && "bg-muted/30")}>
                  <td className={cn(cell, "font-mono")}>{r.id}</td>
                  <td className={cell}>{r.farm}</td>
                  <td className={cell}>{r.grain}</td>
                  <td className={cell}><StatusBadge status={r.status as Status} /></td>
                  <td className={cn(cell, numCls)}>{r.bu}</td>
                  <td className={cn(cell, numCls)}>{r.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function CellTypes() {
  const data = [
    { id: "CTR-4471", meta: "Corn · Jun 2026", who: "EM", name: "Ellis Morgan", status: "in_transit" as Status, fill: 72, bu: "18,400", val: "$85,008" },
    { id: "CTR-4468", meta: "Soybean · Jun 2026", who: "SL", name: "Sasha Lin", status: "settled" as Status, fill: 100, bu: "9,120", val: "$101,049" },
    { id: "CTR-4465", meta: "Wheat · Jul 2026", who: "DP", name: "Devon Park", status: "on_hold" as Status, fill: 34, bu: "12,750", val: "$75,735" },
  ]
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-[13.5px]">
          <thead>
            <tr>
              {["Contract", "Merchant", "Status", "Fill", "Bushels", "Value"].map((h, i) => (
                <th key={h} className={cn(headBase, "border-b px-4 py-3", i >= 4 && "text-right")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-muted/40">
                <td className="border-b px-4 py-3">
                  <div className="font-mono font-semibold">{r.id}</div>
                  <div className="text-xs text-muted-foreground">{r.meta}</div>
                </td>
                <td className="border-b px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7"><AvatarFallback className="text-[11px]">{r.who}</AvatarFallback></Avatar>
                    <span>{r.name}</span>
                  </div>
                </td>
                <td className="border-b px-4 py-3"><StatusBadge status={r.status as Status} /></td>
                <td className="border-b px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-1.5 min-w-14 flex-1 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${r.fill}%` }} />
                    </span>
                    <span className="w-9 text-right font-mono text-xs text-muted-foreground">{r.fill}%</span>
                  </div>
                </td>
                <td className={cn("border-b px-4 py-3", numCls)}>{r.bu}</td>
                <td className={cn("border-b px-4 py-3", numCls)}>{r.val}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="border-t-2 bg-muted/45 px-4 py-3 font-medium text-muted-foreground">Total · 3 contracts</td>
              <td className={cn("border-t-2 bg-muted/45 px-4 py-3 font-semibold", numCls)}>40,270</td>
              <td className={cn("border-t-2 bg-muted/45 px-4 py-3 font-semibold", numCls)}>$261,792</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function SortHeader({ label, dir, num }: { label: string; dir?: "asc" | "desc"; num?: boolean }) {
  return (
    <span className={cn("inline-flex cursor-pointer select-none items-center gap-1.5", num && "flex-row-reverse", dir && "text-foreground")}>
      {label}
      {dir === "asc" ? <ChevronUp className="size-3" /> : dir === "desc" ? <ChevronDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-40" />}
    </span>
  )
}

function SortableSticky() {
  const data = [
    ["#4471", "Hartmann Farms", "Jun 7, 2026", "18,400", true],
    ["#4468", "Valley Co-op", "Jun 6, 2026", "9,120", false],
    ["#4465", "Birchwood Grain", "Jun 6, 2026", "12,750", false],
    ["#4460", "Hartmann Farms", "Jun 5, 2026", "14,980", false],
    ["#4452", "Cedar Ridge", "Jun 5, 2026", "7,640", false],
    ["#4448", "Valley Co-op", "Jun 4, 2026", "21,310", false],
    ["#4441", "Birchwood Grain", "Jun 4, 2026", "5,200", false],
  ] as const
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="max-h-[300px] overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-[13.5px]">
          <thead>
            <tr>
              <th className={cn(headBase, "sticky top-0 z-[2] w-0 border-b px-4 py-3 pr-0")}><Checkbox /></th>
              <th className={cn(headBase, "sticky top-0 z-[2] border-b px-4 py-3")}><SortHeader label="Load" /></th>
              <th className={cn(headBase, "sticky top-0 z-[2] border-b px-4 py-3")}>Farm</th>
              <th className={cn(headBase, "sticky top-0 z-[2] border-b px-4 py-3")}><SortHeader label="Delivered" dir="desc" /></th>
              <th className={cn(headBase, "sticky top-0 z-[2] border-b px-4 py-3 text-right")}><SortHeader label="Net bu" num /></th>
            </tr>
          </thead>
          <tbody>
            {data.map(([id, farm, date, bu, sel]) => (
              <tr key={id} className={cn("transition-colors hover:bg-muted/40", sel && "bg-primary/[0.07]")}>
                <td className="border-b px-4 py-3 pr-0"><Checkbox defaultChecked={sel} /></td>
                <td className="border-b px-4 py-3 font-mono">{id}</td>
                <td className="border-b px-4 py-3">{farm}</td>
                <td className="border-b px-4 py-3">{date}</td>
                <td className={cn("border-b px-4 py-3", numCls)}>{bu}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExpandableRows() {
  const data = [
    { id: "#4471", farm: "Hartmann Farms", status: "in_transit" as Status, bu: "18,400", detail: [["Ticket #", "4471"], ["Moisture", "16.2%"], ["Cash price", "$4.62 / bu"], ["Gross / tare", "18,640 / 240"], ["Grade", "No. 2 Yellow"]] },
    { id: "#4468", farm: "Valley Co-op", status: "settled" as Status, bu: "9,120", detail: [["Ticket #", "4468"], ["Moisture", "13.1%"], ["Cash price", "$11.08 / bu"], ["Gross / tare", "9,300 / 180"], ["Grade", "No. 1 Soybean"]] },
  ]
  const [open, setOpen] = React.useState<Set<string>>(new Set(["#4471"]))
  const toggle = (id: string) =>
    setOpen((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-[13.5px]">
          <thead>
            <tr>
              <th className={cn(headBase, "w-0 border-b px-4 py-3")} />
              <th className={cn(headBase, "border-b px-4 py-3")}>Load</th>
              <th className={cn(headBase, "border-b px-4 py-3")}>Farm</th>
              <th className={cn(headBase, "border-b px-4 py-3")}>Status</th>
              <th className={cn(headBase, "border-b px-4 py-3 text-right")}>Net bu</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => {
              const isOpen = open.has(r.id)
              return (
                <React.Fragment key={r.id}>
                  <tr className={cn("transition-colors hover:bg-muted/40", isOpen && "bg-muted/30")}>
                    <td className="border-b px-4 py-3">
                      <button onClick={() => toggle(r.id)} className="grid size-6 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Expand">
                        <ChevronRight className={cn("size-4 transition-transform", isOpen && "rotate-90")} />
                      </button>
                    </td>
                    <td className="border-b px-4 py-3 font-mono">{r.id}</td>
                    <td className="border-b px-4 py-3">{r.farm}</td>
                    <td className="border-b px-4 py-3"><StatusBadge status={r.status as Status} /></td>
                    <td className={cn("border-b px-4 py-3", numCls)}>{r.bu}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={5} className="border-b bg-muted/20 px-0">
                        <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 py-4 pl-[50px] pr-[18px]">
                          {r.detail.map(([k, v]) => (
                            <div key={k}>
                              <dt className="text-[11.5px] text-muted-foreground">{k}</dt>
                              <dd className="mt-0.5 font-mono text-[13.5px]">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StateCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-3.5 py-2.5 text-xs font-semibold text-muted-foreground">{title}</div>
      {children}
    </div>
  )
}

function States() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StateCard title="Loading">
        <table className="w-full text-[13.5px]">
          <tbody>
            {[70, 55, 62, 48].map((w, i) => (
              <tr key={i}>
                <td className="border-b px-4 py-3 last:border-0"><Skeleton className="h-3" style={{ width: `${w}%` }} /></td>
                <td className="border-b px-4 py-3"><Skeleton className="h-3" style={{ width: `${100 - w}%` }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </StateCard>
      <StateCard title="Empty">
        <div className="px-5 py-10 text-center">
          <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
            <BarChart3 className="size-[19px]" />
          </div>
          <div className="text-sm font-semibold">No loads found</div>
          <div className="mt-1 text-xs text-muted-foreground">Try widening your filters.</div>
        </div>
      </StateCard>
      <StateCard title="Error">
        <div className="px-5 py-10 text-center">
          <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-error-100 text-error-600 dark:bg-error-900/45 dark:text-error-300">
            <AlertTriangle className="size-[19px]" />
          </div>
          <div className="text-sm font-semibold">Couldn&apos;t load data</div>
          <div className="mt-1 text-xs text-muted-foreground">Check your connection and retry.</div>
        </div>
      </StateCard>
    </div>
  )
}

export function TablesSection() {
  return (
    <Section
      id="tables"
      eyebrow="Elements"
      title="Table system"
      lead="Tables carry the data in a merchant tool, so they get a system of their own: density modes, style variants, typed cells with correct alignment, sortable headers, selection, sticky headers, totals, and the loading / empty / error states."
    >
      <Subhead>Density &amp; style</Subhead>
      <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
        One base table, two axes. Density sets row height for scannable vs. dense
        screens; style adds zebra striping, full grid borders, or strips rules
        entirely.
      </p>
      <Playground />

      <Subhead>Cell types, alignment &amp; totals</Subhead>
      <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
        Text aligns left; numbers align right in tabular mono so digits stack.
        Cells carry whatever the column needs — IDs, person, status, progress,
        currency — and a footer totals the numeric columns.
      </p>
      <CellTypes />

      <Subhead>Sortable, selectable &amp; sticky header</Subhead>
      <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
        Clickable headers show sort direction; a checkbox column drives
        selection; the header stays pinned while the body scrolls.
      </p>
      <SortableSticky />

      <Subhead>Expandable rows</Subhead>
      <ExpandableRows />

      <Subhead>Loading, empty &amp; error states</Subhead>
      <States />
    </Section>
  )
}
