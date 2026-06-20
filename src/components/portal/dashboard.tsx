"use client"

import * as React from "react"
import { Truck, FileText, Banknote, TrendingUp, TrendingDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Section, Subhead } from "./section"
import { type Status } from "@/components/ui/status-badge"

function Spark({ points, color }: { points: string; color: string }) {
  return (
    <svg className="h-8 w-20 shrink-0 overflow-visible" viewBox="0 0 80 32" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

function Delta({ dir, children }: { dir: "up" | "down"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full py-0.5 pl-1.5 pr-2 font-mono text-[11.5px] font-semibold",
        dir === "up"
          ? "bg-success-100 text-success-700 dark:bg-success-900/45 dark:text-success-300"
          : "bg-error-100 text-error-700 dark:bg-error-900/45 dark:text-error-300"
      )}
    >
      {dir === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {children}
    </span>
  )
}

type Kpi = {
  label: string
  icon: React.ElementType
  value: string
  dir: "up" | "down"
  delta: string
  points: string
  color: string
}

const kpis: Kpi[] = [
  { label: "Bushels received", icon: Truck, value: "482k", dir: "up", delta: "+8.2%", points: "0,26 11,22 22,24 33,16 44,18 55,11 66,13 80,6", color: "var(--viz-crop)" },
  { label: "Open contracts", icon: FileText, value: "128", dir: "up", delta: "+3.1%", points: "0,20 11,18 22,21 33,15 44,17 55,14 66,12 80,9", color: "var(--viz-sky)" },
  { label: "Avg basis", icon: Banknote, value: "−0.12", dir: "down", delta: "−0.04", points: "0,10 11,12 22,11 33,15 44,14 55,18 66,17 80,22", color: "var(--viz-clay)" },
  { label: "Settlement value", icon: Banknote, value: "$2.41M", dir: "up", delta: "+12.4%", points: "0,28 11,24 22,25 33,18 44,16 55,12 66,10 80,5", color: "var(--viz-crop)" },
]

const feed: { id: string; what: string; who: string; num: string; status: Status }[] = [
  { id: "#4468", what: "settled", who: "Valley Co-op · 12m ago", num: "$101,049", status: "settled" },
  { id: "#4471", what: "in transit", who: "Hartmann Farms · 38m ago", num: "18,400 bu", status: "in_transit" },
  { id: "#4465", what: "on hold", who: "Birchwood · 1h ago", num: "12,750 bu", status: "on_hold" },
  { id: "#4460", what: "rejected", who: "Hartmann Farms · 2h ago", num: "—", status: "rejected" },
]

const bars = [
  [58, "var(--viz-crop)"], [80, "var(--viz-wheat)"],
  [90, "var(--viz-crop)"], [62, "var(--viz-wheat)"],
  [106, "var(--viz-crop)"], [76, "var(--viz-wheat)"],
  [50, "var(--viz-crop)"], [34, "var(--viz-wheat)"],
] as const

export function DashboardSection() {
  return (
    <Section
      id="dashboard"
      eyebrow="Patterns"
      title="Dashboard"
      lead="The screen merchants open to. KPI cards carry a number, its trend against the prior period, and a sparkline for shape; below, a primary chart sits beside a live activity feed."
    >
      <Subhead>KPI cards</Subhead>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border bg-card p-[18px] shadow-xs">
            <div className="flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground">
              <k.icon className="size-[15px]" /> {k.label}
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="text-[27px] font-semibold leading-none tracking-tight tabular-nums">{k.value}</div>
              <Spark points={k.points} color={k.color} />
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
              <Delta dir={k.dir}>{k.delta}</Delta> vs. last week
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 md:grid-cols-[1.6fr_1fr]">
        <div className="rounded-lg border bg-card p-[22px] shadow-xs">
          <div className="text-sm font-semibold">Receipts by grain</div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">Last 7 days · thousand bushels</div>
          <svg className="mt-4 w-full" viewBox="0 0 320 180" role="img" aria-label="Bar chart">
            <line x1="20" y1="150" x2="312" y2="150" stroke="var(--border)" />
            {bars.map(([h, c], i) => (
              <rect key={i} x={34 + i * 30} y={150 - (h as number)} width={i === 7 ? 20 : 26} height={h as number} rx={3} fill={c as string} />
            ))}
          </svg>
          <div className="mt-4 flex gap-3.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2.5 rounded-[3px]" style={{ background: "var(--viz-crop)" }} /> Corn</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2.5 rounded-[3px]" style={{ background: "var(--viz-wheat)" }} /> Soybean</div>
          </div>
        </div>
        <div className="rounded-lg border bg-card">
          <div className="border-b px-[18px] py-3.5 text-sm font-semibold">Recent activity</div>
          {feed.map((f) => (
            <div key={f.id} className="flex gap-3 border-b px-[18px] py-3.5 last:border-b-0">
              <span className="mt-[5px] size-2 shrink-0 rounded-full" style={{ background: `var(--status-${f.status.replace("_", "")})` }} />
              <div>
                <div className="text-[13px]"><b className="font-semibold">{f.id}</b> {f.what}</div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">{f.who}</div>
              </div>
              <span className="ml-auto whitespace-nowrap font-mono text-[12.5px] font-semibold">{f.num}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
