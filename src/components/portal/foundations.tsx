"use client"


import { toast } from "sonner"
import { Section } from "./section"

function copy(token: string) {
  navigator.clipboard?.writeText(token)
  toast.success("Copied", { description: token })
}

const STEPS_11 = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const STEPS_10 = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

function Ramp({
  name,
  role,
  token,
  steps,
}: {
  name: string
  role: string
  token: string
  steps: number[]
}) {
  return (
    <div className="mb-3.5 grid grid-cols-1 items-center gap-3 sm:grid-cols-[132px_1fr] sm:gap-4">
      <div>
        <div className="text-sm font-semibold">{name}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{role}</div>
      </div>
      <div className="flex overflow-hidden rounded-md border">
        {steps.map((st) => (
          <button
            key={st}
            onClick={() => copy(`var(--${token}-${st})`)}
            className={`flex h-14 flex-1 cursor-copy items-end justify-start p-1.5 font-mono text-[10px] font-semibold ${
              st <= 400 ? "text-neutral-800" : "text-white"
            }`}
            style={{ background: `var(--${token}-${st})` }}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  )
}

const viz = [
  ["crop", "Crop green"],
  ["wheat", "Wheat"],
  ["clay", "Clay"],
  ["sky", "Sky"],
  ["plum", "Plum"],
  ["teal", "Teal"],
  ["rust", "Rust"],
  ["slate", "Slate"],
]

const pairs = [
  { name: "Primary", v: "--primary", fg: "--primary-foreground", map: "brand-600 / brand-300" },
  { name: "Secondary", v: "--secondary", fg: "--secondary-foreground", map: "brand-50 / neutral-800" },
  { name: "Accent", v: "--accent", fg: "--accent-foreground", map: "brand-50 / neutral-800" },
  { name: "Destructive", v: "--destructive", fg: "--destructive-foreground", map: "error-500 / error-400" },
]

export function ColorsSection() {
  return (
    <Section
      id="colors"
      eyebrow="Foundations"
      title="Color"
      lead="The palette is built in two layers. Scales are the absolute, mode-independent ink — every shade from 50 to 950, available as bg-brand-500, text-success-700, and so on. Role tokens (primary, background…) point at a scale step and remap per mode."
    >
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Brand & neutral scales
      </h4>
      <div className="rounded-lg border bg-card p-8">
        <Ramp name="Brand" role="green · brand-*" token="brand" steps={STEPS_11} />
        <Ramp name="Neutral" role="green-tinted · neutral-*" token="neutral" steps={STEPS_11} />
      </div>

      <h4 className="mb-4 mt-9 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Notification scales
      </h4>
      <div className="rounded-lg border bg-card p-8">
        <Ramp name="Success" role="emerald · success-*" token="success" steps={STEPS_10} />
        <Ramp name="Warning" role="wheat · warning-*" token="warning" steps={STEPS_10} />
        <Ramp name="Error" role="red · error-*" token="error" steps={STEPS_10} />
        <Ramp name="Info" role="blue · info-*" token="info" steps={STEPS_10} />
      </div>

      <h4 className="mb-4 mt-9 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Data visualization
      </h4>
      <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
        A categorical palette separate from brand and notification colors, so a
        chart series never reads as a status. Each hue is a full 50–950 scale;
        the <code className="font-mono">-light</code> / <code className="font-mono">-dark</code>{" "}
        aliases point at steps 200 / 700.
      </p>
      <div className="rounded-lg border bg-card p-8">
        {viz.map(([k, n]) => (
          <Ramp key={k} name={n} role={`--viz-${k}-*`} token={`viz-${k}`} steps={STEPS_11} />
        ))}
      </div>

      <h4 className="mb-4 mt-9 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Role tokens — semantic pairs
      </h4>
      <div className="grid gap-4 sm:grid-cols-2">
        {pairs.map((p) => (
          <button
            key={p.v}
            onClick={() => copy(`var(${p.v})`)}
            className="flex items-center gap-4 rounded-md border bg-card p-3 text-left transition-shadow hover:shadow-md"
          >
            <div
              className="grid h-11 w-24 place-items-center rounded-sm text-sm font-semibold"
              style={{ background: `var(${p.v})`, color: `var(${p.fg})` }}
            >
              Aa
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="truncate font-mono text-xs text-muted-foreground">
                {p.v} → {p.map}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Section>
  )
}

export function TypographySection() {
  const families = [
    { name: "System sans-serif", role: "--font-sans · UI, body & numbers", cls: "font-sans" },
    { name: "System monospace", role: "--font-mono · Code & data", cls: "font-mono" },
  ]
  const sizes = [
    ["text-2xs", "text-2xs", "11px · 16px · +0.005em", "tracking-[0.005em]"],
    ["text-xs", "text-xs", "12px · 16px", ""],
    ["text-sm", "text-sm", "14px · 20px", ""],
    ["text-base", "text-base", "16px · 24px", ""],
    ["text-lg", "text-lg", "18px · 28px · −0.005em", "tracking-[-0.005em]"],
    ["text-xl", "text-xl", "20px · 28px · −0.01em", "tracking-[-0.01em]"],
    ["text-2xl", "text-2xl", "24px · 32px · −0.015em", "tracking-[-0.015em]"],
    ["text-3xl", "text-3xl", "30px · 36px · −0.02em", "font-semibold tracking-[-0.02em]"],
    ["text-4xl", "text-4xl", "36px · 40px · −0.022em", "font-semibold tracking-[-0.022em]"],
    ["text-5xl", "text-5xl", "48px · 1 · −0.025em", "font-semibold tracking-[-0.025em]"],
    ["text-6xl", "text-6xl", "60px · 1 · −0.03em", "font-semibold tracking-[-0.03em]"],
    ["text-7xl", "text-7xl", "72px · 1 · −0.03em", "font-semibold tracking-[-0.03em]"],
  ] as const
  const styles = [
    ["Display", "text-5xl · 600 · −0.025em", "text-4xl font-semibold tracking-[-0.025em]", "412 loads settled"],
    ["Page title", "text-3xl · 600 · −0.02em", "text-3xl font-semibold tracking-[-0.02em]", "Open contracts"],
    ["Section title", "text-2xl · 600 · −0.015em", "text-2xl font-semibold tracking-[-0.015em]", "Today's cash bids"],
    ["Card title", "text-lg · 600 · −0.01em", "text-lg font-semibold tracking-[-0.01em]", "River terminal"],
    ["Body", "text-base · 400", "text-base leading-relaxed max-w-[52ch]", "Merchants compare local basis, lock a price, and settle the load — all from one screen."],
    ["Body small · default UI", "text-sm · 400", "text-sm leading-relaxed max-w-[54ch]", "The default size for most controls, table cells, and dense layouts."],
    ["Label", "text-sm · 500", "text-sm font-medium", "Delivery window"],
    ["Caption", "text-xs · 400 · muted", "text-xs text-muted-foreground", "Updated 12 minutes ago"],
    ["Overline", "text-2xs · 600 · +0.13em · caps", "text-2xs font-semibold uppercase tracking-[0.13em] text-muted-foreground", "Settlement"],
    ["Numeric", "text-sm · mono · tabular-nums", "font-mono text-sm tabular-nums", "$4.62 / bu   18,400 bu"],
    ["Code", "text-sm · mono", "font-mono text-sm", 'contract.status === "settled"'],
  ] as const
  const weights = [
    ["Regular", "400", "font-normal"],
    ["Medium", "500", "font-medium"],
    ["Semibold", "600", "font-semibold"],
    ["Bold", "700", "font-bold"],
  ] as const
  return (
    <Section
      id="typography"
      eyebrow="Foundations"
      title="Typography"
      lead="No web fonts, by design — the system renders in each OS's native UI typeface (San Francisco, Segoe UI, Roboto), with a monospace stack for code, IDs, and tabular data. Zero network requests, instant paint, native everywhere. The size ramp runs from dense table meta to display."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {families.map((f) => (
          <div key={f.name} className="rounded-lg border bg-card p-6">
            <div className={`${f.cls} text-5xl leading-none tracking-tight`}>Ag</div>
            <div className="mt-3 text-sm text-muted-foreground">
              ABCDEFG abcdefg 0123456789
            </div>
            <div className="mt-4 text-sm font-semibold">{f.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{f.role}</div>
          </div>
        ))}
      </div>

      <h4 className="mb-4 mt-9 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Size scale
      </h4>
      <div className="rounded-lg border bg-card p-8">
        {sizes.map(([token, sizeCls, meta, extra]) => (
          <div
            key={token}
            className="grid grid-cols-[64px_1fr] items-baseline gap-5 border-b py-3 last:border-b-0 sm:grid-cols-[64px_1fr_176px]"
          >
            <div className="font-mono text-xs font-semibold">{token}</div>
            <div className={`truncate ${sizeCls} ${extra}`}>
              Grain pricing &amp; settlement
            </div>
            <div className="hidden text-right font-mono text-[11px] text-muted-foreground sm:block">
              {meta}
            </div>
          </div>
        ))}
      </div>

      <h4 className="mb-4 mt-9 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Semantic text styles
      </h4>
      <div className="rounded-lg border bg-card p-8">
        {styles.map(([name, map, cls, text]) => (
          <div
            key={name}
            className="grid grid-cols-[172px_1fr] items-baseline gap-6 border-b py-4 last:border-b-0"
          >
            <div>
              <div className="text-sm font-semibold">{name}</div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{map}</div>
            </div>
            <div className={cls}>{text}</div>
          </div>
        ))}
      </div>

      <h4 className="mb-4 mt-9 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Weights & numerals
      </h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {weights.map(([name, num, cls]) => (
            <div key={num} className="rounded-md border bg-card p-[18px]">
              <div className={`text-4xl leading-none tracking-tight ${cls}`}>Ag</div>
              <div className="mt-3 text-sm font-semibold">{name}</div>
              <div className="font-mono text-xs text-muted-foreground">{num}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-card p-8">
          <div className="mb-3 text-sm font-semibold">Tabular numerals</div>
          <table className="w-full font-mono text-sm tabular-nums">
            <tbody>
              {[
                ["Corn · river", "$4.62"],
                ["Soybean · north", "$11.08"],
                ["Wheat · rail", "$5.94"],
                ["Open position", "18,400 bu"],
              ].map(([k, v]) => (
                <tr key={k} className="border-b last:border-b-0">
                  <td className="py-1.5">{k}</td>
                  <td className="py-1.5 text-right">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2.5 text-[11px] leading-snug text-muted-foreground">
            Columns align because <span className="font-mono">tabular-nums</span> gives
            every digit the same width.
          </div>
        </div>
      </div>
    </Section>
  )
}

export function SpacingSection() {
  const spacing = [
    ["1", "0.24rem", 4],
    ["2", "0.48rem", 8],
    ["3", "0.72rem", 12],
    ["4", "0.96rem", 16],
    ["6", "1.44rem", 24],
    ["8", "1.92rem", 32],
    ["12", "2.88rem", 48],
    ["16", "3.84rem", 64],
  ] as const
  const radii = [
    ["sm", "rounded-sm", "r − 4px"],
    ["md", "rounded-md", "r − 2px"],
    ["lg", "rounded-lg", "0.5rem"],
    ["full", "rounded-full", "999px"],
  ] as const
  return (
    <Section
      id="spacing"
      eyebrow="Foundations"
      title="Spacing & radius"
      lead="Spacing derives from a --spacing base of 0.24rem; corner radius flows from a single --radius of 0.5rem."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-8">
          <div className="text-sm font-semibold">Spacing scale</div>
          <div className="mb-4 font-mono text-xs text-muted-foreground">
            base --spacing = 0.24rem
          </div>
          {spacing.map(([n, rem, px]) => (
            <div key={n} className="flex items-center gap-4 border-b py-2.5 last:border-b-0">
              <span className="w-8 font-mono text-sm font-semibold">{n}</span>
              <span className="w-24 font-mono text-xs text-muted-foreground">{rem}</span>
              <span className="h-[18px] rounded-sm bg-primary" style={{ width: px }} />
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-card p-8">
          <div className="text-sm font-semibold">Radius scale</div>
          <div className="mb-4 font-mono text-xs text-muted-foreground">
            base --radius = 0.5rem
          </div>
          <div className="grid grid-cols-2 gap-4">
            {radii.map(([name, cls, sub]) => (
              <div key={name} className="rounded-md border bg-card p-4 text-center">
                <div className={`mb-3 h-16 border border-primary bg-primary/15 ${cls}`} />
                <div className="font-mono text-sm font-semibold">{name}</div>
                <div className="font-mono text-xs text-muted-foreground">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

export function ShadowsSection() {
  const shadows = [
    "shadow-2xs",
    "shadow-xs",
    "shadow-sm",
    "shadow",
    "shadow-md",
    "shadow-lg",
    "shadow-xl",
    "shadow-2xl",
  ]
  return (
    <Section
      id="shadows"
      eyebrow="Foundations"
      title="Elevation"
      lead="A restrained, soft shadow ramp. Black at low opacity keeps elevation subtle in light mode and unobtrusive in dark."
    >
      <div className="rounded-lg border bg-card p-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {shadows.map((s) => (
            <div key={s} className="text-center">
              <div className={`mb-3 h-24 rounded-md border bg-card ${s}`} />
              <div className="font-mono text-xs font-semibold">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
