# Map App — Agent Instructions

## Storybook MCP Server

When working on UI components, use the Storybook MCP server to access component and documentation knowledge.

**MCP Endpoint**: `http://localhost:6006/mcp` (requires Storybook running via `npm run storybook`)

### Tools Available

- `get_ui_building_instructions` — Get standardized instructions for UI component development
- `get_story_urls` — Get story URLs from your running Storybook

### Workflow

1. Before creating or modifying UI, call `get_ui_building_instructions` to get current conventions
2. After creating a component, create a corresponding story in `src/stories/`
3. Use `get_story_urls` to get links to verify the component visually

### Rules

- **NEVER hallucinate component properties.** Check COMPONENTS.md or the MCP server before using any prop.
- **Always read COMPONENTS.md** before building UI. It contains the design tokens, patterns, and rules.
- **Follow the Sprout design system.** Use semantic Tailwind classes, never raw colors.
- **Every new component needs a story.** Place it in `src/stories/components/` or `src/stories/compositions/`.

## Key Files

- `COMPONENTS.md` — Design system reference (tokens, patterns, rules, file structure)
- `ISSUES.md` — Known issues and improvement backlog
- `src/index.css` — Sprout design tokens (primitives + light/dark semantic mappings)
- `src/lib/api.ts` — All API client functions
- `src/components/ui/` — shadcn base components (don't modify directly)
- `src/components/page-header.tsx` — Reusable page header composition

## Quick Reference

- **Add shadcn component**: `npx shadcn@latest add [component]`
- **Run app**: `npm run dev:all` (Vite + Express)
- **Run storybook**: `npm run storybook` (port 6006)
- **Type check**: `npx tsc -b`
- **Build**: `npx vite build`
