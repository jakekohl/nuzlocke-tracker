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

Keep the API as **a single Vercel serverless function** (`backend/api/[...path].js`).

- Add new endpoints as internal routes/handlers under `backend/lib/` (e.g. `lib/routes/`).
- Do **not** add additional `backend/api/*.js` entry files unless there is a hard platform reason.
- Public paths stay REST-shaped (`/api/runs`, `/api/auth/me`, etc.); the catch-all dispatches by method + path.

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
