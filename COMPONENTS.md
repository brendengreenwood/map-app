# Sprout Design System — Component & Pattern Reference

This document is the single source of truth for building UI in this project. Any coding agent or team member should read this before creating or modifying components.

## Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Icons**: Lucide React (tree-shakeable, no sizing classes needed)
- **Fonts**: HelveticaNowForCargill → Geist Variable → system-ui
- **Storybook**: v10.3 for component docs (run `npm run storybook`)
- **MCP**: `@storybook/addon-mcp` exposes components to agents at `http://localhost:6006/mcp`

## Design Tokens (Sprout)

All colors come from the Sprout design system. Tokens are defined in `src/index.css`.

### Primitive Tokens (never use directly in components)

| Token | Light | Usage |
|---|---|---|
| `--sprout-green-100` | `#eef5e6` | Lightest green tint |
| `--sprout-green-200` | `#8cc63f` | Bright green |
| `--sprout-green-400` | `#2d5016` | Brand primary green |
| `--sprout-green-700` | `#1f3b0f` | Dark green |
| `--sprout-green-900` | `#0b1d04` | Darkest green |
| `--sprout-neutral-100` – `1000` | Grays | Full neutral scale |
| `--sprout-ruby-red-500` | `#a3231e` | Error/destructive |
| `--sprout-sky-blue-500` | `#89cff0` | Info accent |
| `--sprout-bright-yellow-500` | `#c8a516` | Warning accent |
| `--sprout-vibrant-purple-500` | `#7a33d0` | Chart accent |

### Semantic Tokens (use these via Tailwind)

| Tailwind Class | Light Mode | Dark Mode | When to Use |
|---|---|---|---|
| `bg-background` | green-100 | neutral-900 | Page background |
| `bg-card` | white | neutral-1000 | Card/surface background |
| `bg-primary` | green-400 | green-200 | Primary buttons, active states |
| `bg-secondary` | neutral-100 | neutral-700 | Subtle backgrounds |
| `bg-muted` | neutral-100 | neutral-700 | Muted backgrounds |
| `bg-destructive` | ruby-red-500 | ruby-red-100 | Error states, delete buttons |
| `bg-accent` | green-100 | neutral-700 | Hover states, highlights |
| `text-foreground` | neutral-1000 | white | Primary text |
| `text-muted-foreground` | neutral-500 | neutral-400 | Secondary/subdued text |
| `text-primary` | green-400 | green-200 | Brand accent text |
| `text-destructive` | ruby-red-500 | ruby-red-100 | Error text |
| `border-border` | neutral-300 | neutral-700 | Default borders |

### Theme

The app supports light, dark, and system themes. The theme toggle is in the sidebar. Dark mode applies the `.dark` class to `<html>`.

**Rule**: Never use raw color values (hex, rgb, oklch) in components. Always use semantic Tailwind classes like `bg-primary`, `text-muted-foreground`, `border-border`.

## Installed Components

All from shadcn/ui, located in `src/components/ui/`:

| Component | File | Notes |
|---|---|---|
| Avatar | `avatar.tsx` | User avatars with fallback |
| Badge | `badge.tsx` | Variants: default, secondary, destructive, outline |
| Button | `button.tsx` | Variants: default, secondary, destructive, outline, ghost, link. Sizes: default, sm, lg, icon |
| Card | `card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Command | `command.tsx` | Command palette (used in user switcher) |
| Dialog | `dialog.tsx` | Modal dialogs. **Must include DialogTitle and DialogDescription** |
| Field | `field.tsx` | Form field system: FieldSet, FieldGroup, Field, FieldLabel, FieldError |
| Input | `input.tsx` | Text input |
| InputGroup | `input-group.tsx` | Input with prefix/suffix |
| Label | `label.tsx` | Form labels |
| Popover | `popover.tsx` | Floating content |
| ScrollArea | `scroll-area.tsx` | Scrollable container |
| Select | `select.tsx` | Dropdown select |
| Separator | `separator.tsx` | Visual divider |
| Sheet | `sheet.tsx` | Slide-out panel (used for competitor form) |
| Sidebar | `sidebar.tsx` | App navigation sidebar |
| Skeleton | `skeleton.tsx` | Loading placeholder |
| Sonner/Toaster | `sonner.tsx` | Toast notifications |
| Spinner | `spinner.tsx` | Loading spinner (Loader2 icon, animated) |
| Switch | `switch.tsx` | Toggle switch |
| Table | `table.tsx` | Data table: Table, TableHeader, TableHead, TableBody, TableRow, TableCell |
| Textarea | `textarea.tsx` | Multi-line text input |
| Tooltip | `tooltip.tsx` | Hover tooltip |

## Custom Components

| Component | File | Purpose |
|---|---|---|
| PageHeader | `src/components/page-header.tsx` | Page title with icon badge and optional action button |
| AppShell | `src/components/app-shell.tsx` | Layout wrapper with sidebar navigation |
| MapBottomTabs | `src/components/map-bottom-tabs.tsx` | Map overlay with Layers/Search/Data tabs |
| UserSwitcher | `src/components/user-switcher.tsx` | User avatar + popover with user management |
| ProducerFormDialog | `src/pages/producers-page.tsx` | Stepped dialog form (Details → Locations → Review) |
| CompetitorFormDialog | `src/pages/competitors-page.tsx` | Sheet form for adding competitors |
| MapTabBar | `src/components/map-tab-bar.tsx` | Browser-style folder tab bar for map views |

## Patterns & Rules

### Icons in Buttons

Use `data-icon` attribute instead of sizing classes:

```tsx
// ✅ Correct
<Button>
  <Plus data-icon="inline-start" /> Add Item
</Button>
<Button>
  Next <ArrowRight data-icon="inline-end" />
</Button>

// ❌ Wrong — no explicit sizing on icons in buttons
<Button>
  <Plus className="size-4 mr-2" /> Add Item
</Button>
```

### Loading States

Use the `Spinner` component with disabled button:

```tsx
// ✅ Correct
<Button disabled={submitting}>
  {submitting ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
  {submitting ? 'Creating...' : 'Create'}
</Button>

// ❌ Wrong — no manual Loader2 animation
<Button disabled={submitting}>
  <Loader2 className="animate-spin mr-2 size-4" />
</Button>
```

### Forms

Use `FieldGroup` + `Field` for form layouts:

```tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="name">Name</FieldLabel>
    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
  </Field>
  <Field>
    <FieldLabel htmlFor="address">Address</FieldLabel>
    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
  </Field>
</FieldGroup>
```

### Page Layout

Every page inside the AppShell follows this structure:

```tsx
export default function ExamplePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={SomeIcon}
        title="Page Title"
        description="Brief description."
      >
        {/* Optional action button */}
        <Button><Plus data-icon="inline-start" /> Add Item</Button>
      </PageHeader>

      {/* Content: cards, tables, etc. */}
      <Card>
        <CardContent className="p-4">
          <Table>...</Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### MapTabBar

Browser-style folder tab bar for the map view. Supports leading/trailing action slots, closable tabs, and overflow scrolling.

```tsx
import { MapTabBar, type MapTab } from '@/components/map-tab-bar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Map, Layers } from 'lucide-react';

const tabs: MapTab[] = [
  { id: 'main', label: 'Main Map', icon: Map, closable: false },
  { id: 'heatmap', label: 'Heatmap', icon: Layers },
];

<MapTabBar
  tabs={tabs}
  activeTabId="main"
  onTabChange={(id) => setActiveId(id)}
  onTabClose={(id) => removeTab(id)}
  leadingAction={
    <Button variant="ghost" size="icon-sm">
      <ArrowLeft />
    </Button>
  }
  trailingAction={
    <Button variant="ghost" size="icon-sm">
      <Plus />
    </Button>
  }
/>
```

**Props**: `tabs` (MapTab[]), `activeTabId`, `onTabChange`, `onTabClose?`, `leadingAction?`, `trailingAction?`

**MapTab**: `{ id: string, label: string, icon?: LucideIcon, closable?: boolean }`

### Data Tables

Use the Table component inside a Card:

```tsx
<Card>
  <CardContent className="p-4">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium text-sm">{item.name}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.status}</Badge>
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### Commodity Badges

Always use secondary variant with micro text:

```tsx
<div className="flex gap-1">
  {commodities.map((c) => (
    <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">{c}</Badge>
  ))}
</div>
```

### Toast Notifications

Use `sonner` for success/error feedback on mutations:

```tsx
import { toast } from 'sonner';

// On success
toast.success('Producer created');

// On error
toast.error(e instanceof Error ? e.message : 'Failed to create producer');
```

### Dialog vs Sheet

- **Dialog**: Multi-step forms, confirmation prompts. Use for producers (stepped form).
- **Sheet**: Single-step forms, quick entry. Use for competitors, simple CRUD.

Both **must include `DialogTitle`/`SheetTitle`** for accessibility. Dialogs also need `DialogDescription`.

### Spacing

Use `gap` instead of `space-x` / `space-y`:

```tsx
// ✅ Correct
<div className="flex gap-2">

// ❌ Wrong
<div className="flex space-x-2">
```

### Styling

Use `cn()` from `@/lib/utils` for conditional classes:

```tsx
import { cn } from '@/lib/utils';

<div className={cn('text-sm', isActive && 'text-primary font-medium')} />
```

## API Patterns

All API functions are in `src/lib/api.ts`. They use the `apiFetch` wrapper which:
- Checks `response.ok`
- Throws `Error` with server message on failure
- Returns parsed JSON

```tsx
// Fetching data
const { producers } = await fetchProducers();

// Creating
const result = await createProducer({ id, name, commodities, locations });

// Error handling (in components)
try {
  await createProducer(data);
  toast.success('Producer created');
  reload();
} catch (e) {
  toast.error(e instanceof Error ? e.message : 'Operation failed');
}
```

## File Structure

```
src/
├── components/
│   ├── ui/              # shadcn base components (don't modify)
│   ├── app-shell.tsx    # Layout wrapper
│   ├── page-header.tsx  # Reusable page header
│   └── ...
├── hooks/
│   ├── use-map.ts       # MapLibre GL map logic
│   ├── use-users.tsx    # User context + theme
│   └── use-mobile.tsx   # Mobile detection
├── lib/
│   ├── api.ts           # API client functions
│   ├── map-styles.ts    # Sprout-themed map styles
│   └── utils.ts         # cn() helper
├── pages/               # Route pages
├── stories/             # Storybook stories
│   ├── tokens/          # Design token docs
│   ├── components/      # Base component stories
│   └── compositions/    # Custom component stories
└── worker*.ts           # Web worker for data processing
```

## Adding a New Page

1. Create `src/pages/my-page.tsx` following the page layout pattern above
2. Add route in `src/App.tsx` wrapped in `<AppShell>`
3. Add nav item in `src/components/app-shell.tsx` navItems array
4. Add a story in `src/stories/` if the page has reusable patterns
5. Use `PageHeader` with an appropriate Lucide icon

## Adding a New Component

1. For shadcn base components: `npx shadcn@latest add [component]`
2. For custom components: create in `src/components/`
3. Write a story in `src/stories/components/` or `src/stories/compositions/`
4. Follow existing patterns (icons, spacing, colors, loading states)
5. Update this file if the component establishes a new pattern
