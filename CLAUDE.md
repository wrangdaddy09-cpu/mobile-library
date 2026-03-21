# Mobile Library App

## Commands
- `pnpm dev` — start dev server
- `pnpm test` — run tests
- `pnpm build` — production build
- `pnpm lint` — run ESLint

## Stack
- Next.js 15 (App Router) + Tailwind CSS
- Supabase (Postgres, Auth, Edge Functions)
- Claude API (Haiku) for book metadata enrichment
- Vitest + React Testing Library for tests

## Architecture
- `src/app/(authenticated)/` — all pages behind auth guard
- `src/lib/hooks/` — data fetching hooks using Supabase client
- `src/lib/supabase/` — Supabase client setup
- `supabase/functions/` — edge functions (AI enrichment, email reminders)
- `__tests__/` — mirrors src/ structure

## Conventions
- All database queries go through hooks in `src/lib/hooks/`
- Supabase client is a singleton from `src/lib/supabase/client.ts`
- Use Tailwind utility classes, no custom CSS files
- TDD: write failing test → implement → verify pass
