# ArcPredict

A prediction market platform where users browse YES/NO markets, place bets, track their portfolio, and compete on a leaderboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/arcpredict run dev` — run the frontend (port 25941)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec (then immediately fix `lib/api-zod/src/index.ts` to only export `./generated/api`)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, TanStack Query, Wouter, shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `lib/db/src/schema/` — DB schema: `users.ts`, `markets.ts`, `bets.ts`
- `artifacts/api-server/src/routes/` — `markets.ts`, `users.ts`, `health.ts`
- `artifacts/arcpredict/src/pages/` — `home.tsx`, `market-detail.tsx`, `create-market.tsx`, `leaderboard.tsx`, `portfolio.tsx`
- `artifacts/arcpredict/src/components/layout.tsx` — nav + header with user balance

## Architecture decisions

- Dark-only theme; `document.documentElement.classList.add("dark")` forced in App.tsx
- Current user is hardcoded as userId=1 (ArcMaster) — no auth layer
- Market prices shift by a simple delta (amount/1000) on each bet, capped at 0.97/0.03
- Winning payout = amount / price (probability-weighted); balance deducted on bet, restored on win
- Orval codegen overwrites `lib/api-zod/src/index.ts` — always re-save it to only export `./generated/api` after running codegen

## Product

- Browse and filter prediction markets by category and status
- Place YES/NO bets with real-time probability shifts and payout preview
- View market detail with recent bet activity table and live trading panel
- Create new markets with resolution criteria and close dates
- Portfolio view per user: P&L, win rate, open/resolved positions
- Leaderboard ranking traders by balance with win rate bars

## User preferences

- Dark terminal aesthetic (Bloomberg-inspired), monospace fonts, tight layout

## Gotchas

- After codegen, overwrite `lib/api-zod/src/index.ts` to remove the `./generated/types` and `./generated/api.schemas` exports (they don't exist and break the build)
- Orval config no longer generates `schemas` — only the Zod client output

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
