"use client"

import * as React from "react"
import { Check, User, Home, Bell, Users, CreditCard } from "lucide-react"

import { cn } from "@/lib/utils"
import { Section, Subhead } from "./section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type StepState = "done" | "active" | "todo"
const steps: { t: string; d: string; state: StepState }[] = [
  { t: "Supplier", d: "Farm & contact", state: "done" },
  { t: "Grain & pricing", d: "Commodity & basis", state: "done" },
  { t: "Delivery", d: "Window & location", state: "active" },
  { t: "Review", d: "Confirm & sign", state: "todo" },
]

function Stepper() {
  return (
    <div className="flex items-start gap-0 border-b bg-muted/30 px-[26px] py-[22px] max-sm:flex-col max-sm:gap-3.5">
      {steps.map((s, i) => (
        <div key={s.t} className="flex min-w-0 flex-1 items-start gap-3 max-sm:flex-none">
          <div
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] font-mono text-[13px] font-semibold transition-colors",
              s.state === "done" && "border-primary bg-primary text-primary-foreground",
              s.state === "active" && "border-primary bg-primary/12 text-primary",
              s.state === "todo" && "border-border bg-card text-muted-foreground"
            )}
          >
            {s.state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
          </div>
          <div className="pt-[3px] leading-tight">
            <div className={cn("text-[13.5px] font-semibold", s.state === "todo" ? "text-muted-foreground" : "text-foreground")}>{s.t}</div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">{s.d}</div>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("mx-3.5 mt-4 h-px min-w-[18px] flex-1 max-sm:hidden", s.state === "todo" ? "bg-border" : "bg-primary")} />
          )}
        </div>
      ))}
    </div>
  )
}

function Wizard() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Stepper />
      <div className="p-[26px]">
        <div className="text-[17px] font-semibold tracking-tight">Delivery terms</div>
        <div className="mb-[22px] mt-1 max-w-[60ch] text-[13.5px] text-muted-foreground">
          When and where Hartmann Farms delivers the contracted bushels.
        </div>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            <div className="grid gap-1.5">
              <Label>Delivery window start <span className="text-destructive">*</span></Label>
              <Input defaultValue="Sep 1, 2026" />
            </div>
            <div className="grid gap-1.5">
              <Label>Delivery window end <span className="text-destructive">*</span></Label>
              <Input defaultValue="Nov 30, 2026" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            <div className="grid gap-1.5">
              <Label>Destination <span className="text-destructive">*</span></Label>
              <Select defaultValue="dav">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dav">River Terminal — Davenport</SelectItem>
                  <SelectItem value="ames">North Elevator — Ames</SelectItem>
                  <SelectItem value="cr">Processing — Cedar Rapids</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Freight</Label>
              <Select defaultValue="del">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="del">Delivered (seller pays)</SelectItem>
                  <SelectItem value="fob">FOB farm (buyer pays)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="mt-0.5 flex items-center gap-2.5 text-[13.5px]">
            <Checkbox defaultChecked /> Allow partial deliveries against this contract
          </label>
        </div>
      </div>
      <div className="flex items-center border-t bg-muted/40 px-[26px] py-3.5">
        <span className="font-mono text-[12.5px] text-muted-foreground">Step 3 of 4</span>
        <div className="ml-auto flex gap-2.5">
          <Button variant="ghost">Back</Button>
          <Button>Continue</Button>
        </div>
      </div>
    </div>
  )
}

const settingsNav = [
  { label: "Account", items: [
    { icon: User, name: "Profile", on: true },
    { icon: Home, name: "Locations" },
    { icon: Bell, name: "Notifications" },
  ]},
  { label: "Workspace", items: [
    { icon: Users, name: "Team" },
    { icon: CreditCard, name: "Billing" },
  ]},
]

function SettingRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-[22px] border-b py-[18px] last:border-b-0 max-sm:grid-cols-1 max-sm:gap-3">
      <div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="mt-0.5 max-w-[52ch] text-[12.5px] leading-snug text-muted-foreground">{desc}</div>
      </div>
      <div className="flex items-center gap-2.5 justify-self-end max-sm:justify-self-start">{children}</div>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="grid min-h-[360px] grid-cols-[188px_1fr] max-sm:grid-cols-1">
        <nav className="flex flex-col gap-0.5 border-r bg-muted/[0.24] p-3 max-sm:flex-row max-sm:flex-wrap max-sm:border-b max-sm:border-r-0">
          {settingsNav.map((g) => (
            <React.Fragment key={g.label}>
              <div className="px-2.5 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground max-sm:hidden">{g.label}</div>
              {g.items.map((it) => (
                <a
                  key={it.name}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium",
                    it.on ? "bg-secondary font-semibold text-secondary-foreground" : "text-muted-foreground"
                  )}
                >
                  <it.icon className="size-[15px]" /> {it.name}
                </a>
              ))}
            </React.Fragment>
          ))}
        </nav>
        <div className="min-w-0 px-[26px] py-6">
          <h4 className="text-lg font-semibold tracking-tight">Notifications</h4>
          <div className="mt-0.5 text-[13px] text-muted-foreground">Choose what Kernel tells you about, and how.</div>

          <div className="mt-[18px]">
            <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Loads &amp; deliveries</div>
            <SettingRow title="Load status changes" desc="When a load moves to in transit, on hold, or rejected.">
              <Switch defaultChecked />
            </SettingRow>
            <SettingRow title="Grade discounts applied" desc="When moisture or dockage changes a settlement value.">
              <Switch defaultChecked />
            </SettingRow>
          </div>

          <div className="mt-[26px]">
            <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Markets</div>
            <SettingRow title="Basis alerts" desc="Notify me when basis at my locations crosses a threshold.">
              <Select defaultValue="daily">
                <SelectTrigger className="h-[34px] w-auto min-w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="rt">Real-time</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow title="Delivery channel" desc="Where these notifications are sent.">
              <ToggleGroup defaultValue={["email"]} variant="outline" size="sm">
                <ToggleGroupItem value="email">Email</ToggleGroupItem>
                <ToggleGroupItem value="sms">SMS</ToggleGroupItem>
                <ToggleGroupItem value="both">Both</ToggleGroupItem>
              </ToggleGroup>
            </SettingRow>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FlowsSection() {
  return (
    <Section
      id="flows"
      eyebrow="Recipes"
      title="Flows"
      lead="Some tasks span more than one screen. These are the canonical multi-step shapes — a guided wizard for creating something complex, and a settings surface for the dozens of small toggles a merchant manages over time."
    >
      <Subhead>Multi-step wizard</Subhead>
      <p className="-mt-1.5 mb-4 max-w-[62ch] text-[13.5px] text-muted-foreground">
        A numbered stepper that shows progress and lets people jump back, one decision per step,
        and a footer that always says where you are and what comes next. Use for contracts, onboarding, settlement runs.
      </p>
      <Wizard />

      <Subhead>Settings page</Subhead>
      <p className="-mt-1.5 mb-4 max-w-[62ch] text-[13.5px] text-muted-foreground">
        A two-pane surface: section nav on the left, a scroll of labelled rows on the right.
        Each row pairs a name + description with exactly one control. Group related rows under quiet headers.
      </p>
      <SettingsPage />
    </Section>
  )
}
