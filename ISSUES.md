# Map App — Issues & Improvements

## Critical

- [x] **No API error handling** — All API calls now use `apiFetch()` wrapper that checks `response.ok` and throws with server error message. Toast notifications on success/failure via `sonner`.
- [x] **XSS in map popups** — Replaced `setHTML()` with `setDOMContent()` using safe DOM text nodes.
- [x] **No input validation on server** — Added `server/validate.ts` with validators for coordinates, strings, arrays. All mutation endpoints validate input; invalid requests return 400 with error details.

## Medium

- [x] **No toast/notification system** — Installed `sonner` via shadcn, Toaster in app root. Toast calls on create/delete in producers and competitors pages.
- [x] **No debouncing on map updates** — `moveend`/`zoomend` now trigger a 150ms debounced `updateClusters`.
- [ ] **Producers & Competitors pages are nearly identical** — Extract shared list/form component from `producers-page.tsx` and `competitors-page.tsx`.
- [x] **Hardcoded API URL** — `src/lib/api.ts` now uses env var with dev/prod fallback.
- [ ] **No database migrations** — Schema changes in `server/db.ts` require manual intervention or DB deletion.
- [x] **Race conditions in useUsers** — Replaced `cancelled` boolean with `AbortController`; fetch is aborted on cleanup. `fetchUsers` now accepts `AbortSignal`.
- [x] **No loading states on buttons** — Delete buttons show spinner + disabled state while in progress. Admin page has toast notifications on assignment changes. Create buttons already had loading states.

## Minor

- [ ] **No pagination UI** — Features query supports `limit`/`offset` but no UI for it.
- [x] **Worker messages lack TypeScript types** — Created `src/worker-types.ts` with `WorkerRequest` and `WorkerResponse` discriminated unions. Both `worker.ts` and `worker-client.ts` now use shared types.
- [ ] **Missing ARIA labels** — Several interactive elements (map controls, popups) lack proper accessibility attributes.
- [ ] **Possible unused dependencies** — `radix-ui` v1.4.3 may be redundant alongside shadcn's radix packages. Verify and remove.
- [x] **Memory leaks in useMap** — Markers now tracked in `markersRef` and removed on cleanup. `map.remove()` already handles event listeners. Debounce timer cleared on unmount.

## Missing Features

- [ ] **Authentication** — No login system; user switching is client-side only. Not production-ready.
- [ ] **Real-time sync** — No WebSocket support; changes don't propagate across tabs/users.
- [ ] **Data export** — No CSV/GeoJSON download for features, producers, or competitors.
- [ ] **Undo/redo** — No transaction history; deleted data is unrecoverable.
- [ ] **Audit logging** — No record of who changed what and when.
- [ ] **Offline support** — No service worker or local caching.
