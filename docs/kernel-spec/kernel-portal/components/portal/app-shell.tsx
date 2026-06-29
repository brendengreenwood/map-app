"use client"

import * as React from "react"
import {
  Kernel,
  Search,
  Plus,
  ChevronRight,
  LayoutDashboard,
  Truck,
  FileText,
  Home,
  Banknote,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Section, Subhead } from "./section"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const sideNav = [
  { label: "Operations", items: [
    { icon: LayoutDashboard, name: "Dashboard", on: true },
    { icon: Truck, name: "Loads" },
    { icon: FileText, name: "Contracts" },
  ]},
  { label: "Records", items: [
    { icon: Home, name: "Farms" },
    { icon: Banknote, name: "Settlements" },
  ]},
]

function PageHeader({
  crumbs,
  title,
  subtitle,
  actions,
  tabs,
  border = true,
}: {
  crumbs?: string[]
  title: string
  subtitle?: string
  actions?: React.ReactNode
  tabs?: string[]
  border?: boolean
}) {
  return (
    <div className={cn("px-6 py-5", border && "border-b")}>
      {crumbs && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {crumbs.map((c, i) => (
            <React.Fragment key={c}>
              {i > 0 && <ChevronRight className="size-3 opacity-50" />}
              <span className={i === crumbs.length - 1 ? "font-medium text-foreground" : ""}>{c}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-start gap-4">
        <div>
          <h3 className="text-[22px] font-semibold tracking-tight">{title}</h3>
          {subtitle && <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div>}
        </div>
        {actions && <div className="ml-auto flex shrink-0 gap-2.5">{actions}</div>}
      </div>
      {tabs && (
        <div className="-mb-5 mt-4 flex gap-1">
          {tabs.map((t, i) => (
            <span
              key={t}
              className={cn(
                "border-b-2 px-3 py-2.5 text-sm font-medium",
                i === 0 ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground"
              )}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function AppShellSection() {
  return (
    <Section
      id="appshell"
      eyebrow="Layout"
      title="App shell & page layout"
      lead="Every screen sits in the same frame: a top bar for global search and account, a left rail for primary navigation, and a page header that names where you are and what you can do."
    >
      <Subhead>Application shell</Subhead>
      <div className="overflow-hidden rounded-lg border bg-card">
        {/* top bar */}
        <div className="flex items-center gap-3 border-b bg-sidebar px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-6 place-items-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
              <Kernel className="size-[15px]" />
            </span>
            Kernel
          </div>
          <div className="flex h-8 max-w-80 flex-1 items-center gap-2 rounded-md border bg-background px-3 text-xs text-muted-foreground">
            <Search className="size-3.5" /> Search loads, farms, contracts…
          </div>
          <div className="flex-1" />
          <Button size="sm" variant="outline"><Plus /> New load</Button>
          <Avatar className="size-7"><AvatarFallback className="text-[11px]">EM</AvatarFallback></Avatar>
        </div>
        {/* body */}
        <div className="grid min-h-80 grid-cols-[184px_1fr]">
          <div className="flex flex-col gap-0.5 border-r bg-sidebar p-2.5">
            {sideNav.map((g) => (
              <React.Fragment key={g.label}>
                <div className="px-2 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{g.label}</div>
                {g.items.map((it) => (
                  <div
                    key={it.name}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium",
                      it.on ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-muted-foreground"
                    )}
                  >
                    <it.icon className="size-[15px]" /> {it.name}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
          <div className="flex min-w-0 flex-col">
            <PageHeader
              crumbs={["Operations", "Loads"]}
              title="Loads"
              subtitle="128 open · 4 need attention"
              actions={<><Button size="sm" variant="outline">Export</Button><Button size="sm"><Plus /> New load</Button></>}
            />
            <div className="flex-1 bg-muted/20 p-5">
              <div className="grid min-h-32 place-items-center rounded-md border-[1.5px] border-dashed font-mono text-xs text-muted-foreground">
                page content region
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2.5 font-mono text-xs text-muted-foreground">
        {[
          ["top bar", "global search · create · account"],
          ["sidebar", "grouped primary nav"],
          ["page header", "breadcrumb · title · actions"],
          ["content", "the screen itself"],
        ].map(([t, d]) => (
          <span key={t} className="inline-flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
            <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-primary">{t}</span> {d}
          </span>
        ))}
      </div>

      <Subhead>Page header</Subhead>
      <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
        The one element every screen shares. Breadcrumb for context, title + subtitle,
        right-aligned actions, and optional tabs for sub-views.
      </p>
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-lg border bg-card">
          <PageHeader
            crumbs={["Operations", "Contracts", "CTR-4471"]}
            title="Contract CTR-4471"
            subtitle="Hartmann Farms · Corn · Jun 2026"
            border={false}
            actions={<><Button size="sm" variant="outline">Edit</Button><Button size="sm">Settle</Button></>}
          />
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <PageHeader
            title="Loads"
            subtitle="All deliveries across your locations"
            border={false}
            actions={<Button size="sm"><Plus /> New load</Button>}
            tabs={["All", "In transit", "Settled", "Needs review"]}
          />
        </div>
      </div>
    </Section>
  )
}
