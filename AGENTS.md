# AGENTS.md — Nuzlocke Tracker

Guidance for AI agents working in this repository.

## Project layout

- `backend/` — Vercel serverless API + MongoDB (Mongoose)
- `frontend/` — Vue 3 + Pinia + Vue Router + Vite SPA

See `README.md` for local setup and deployment notes.

## Conventions

- Match existing code style and patterns; prefer small, focused diffs.
- Do not drive-by refactor unrelated files.
- Never commit secrets (`.env`, keys, bootstrap secrets). Never log API keys or bootstrap secrets.

## Backend: one serverless function

Keep the API as **a single Vercel serverless function** (`backend/api/index.js`).

- Nested paths are funneled in via `rewrites` in `backend/vercel.json` (filesystem catch-all `[...path]` is Next.js-only on Vercel).
- Add new endpoints as internal routes/handlers under `backend/lib/` (e.g. `lib/routes/`).
- Do **not** add additional `backend/api/*.js` entry files unless there is a hard platform reason.
- Public paths stay REST-shaped (`/api/runs`, `/api/auth/me`, etc.); `lib/router.js` dispatches by method + path.

## Vercel cost constraints

Prefer changes that reduce **Edge Requests**, **Fast Data Transfer**, **function invocations**, and **GB-seconds**. Do not add cost drivers without a clear product need.

### Guardrails (account)

- This project is expected to stay on **Hobby**. Hobby has **no Spend Management / usage alerts** and does not bill for overages — traffic is **soft-capped** (requests may be paused or degraded until the next cycle) instead of generating surprise invoices.
- Still watch usage in the dashboard (**Usage** for `nuzlocke-tracker` and `nuzlocke-api`) after deploys or traffic spikes so you notice soft-cap risk early.
- If you ever upgrade to **Pro**, enable Spend Management / monthly spend alerts immediately — Pro can bill for overages.

### Backend

- Stay at **one** serverless function; do not add Edge Middleware, Image Optimization, or `@vercel/analytics` / Speed Insights unless explicitly requested.
- Keep function `memory` at the lowest proven setting in `backend/vercel.json` (target **≤512 MB**). Do not bump to 1024 without measuring a real OOM/latency need.
- Throttle `touchLastLogin` (see `LAST_LOGIN_TOUCH_TTL_SECONDS`); never write lastLogin on every authenticated request.
- Static catalogs (`/api/pokemon`, `/api/routes`, `/api/games`, `/api/runs/rules`) should keep `Cache-Control: private, max-age=…` via `setCatalogCacheHeaders`.
- Avoid N+1 API fan-out from new UI: prefer session caching and deferred loads over “fetch everything on mount.”

### Frontend

- Keep immutable caching for hashed assets in `frontend/vercel.json` (`/assets/*` → long `max-age` + `immutable`; `index.html` → short / revalidate).
- Use `useCatalogStore` for games / rules / pokemon / routes so navigations reuse session data.
- Do **not** remount all routes via `RouterView :key="fullPath"` (or similar) without a strong reason — it forces remount refetches.
- Defer heavy catalogs (especially pokemon) until the UI needs them (party tab, encounter/evolve dialogs).
- Keep large media (sprites, fonts) off Vercel when an external CDN already works; do not mirror PokeAPI sprites into `public/`.
- Prefer Cypress support commands in `frontend/cypress/support` for flows that wait on deferred catalog fetches (e.g. `openEncounterLog`).

### When adding features

Call out expected impact on invocations / transfer in the PR or commit notes when the change adds polling, prefetch, analytics, middleware, or large static assets.

## Auth model

- Per-user access tokens: client sends `x-api-key`; server stores only a SHA-256 hash (`apiKeyHash`).
- Users are uniquely identified by `email` (and numeric `id`).
- Admin user creation uses `BOOTSTRAP_SECRET` via `x-bootstrap-secret` — plaintext keys are returned once on create/rotate, never stored.

## Testing gate for new features

### Backend

- Add unit tests with Node’s built-in runner (`node --test`) under `backend/lib/__tests__/`.
- Cover new auth helpers, services, and router dispatch for new routes.
- Run: `cd backend && npm test`

### Frontend

- **Unit:** Vitest under `frontend/src/__tests__/` for stores, services, and components.
- **E2E:** Cypress under `frontend/cypress/e2e/` for user-facing flows.
- Prefer Cypress commands in `frontend/cypress/support` (e.g. `getDataTest`, `clickDataTest`) before one-off selectors in specs.
- Run: `cd frontend && npm run test:unit` and `npm run test:e2e` (or `test:e2e:dev`).

## Security checklist

- Protected routes require a valid user API key (or bootstrap secret where documented).
- Do not return `apiKeyHash` or plaintext passwords in API responses.
- Lock `CORS_ORIGINS` to the real frontend origin(s) in production.
