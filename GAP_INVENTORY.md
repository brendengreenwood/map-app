# Gap Inventory — Map App vs Kernel Design System

This catalogs the **map-app-specific compositions** that are not part of the Kernel
design system in `src/components/portal/`. Anything listed here is built on top of
Kernel primitives (Button, Badge, Select, Input, Icon, Popover, Tabs, ScrollArea,
Card-like containers, etc.) but encodes a domain pattern that has no Kernel
equivalent. Each entry calls out the Kernel primitives it composes and the
behavior that makes it scenario-specific.

> Scope: components used by `/map/scenario` (scenario top bar → left rail Market
> Setup / Competitors → map → right rail Producer Selection / Originator
> Assignments). Generic primitives in `src/components/ui/*` are unchanged Kernel
> pieces and not catalogued here.

---

## 1. Layout chrome

### `CollapsibleLeftPanel` / `CollapsibleRightPanel`
Floating, animated side rails with a half-pill drag-handle on their outer edge.
Map-specific because they overlay the map and re-pad MapLibre on toggle.

- Built on: raw layout + `Icon` + `cn` utility.
- Kernel gap: Kernel has `Sidebar` (full-app shell) and `Drawer` (modal), but
  nothing equivalent to a *persistent floating overlay rail with a handle*.

### `MapSelectionTopBar`
Scenario header that sits inside the page (below AppShell chrome): title,
breadcrumbs, subtitle, and trailing actions (`Archive`, `Save & Publish`).

- Built on: `Button`, layout, project router.
- Kernel reference: portal `PageHeader` helper inside `app-shell.tsx`. This is a
  scenario-flavored variant of that pattern.

---

## 2. Market configuration

### `MarketSetupPanel`
Two-column form: Setup (facility, commodity, contract, lookback date) +
Pricing Spread (posted, max, leeway, ¢/mile) + `Map Competitive Zones` action.

- Built on: `Select`, `Input`, `Label`, `Button`, `Section/Subhead` portal helper.
- Kernel gap: domain form. No equivalent in `form-elements.tsx`.

### `ConfigureCompetitorsPanel`
List of competitor elevators with editable posted-bid input per row,
`Stale` / `Edited` status badges, reset button, and a back-arrow header that
returns to Market Setup inside the same rail.

- Built on: `Button`, `Badge` (variants `info`/`warning`), `Input`, `ScrollArea`,
  `Icon`.
- Kernel reference: the list pattern in portal `patterns.tsx` (CRUD list view) +
  inline cell editing. The slide-over inside the rail is map-specific.

### Competitors floating pill
Toggle button anchored at the top of the map, just right of the left rail.
Switches between Market Setup and Competitors slide-over.

- Built on: `Button` (variant `outline` / `default`), `Icon` (`mdiAccountGroupOutline`).
- Kernel gap: positionally unique; not a generic component.

---

## 3. Producer selection (right rail, Producer Selection tab)

### `ProducerSelectionPanel`
Composition root for the producer-selection story. Combines three sub-blocks:

#### `FinalSelectionHeader`
Large final count + tabular sub-counts ("selected by area", "removed by filters").
Uses the Kernel header rhythm: mono eyebrow, semibold title, oversized numeral.

- Built on: typography + `tabular-nums`.
- Kernel reference: header in dashboard KPI cards. Domain numeric breakdown.

#### `PushZoneSection` + `PushZoneRow`
Section with a `Draw push zone` toggle button, baseline row ("All in zone"),
plus per-drawn-zone rows with delete-on-hover and a "+N" delta.

- Built on: `Button`, `Icon`, hover utilities.
- Kernel gap: spatially-driven selection rows — no Kernel pattern.

#### `FilteringSection` + `FilterCard` (registry) + `LastContactFilterCard`
Stackable filter cards with an `Add filter` popover and a per-filter remove
button. Empty state nudges drawing a zone.

- Built on: `Button`, `Icon`, `Popover`, `Select`, `Input`.
- Kernel reference: filter chips in portal `filters.tsx`. This is the
  expanded-card variant for sequential, deltable filters.

---

## 4. Originator assignments (right rail, Originator Assignments tab)

### `OriginatorAssignmentsPanel`
Originator roll-up (per-originator producer count + acres swatched by color)
plus a list of selected producers with per-row reassignment `Select` and
remove-on-hover.

- Built on: `Button`, `Icon`, `Select`, color swatch.
- Kernel reference: list pattern in portal `patterns.tsx`. Color-swatched
  roll-up is domain-specific.

---

## 5. Maps & geometry (non-UI, listed for completeness)

These are not visual components but are imported by the scenario page and
have no Kernel counterpart:

- `useScenarioMap` — unified MapLibre hook (facility + competitor + producer +
  zone layers, padding sync).
- `useMapSelection` — push-zone draw tool, overlay canvas.
- `useScenarioMarket` / `useScenarioSelection` — localStorage persistence.
- `selection-math` — `computeSelection`, `LastContactFilter`, etc.
- `competitive-zones` — grid-based competitive zone calculation.
- `originator-colors` — 15-color palette + `colorByIndex`.

---

## What's NOT in the gap list

- All `src/components/ui/*` primitives (45 Base UI / shadcn components).
- All `src/components/portal/*` galleries (mirror of Kernel).
- AppShell chrome (`src/components/app-shell.tsx`) — already aligned with Kernel
  app-shell pattern.

---

## Notes on conventions

- **No web fonts.** Map app inherits `--font-sans` system stack from Kernel.
- **Status vs notification.** Map app uses `Badge` (variant=`info`/`warning`)
  for event status (`Edited` / `Stale`). `StatusBadge` is reserved for grain
  lifecycle states (draft / pending / booked / in_transit / …) — not used in
  the scenario flow today.
- **Color scales.** Originator colors are domain-specific and live in
  `src/lib/originator-colors.ts` (15-step palette). They intentionally do not
  map to Kernel's brand / neutral / status / viz scales.
- **Spacing rhythm.** Panels use the portal `Section` / `Subhead` pattern:
  mono eyebrow uppercase tracked, semibold title, sub-row in muted text-sm.
