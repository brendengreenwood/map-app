"use client"

import * as React from "react"
import { Search, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Section, Subhead } from "./section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Chip = { id: string; k: string; v: string }

function FilterChip({ chip, onRemove }: { chip: Chip; onRemove: () => void }) {
  return (
    <span className="inline-flex h-[30px] items-center gap-2 rounded-full border bg-secondary py-0 pl-3 pr-1.5 text-[12.5px] font-medium text-secondary-foreground">
      <span className="font-normal text-muted-foreground">{chip.k}:</span> {chip.v}
      <button
        onClick={onRemove}
        className="grid size-[19px] place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
        aria-label={`Remove ${chip.k}`}
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

const statusOpts = [
  ["In transit", 42, true],
  ["On hold", 8, true],
  ["Settled", 61, false],
  ["Rejected", 5, false],
  ["Draft", 12, false],
] as const

const views = [
  ["All loads", 128, true],
  ["Needs attention", 4, false],
  ["In transit", 42, false],
  ["My farms", 31, false],
] as const

export function FiltersSection() {
  const [chips, setChips] = React.useState<Chip[]>([
    { id: "grain", k: "Grain", v: "Corn" },
    { id: "status", k: "Status", v: "In transit, On hold" },
    { id: "date", k: "Delivered", v: "This week" },
  ])

  return (
    <Section
      id="filters"
      eyebrow="Patterns"
      title="Filtering & views"
      lead="Data-heavy screens need fast narrowing. A filter bar to add conditions, removable chips that show what's applied, a multi-select popover, and saved views for the searches merchants run every day."
    >
      <Subhead>Filter bar &amp; applied filters</Subhead>
      <div className="flex flex-col gap-3.5 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex max-w-72 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input placeholder="Search loads…" className="pl-9" />
          </div>
          <Button variant="outline" className="border-dashed text-muted-foreground">
            <Plus /> Add filter
          </Button>
          <div className="flex-1" />
          <Select defaultValue="new">
            <SelectTrigger className="w-auto min-w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Sort: Newest</SelectItem>
              <SelectItem value="old">Sort: Oldest</SelectItem>
              <SelectItem value="bu">Sort: Bushels</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Filters</span>
            {chips.map((c) => (
              <FilterChip key={c.id} chip={c} onRemove={() => setChips((p) => p.filter((x) => x.id !== c.id))} />
            ))}
            <button
              onClick={() => setChips([])}
              className="px-1.5 py-1 text-[12.5px] font-medium text-muted-foreground hover:text-destructive"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <Subhead>Filter popover &amp; saved views</Subhead>
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <div className="flex justify-center rounded-lg border bg-card p-7">
          <div className="w-[234px] overflow-hidden rounded-md border bg-popover shadow-lg">
            <div className="border-b px-3 py-2.5 text-xs font-semibold text-muted-foreground">Status</div>
            <div className="max-h-56 overflow-auto p-1.5">
              {statusOpts.map(([name, count, on]) => (
                <label key={name} className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] hover:bg-muted">
                  <Checkbox defaultChecked={on as boolean} /> {name}
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">{count}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 border-t px-3 py-2.5">
              <Button size="sm" className="flex-1">Apply</Button>
              <Button size="sm" variant="ghost">Clear</Button>
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2.5 font-mono text-xs text-muted-foreground">Saved views</div>
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="flex items-center gap-1 border-b px-1">
              {views.map(([name, count, on]) => (
                <span
                  key={name}
                  className={cn(
                    "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium",
                    on ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground"
                  )}
                >
                  {name}
                  <span className={cn("rounded-full px-1.5 py-px font-mono text-[11px]", on ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground")}>{count}</span>
                </span>
              ))}
              <button className="px-2.5 py-2 text-muted-foreground hover:text-foreground" aria-label="Save view"><Plus className="size-[15px]" /></button>
            </div>
            <div className="p-[18px]">
              <div className="grid min-h-[90px] place-items-center rounded-md border-[1.5px] border-dashed font-mono text-xs text-muted-foreground">
                filtered results
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
