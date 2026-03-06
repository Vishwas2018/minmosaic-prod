# MindMosaic

Online NAPLAN-style practice assessment platform for Australian students (Years 3, 5, 7, 9).

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker (for Supabase local)
- Supabase CLI (`brew install supabase/tap/supabase` or `npm install -g supabase`)

### Setup

```bash
# Install dependencies
pnpm install

# Start Supabase local (Docker must be running)
pnpm db:start

# Copy env template and fill in keys from `supabase status`
cp apps/web/.env.local.example apps/web/.env.local

# Reset DB (creates tables, seeds data)
pnpm db:reset

# Start dev server
pnpm dev
```

App runs at `http://localhost:3000`. Supabase Studio at `http://localhost:54323`.

## Project Structure

```
mindmosaic/
├── apps/web/          # React frontend (Vite + TailwindCSS)
├── packages/shared/   # Shared types, Zod schemas, constants, utilities
├── supabase/
│   ├── migrations/    # SQL migrations (numbered, sequential)
│   ├── functions/     # Edge Functions (Deno)
│   └── seed.sql       # Seed data
└── .github/workflows/ # CI pipeline
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit + integration tests |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | TypeScript check all packages |
| `pnpm db:start` | Start Supabase local |
| `pnpm db:reset` | Reset DB + run migrations + seed |
| `pnpm db:stop` | Stop Supabase local |

## Phase 1 Scope

- Single-stage, non-adaptive exams (MCQ + short_text)
- Authenticated users only (no guest mode)
- Async objective scoring via queue
- Autosave with atomic revision check
- Concurrent attempt limit (max 1 active per user)
- 64KB payload size limits
- Anti-cheat event logging (passive)

See `mindmosaic-spec-v4.html` §19 for full implementation plan.
