# AGENTS.md

## Cursor Cloud specific instructions

### Overview

ICEMAN Fleet Management is a **Vite + React + TypeScript SPA** using **Supabase** as its backend (PostgreSQL, Auth, Storage, Edge Functions). There is no custom backend server; the entire backend is Supabase-managed.

### Required environment variables

The app requires a `.env` file (or environment variables) with:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous/public API key

Without these, the app will throw `Missing Supabase environment variables` at runtime. The build (`npm run build`) succeeds without them, but the app won't render.

### Package manager

Uses **npm** (lockfile: `package-lock.json`). Install with `npm install`.

### Key commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint (ESLint) | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Preview build | `npm run preview` |

### Known pre-existing issues

- `npm run lint` reports ~185 errors (mostly `@typescript-eslint/no-explicit-any` and unused vars). These are pre-existing in the codebase.
- `npm run typecheck` reports pre-existing type errors related to Supabase type definitions and some missing properties. The build still succeeds because `vite build` does not enforce `tsc` strict checks.

### Supabase

- 126+ SQL migrations live in `supabase/migrations/`.
- Two edge functions exist in `supabase/functions/` (`calculate-distance` and `cleanup-duplicate-documents`). These are optional for core functionality.
- The app uses Supabase Auth for login, so a valid Supabase project with user accounts is needed to test beyond the login page.

### Dev server

Vite dev server runs on port **5173** by default. Use `npm run dev -- --host 0.0.0.0` to expose it on all interfaces in cloud environments.
