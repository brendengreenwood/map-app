"use client"

import * as React from "react"
import {
  Search,
  Calendar,
  Copy,
  Eye,
  EyeOff,
  Minus,
  Plus,
  UploadCloud,
  FileText,
  X,
  Info,
  AlertCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Section, Subhead, Demo } from "./section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/* ---- small composition helpers (build on ui/* primitives) ---- */

function Field({
  label,
  required,
  optional,
  hint,
  error,
  success,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  hint?: string
  error?: string
  success?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label>
        {label}
        {required && <span className="text-destructive">*</span>}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5" /> {error}
        </p>
      ) : success ? (
        <p className="flex items-center gap-1.5 text-xs text-success-600 dark:text-success-400">
          {success}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** Input group — flush affixes/add-ons. Children are Affix | Input | <select> | Button. */
function InputGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-stretch [&>*]:rounded-none [&>*:focus-visible]:z-10",
        "[&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md",
        "[&>input]:border-l-0 [&>input:first-child]:border-l [&_+_*]:border-l-0",
        className
      )}
    >
      {children}
    </div>
  )
}

function Affix({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap border border-input bg-muted px-3 text-sm text-muted-foreground",
        mono && "font-mono"
      )}
    >
      {children}
    </span>
  )
}

function NumberStepper({ defaultValue = 12 }: { defaultValue?: number }) {
  const [n, setN] = React.useState(defaultValue)
  return (
    <div className="inline-flex items-stretch">
      <Button variant="outline" size="icon" className="rounded-r-none border-r-0" onClick={() => setN((v) => Math.max(0, v - 1))}>
        <Minus />
      </Button>
      <Input
        value={n}
        onChange={(e) => setN(Number(e.target.value) || 0)}
        className="w-20 rounded-none text-center font-mono"
      />
      <Button variant="outline" size="icon" className="rounded-l-none border-l-0" onClick={() => setN((v) => v + 1)}>
        <Plus />
      </Button>
    </div>
  )
}

function PasswordInput() {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative flex items-center">
      <Input type={show ? "text" : "password"} defaultValue="grainco2026" className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 grid size-7 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

function CharCountTextarea() {
  const [v, setV] = React.useState("Light dockage, no foreign material.")
  return (
    <div className="relative">
      <Textarea value={v} onChange={(e) => setV(e.target.value)} maxLength={280} className="min-h-[74px] pb-6" />
      <span className="absolute bottom-2 right-2.5 font-mono text-[11px] text-muted-foreground">
        {v.length} / 280
      </span>
    </div>
  )
}

function Dropzone() {
  return (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-[1.5px] border-dashed bg-muted p-6 text-center transition-colors hover:border-ring hover:bg-primary/[0.06]">
      <span className="grid size-10 place-items-center rounded-full border bg-card">
        <UploadCloud className="size-[18px] text-muted-foreground" />
      </span>
      <span className="text-sm font-medium">
        <span className="text-primary">Click to upload</span> or drag &amp; drop
      </span>
      <span className="text-xs text-muted-foreground">
        Scale tickets &amp; grade sheets — PDF, PNG up to 10MB
      </span>
      <input type="file" className="sr-only" />
    </label>
  )
}

function FileChip({ name, size }: { name: string; size: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2.5">
      <FileText className="size-[17px] shrink-0 text-muted-foreground" />
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-[11px] text-muted-foreground">{size}</div>
      </div>
      <button className="ml-auto grid size-6 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Remove">
        <X className="size-4" />
      </button>
    </div>
  )
}

function Segmented() {
  const [v, setV] = React.useState("Day")
  return (
    <div className="inline-flex gap-0.5 rounded-md border bg-muted p-[3px]">
      {["Day", "Week", "Month"].map((o) => (
        <button
          key={o}
          onClick={() => setV(o)}
          className={cn(
            "rounded-sm px-3.5 py-1.5 text-sm font-medium",
            v === o ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function FormElementsSection() {
  return (
    <Section
      id="forms"
      eyebrow="Elements"
      title="Form elements"
      lead="Data entry is most of an internal tool, so inputs carry the load. This is the full toolkit — every field state, the size steps, unit and currency affixes for pricing, and the specialized controls merchants reach for daily."
    >
      <Subhead>Field anatomy</Subhead>
      <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
        Every field is the same parts: label (with required/optional marker), an
        optional description, the control, and a single message slot that shows a
        hint or an error — never both.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <Demo className="block">
          <Field label="Cash price" required hint="Posted price before basis adjustment." error="Price must be above the floor of $4.50.">
            <InputGroup>
              <Affix mono>$</Affix>
              <Input defaultValue="4.62" />
              <Affix mono>/bu</Affix>
            </InputGroup>
          </Field>
        </Demo>
        <Demo className="flex-col items-stretch gap-3.5">
          <Field label="Label" required hint="Description / helper text.">
            <Input placeholder="Control" />
          </Field>
          <Field label="Label" optional>
            <Input placeholder="Control" />
          </Field>
          <Field label="With tooltip">
            <Input placeholder="Control" />
          </Field>
        </Demo>
      </div>

      <Subhead>Input states</Subhead>
      <Demo>
        <div className="grid w-full gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            ["default", <Input key="d" placeholder="Empty field" />],
            ["focus", <Input key="f" defaultValue="Focused" className="border-ring ring-[3px] ring-ring/30" />],
            ["filled", <Input key="fi" defaultValue="Hartmann Farms" />],
            ["disabled", <Input key="di" defaultValue="Locked" disabled />],
            ["read-only", <Input key="r" defaultValue="#4471" readOnly className="bg-muted text-muted-foreground" />],
            ["error", <Input key="e" defaultValue="16.2" aria-invalid />],
            ["success", <Input key="s" defaultValue="14.1" className="border-success-500 focus-visible:ring-success-500/30" />],
            ["placeholder", <Input key="p" placeholder="Search tickets…" />],
          ].map(([label, el]) => (
            <div key={label as string}>
              <div className="mb-1.5 font-mono text-[11px] text-muted-foreground">{label as string}</div>
              {el as React.ReactNode}
            </div>
          ))}
        </div>
      </Demo>

      <Subhead>Sizes</Subhead>
      <Demo className="gap-6">
        <div className="grid gap-1.5">
          <div className="font-mono text-[11px] text-muted-foreground">sm · h-8</div>
          <Input defaultValue="Compact" className="h-8 text-xs" />
        </div>
        <div className="grid gap-1.5">
          <div className="font-mono text-[11px] text-muted-foreground">default · h-9</div>
          <Input defaultValue="Default" />
        </div>
        <div className="grid gap-1.5">
          <div className="font-mono text-[11px] text-muted-foreground">lg · h-11</div>
          <Input defaultValue="Large" className="h-11 text-base" />
        </div>
      </Demo>

      <Subhead>Affixes &amp; add-ons</Subhead>
      <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
        Prefixes, suffixes, unit selectors, and trailing buttons — how pricing,
        weights, and codes get entered without ambiguity.
      </p>
      <Demo>
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Price">
            <InputGroup>
              <Affix mono>$</Affix>
              <Input defaultValue="4.62" />
              <Affix mono>/bu</Affix>
            </InputGroup>
          </Field>
          <Field label="Net weight">
            <InputGroup>
              <Input defaultValue="18,400" />
              <Affix>bu</Affix>
            </InputGroup>
          </Field>
          <Field label="Quantity">
            <InputGroup>
              <Input defaultValue="640" />
              <Select defaultValue="bu">
                <SelectTrigger className="w-24 rounded-l-none border-l-0 bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bu">bu</SelectItem>
                  <SelectItem value="cwt">cwt</SelectItem>
                  <SelectItem value="tons">tons</SelectItem>
                </SelectContent>
              </Select>
            </InputGroup>
          </Field>
          <Field label="Search">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <Input placeholder="Find a load…" className="pl-9" />
            </div>
          </Field>
          <Field label="Contract ID">
            <InputGroup>
              <Input defaultValue="CTR-4471" readOnly className="font-mono" />
              <Button variant="outline" size="icon"><Copy /></Button>
            </InputGroup>
          </Field>
          <Field label="Delivery date">
            <div className="relative flex items-center">
              <Calendar className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
              <Input defaultValue="Jun 7, 2026" className="pr-9" />
            </div>
          </Field>
        </div>
      </Demo>

      <Subhead>Specialized inputs</Subhead>
      <Demo>
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Quantity stepper"><NumberStepper /></Field>
          <Field label="Password"><PasswordInput /></Field>
          <Field label="Amount">
            <InputGroup>
              <Affix mono>$</Affix>
              <Input defaultValue="84,608.00" className="font-mono" />
            </InputGroup>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Grading notes"><CharCountTextarea /></Field>
          </div>
          <Field label="Sort">
            <Select defaultValue="new">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Newest first</SelectItem>
                <SelectItem value="old">Oldest first</SelectItem>
                <SelectItem value="price">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Demo>

      <Subhead>File upload</Subhead>
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <Dropzone />
        <div className="flex flex-col gap-2.5">
          <div className="font-mono text-xs text-muted-foreground">Uploaded</div>
          <FileChip name="scale-ticket-4471.pdf" size="248 KB" />
          <FileChip name="grade-sheet.png" size="1.1 MB" />
        </div>
      </div>

      <Subhead>Selection controls — states</Subhead>
      <div className="grid gap-4 sm:grid-cols-3">
        <Demo className="flex-col items-start gap-3">
          <div className="font-mono text-xs text-muted-foreground">Checkbox</div>
          <Label className="flex items-center gap-2 font-normal"><Checkbox /> Unchecked</Label>
          <Label className="flex items-center gap-2 font-normal"><Checkbox defaultChecked /> Checked</Label>
          <Label className="flex items-center gap-2 font-normal"><Checkbox checked="indeterminate" /> Indeterminate</Label>
          <Label className="flex items-center gap-2 font-normal opacity-60"><Checkbox disabled /> Disabled</Label>
          <Label className="flex items-center gap-2 font-normal opacity-60"><Checkbox defaultChecked disabled /> Disabled checked</Label>
        </Demo>
        <Demo className="flex-col items-start gap-3">
          <div className="font-mono text-xs text-muted-foreground">Radio</div>
          <RadioGroup defaultValue="b" className="gap-3">
            <Label className="flex items-center gap-2 font-normal"><RadioGroupItem value="a" /> Unselected</Label>
            <Label className="flex items-center gap-2 font-normal"><RadioGroupItem value="b" /> Selected</Label>
          </RadioGroup>
          <Label className="flex items-center gap-2 font-normal opacity-60"><RadioGroupItem value="c" disabled /> Disabled</Label>
        </Demo>
        <Demo className="flex-col items-start gap-3">
          <div className="font-mono text-xs text-muted-foreground">Switch &amp; segmented</div>
          <Label className="flex items-center gap-2 font-normal"><Switch /> Off</Label>
          <Label className="flex items-center gap-2 font-normal"><Switch defaultChecked /> On</Label>
          <Label className="flex items-center gap-2 font-normal opacity-60"><Switch defaultChecked disabled /> Disabled</Label>
          <Segmented />
        </Demo>
      </div>
    </Section>
  )
}
