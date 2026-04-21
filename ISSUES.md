# Map App — Issues & Improvements

## Critical

- [ ] **No API error handling** — `src/lib/api.ts` calls `res.json()` without checking `response.ok`. Network/server errors silently fail.
- [ ] **XSS in map popups** — `src/hooks/use-map.ts` uses `setHTML()` with user-supplied data. Should use `setDOMContent()` with sanitized elements.
- [ ] **No input validation on server** — lng/lat, names, addresses accepted without sanitization in `server/index.ts`.

## Medium

- [ ] **No toast/notification system** — Users get no feedback on success/failure. Install `sonner` (shadcn recommendation).
- [ ] **No debouncing on map updates** — `updateClusters()` fires on every `moveend`/`zoomend` in `use-map.ts`.
- [ ] **Producers & Competitors pages are nearly identical** — Extract shared list/form component from `producers-page.tsx` and `competitors-page.tsx`.
- [ ] **Hardcoded API URL** — `src/lib/api.ts` defaults to `localhost:3001`, no production config.
- [ ] **No database migrations** — Schema changes in `server/db.ts` require manual intervention or DB deletion.
- [ ] **Race conditions in useUsers** — `src/hooks/use-users.tsx` has no `AbortController` on fetch calls; multiple async ops can overlap.
- [ ] **No loading states on buttons** — Admin page and other forms allow interaction during async operations.

## Minor

- [ ] **No pagination UI** — Features query supports `limit`/`offset` but no UI for it.
- [ ] **Worker messages lack TypeScript types** — `src/worker.ts` and `src/worker-client.ts` use string-based message types with no shared type definitions.
- [ ] **Missing ARIA labels** — Several interactive elements (map controls, popups) lack proper accessibility attributes.
- [ ] **Possible unused dependencies** — `radix-ui` v1.4.3 may be redundant alongside shadcn's radix packages. Verify and remove.
- [ ] **Memory leaks in useMap** — Map event listeners and worker message handlers not fully cleaned up on unmount.

## Missing Features

- [ ] **Authentication** — No login system; user switching is client-side only. Not production-ready.
- [ ] **Real-time sync** — No WebSocket support; changes don't propagate across tabs/users.
- [ ] **Data export** — No CSV/GeoJSON download for features, producers, or competitors.
- [ ] **Undo/redo** — No transaction history; deleted data is unrecoverable.
- [ ] **Audit logging** — No record of who changed what and when.
- [ ] **Offline support** — No service worker or local caching.
