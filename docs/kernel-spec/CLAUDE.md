# Kernel design system — project rules

## Keep everything in sync on EVERY change
This project has a preview (`Kernel Design System.html` + `theme.css` + `portal.css` + `portal.js`) AND a real shadcn build (`kernel-portal/`). They must stay mirrored. Whenever we add or change anything, update **all** of the relevant surfaces in the same turn:

When **tokens** change (color scales, status, type, spacing, shadows, radius):
- `theme.css` (preview) **and** `kernel-portal/app/globals.css` (`:root`, `.dark`, and the `@theme inline` map)
- The in-portal **"4 · Tokens — complete reference"** blocks in the Install section of `Kernel Design System.html` (regenerate the full list — it is exhaustive, not an excerpt)
- The **Color**/**Typography** foundation sections in both `Kernel Design System.html` and `kernel-portal/components/portal/foundations.tsx`
- `kernel-portal/README.md` (Color system / Type scale sections)

When a **component, form element, or pattern** is added/changed:
- Preview markup in `Kernel Design System.html` + styles in `portal.css`
- Real build: the matching `kernel-portal/components/portal/*.tsx` (and any `components/ui/*.tsx` customizations)
- Wire into `kernel-portal/app/page.tsx` + the sidebar nav in `app-sidebar.tsx`, and the nav + scrollspy in `Kernel Design System.html`
- `kernel-portal/README.md` (file map, component coverage, customized-components notes)

When **nav sections** change: update the sidebar in both the HTML and `app-sidebar.tsx`.

## Conventions
- No web fonts. `--font-sans` and `--font-mono` are native system stacks only (no Inter, no Roboto Mono, no `next/font`, no `<link>` tags). No serif.
- Statuses = persistent lifecycle state (`--status-*`, `<StatusBadge>`); notifications = momentary event outcome (`success`/`warning`/`info` on `Alert`/`Badge`). Never conflate them.
- Every color family is a full 50→950 scale. New hues follow the same ramp.
- Grids that can sit beside the sidebar use `auto-fit, minmax(...)` (not `1fr`) to avoid page overflow.
- Domain is a grain-buying merchant platform (loads, contracts, farms, bushels, basis, settlement). Keep example copy in that world.
- After changes: `done` → fix console errors → `fork_verifier_agent`.
