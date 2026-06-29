# Kernel — shadcn/ui design system

A production-ready design-system portal for the **Kernel** theme, built on
[shadcn/ui](https://ui.shadcn.com) + Tailwind CSS v4 + Next.js (App Router).

This is **real source** — drop these files into a shadcn project, install the
components below, and the portal at `/` renders the full system: a two-layer
color token set, a 12-step type scale, every component in the registry, the
form-element toolkit (states / sizes / affixes), and the CRUD patterns —
all themed with Kernel tokens in light + dark.

---

## 1. Create the app (skip if you already have one)

```bash
npx create-next-app@latest kernel --typescript --tailwind --app --eslint
cd kernel
npx shadcn@latest init      # choose: New York style, CSS variables: yes
```

## 2. Apply the Kernel theme

This overwrites `app/globals.css` with the token set (or copy ours in manually):

```bash
npx shadcn@latest add https://tweakcn.com/r/themes/cmof9c9uz000204la2vq54eiw
```

> The `app/globals.css` in this folder is the exact output of that command —
> use it as-is if you prefer.

## 3. Install every component used by the portal

```bash
npx shadcn@latest add \
  accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button \
  calendar card carousel chart checkbox collapsible command context-menu \
  dialog drawer dropdown-menu form hover-card input input-otp label menubar \
  navigation-menu pagination popover progress radio-group resizable \
  scroll-area select separator sheet sidebar skeleton slider sonner switch \
  table tabs textarea toggle toggle-group tooltip
```

`combobox`, `data-table`, and `date-picker` are **compositions** (not single
registry items) — the portal builds them from `popover` + `command`,
`table` + `@tanstack/react-table`, and `popover` + `calendar` respectively.

> **Customized components:** `components/ui/alert.tsx` and
> `components/ui/badge.tsx` in this folder *replace* the stock shadcn versions —
> they add first-class `success` / `warning` / `info` variants wired to the
> notification scales (light + dark). Run the CLI `add` first, then overwrite
> those two files with ours.
>
> **New component:** `components/ui/status-badge.tsx` is Kernel-only — a
> `<StatusBadge status="…" />` for the load/contract lifecycle (draft, pending,
> booked, in_transit, delivered, settled, on_hold, rejected, cancelled,
> expired), each on a distinct `--status-*` hue. Use it for *persistent state*;
> use `Badge`/`Alert` variants for *event outcomes*.

```bash
npm i next-themes @tanstack/react-table date-fns recharts
```

## 4. Drop in the portal files

```
app/
  globals.css                  ← Kernel theme tokens (provided)
  layout.tsx                   ← ThemeProvider (provided)
  page.tsx                     ← the portal page (provided)
lib/
  utils.ts                     ← cn() helper (provided)
components/
  theme-provider.tsx
  mode-toggle.tsx
  ui/
    alert.tsx                  ← + success / warning / info variants (replaces stock)
    badge.tsx                  ← + success / warning / info variants (replaces stock)
    status-badge.tsx           ← Kernel-only <StatusBadge> (lifecycle states)
    …                          ← the rest from `npx shadcn add` (button, input, …)
  portal/
    app-sidebar.tsx            ← real shadcn <Sidebar> nav
    foundations.tsx            ← Colors · Typography · Spacing · Elevation
    gallery-forms.tsx          ← Button · Toggle · Inputs · Form · Slider · OTP …
    gallery-data.tsx           ← Card · Table · Data Table · Progress · Skeleton …
    gallery-overlays.tsx       ← Alert · Dialog · Sheet · Drawer · Popover · Sonner …
    gallery-nav.tsx            ← Tabs · Breadcrumb · Pagination · Menubar · Command …
    gallery-misc.tsx           ← Accordion · Calendar · Carousel · Resizable …
    form-elements.tsx          ← Input states · sizes · affixes · file upload …
    tables.tsx                 ← Table system: density · variants · sort · sticky · states
    charts.tsx                 ← shadcn <ChartContainer> (recharts)
    app-shell.tsx              ← App shell + page-header pattern
    dashboard.tsx              ← KPI cards · sparklines · activity feed
    filters.tsx                ← Filter bar · chips · popover · saved views
    patterns.tsx               ← CRUD recipes: list view · form · detail · empty
    flows.tsx                  ← Multi-step wizard · settings page
    section.tsx                ← shared <Section> / <Demo> layout helpers
```

## 5. Fonts

No web fonts. `--font-sans` and `--font-mono` are native system stacks
(San Francisco / Segoe UI / Roboto for UI; the platform monospace for code),
defined in `globals.css`. Nothing to wire in `layout.tsx`, no `next/font`,
no `<link>` tags — zero network requests and instant first paint.

---

## Color system

The palette has two layers, both in `app/globals.css`:

- **Scales** — absolute, mode-independent ink. Every family ships 50→950:
  `--brand-*` (green), `--neutral-*`, plus four notification scales
  `--success-*` (emerald), `--warning-*` (wheat), `--error-*` (red),
  `--info-*` (blue). A separate categorical **data-viz** palette — eight hues
  (`--viz-crop`, `--viz-wheat`, `--viz-clay`, `--viz-sky`, `--viz-plum`,
  `--viz-teal`, `--viz-rust`, `--viz-slate`), **each a full 50→950 scale**, with
  `-light` / `-dark` aliases at steps 200 / 700 — keeps chart series from
  reading as a status.
- **Role tokens** — `--primary`, `--background`, `--destructive`, etc. point at
  a scale step and remap between light and dark (e.g. `--primary` =
  `brand-600` in light, `brand-300` in dark).
- **Status tokens** — `--status-*` for the load/contract lifecycle (`draft`,
  `pending`, `booked`, `intransit`, `delivered`, `settled`, `onhold`,
  `rejected`, `cancelled`, `expired`). Each aliases a distinct hue's 500 step so
  a column of statuses stays scannable; the `<StatusBadge>` derives its soft
  fill from the same hue. Use these for *persistent state*, the notification
  scales for *event outcomes*.

All scales are mapped through `@theme inline`, so Tailwind utilities work
directly: `bg-brand-500`, `text-success-700`, `border-warning-300`,
`fill-viz-sky`, `bg-status-settled`, …

---

## Type scale

Native system stacks — `--font-sans` for the interface, `--font-mono` for code
and tabular data. The size ramp is Tailwind's `text-xs`→`text-7xl` plus one
custom step, `text-2xs` (11px / 16px), defined in `globals.css`. `foundations.tsx`
documents the full ramp, the named semantic styles (Display, Page title, Card
title, Body, Label, Caption, Overline, Numeric, Code), the four weights, and
tabular numerals.

---

## Component coverage (49 / 49)

Accordion · Alert · Alert Dialog · Aspect Ratio · Avatar · Badge · Breadcrumb ·
Button · Calendar · Card · Carousel · Chart · Checkbox · Collapsible · Combobox ·
Command · Context Menu · Data Table · Date Picker · Dialog · Drawer ·
Dropdown Menu · Form · Hover Card · Input · Input OTP · Label · Menubar ·
Navigation Menu · Pagination · Popover · Progress · Radio Group · Resizable ·
Scroll Area · Select · Separator · Sheet · Sidebar · Skeleton · Slider · Sonner ·
Switch · Table · Tabs · Textarea · Toggle · Toggle Group · Tooltip
