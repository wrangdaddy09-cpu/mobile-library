# Mobile Library App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PWA for tracking book checkouts from a mobile library, with AI-enriched catalogue, checkout management, and email reminders.

**Architecture:** Next.js App Router with Supabase for database, auth, and edge functions. All pages behind auth guard. Bottom tab navigation. Client-side search over locally cached book data. Claude API (Haiku) enriches book metadata via Supabase Edge Functions.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Supabase (Postgres + Auth + Edge Functions), Claude API (Haiku), Vitest + React Testing Library, next-pwa, Vercel.

**Spec:** `docs/superpowers/specs/2026-03-21-mobile-library-app-design.md`

---

## File Structure

```
mobile-library/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (fonts, metadata)
│   │   ├── login/
│   │   │   └── page.tsx                  # Login page
│   │   └── (authenticated)/
│   │       ├── layout.tsx                # Auth guard + bottom nav
│   │       ├── dashboard/
│   │       │   └── page.tsx              # Dashboard with stats + due soon list
│   │       ├── catalogue/
│   │       │   ├── page.tsx              # Book list with search + add
│   │       │   └── [id]/
│   │       │       └── page.tsx          # Book detail, edit, delete, checkout
│   │       ├── checkouts/
│   │       │   └── page.tsx              # Active checkouts + return + history
│   │       └── settings/
│   │           └── page.tsx              # Schools, CSV import, staff, config
│   ├── components/
│   │   ├── bottom-nav.tsx                # Tab bar (Home, Catalogue, Checkouts, Settings)
│   │   ├── stat-card.tsx                 # Dashboard stat card
│   │   ├── book-card.tsx                 # Book list item with availability badge
│   │   ├── checkout-row.tsx              # Checkout list item with return button
│   │   ├── confirm-dialog.tsx            # Reusable confirmation modal
│   │   └── search-input.tsx              # Search bar component
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser Supabase client (singleton)
│   │   │   ├── server.ts                 # Server-side Supabase client
│   │   │   └── types.ts                  # Generated DB types
│   │   ├── hooks/
│   │   │   ├── use-books.ts              # Fetch/mutate books
│   │   │   ├── use-checkouts.ts          # Fetch/mutate checkouts
│   │   │   ├── use-schools.ts            # Fetch/mutate schools
│   │   │   └── use-settings.ts           # Fetch/mutate app_settings
│   │   ├── csv.ts                        # CSV parsing + validation
│   │   └── search.ts                     # Client-side search across book fields
│   └── middleware.ts                     # Next.js middleware for auth redirect
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql        # All tables, RLS, triggers
│   └── functions/
│       ├── enrich-book/
│       │   └── index.ts                  # Claude API enrichment edge function
│       └── send-reminders/
│           └── index.ts                  # Daily email reminder edge function
├── __tests__/
│   ├── lib/
│   │   ├── csv.test.ts                   # CSV parsing tests
│   │   └── search.test.ts               # Search logic tests
│   ├── components/
│   │   ├── book-card.test.tsx            # Book card rendering tests
│   │   ├── checkout-row.test.tsx         # Checkout row rendering tests
│   │   └── confirm-dialog.test.tsx       # Confirm dialog tests
│   └── hooks/                            # Hook tests (add as needed)
├── public/
│   ├── manifest.json                     # PWA manifest
│   └── icons/                            # PWA icons
├── next.config.ts
├── vitest.config.ts
├── .env.local.example
└── CLAUDE.md
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `tailwind.config.ts`, `.env.local.example`, `CLAUDE.md`, `src/app/layout.tsx`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /c/Users/wrang/mobile-library
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --skip-install
```

Accept overwrite prompts (we only have docs/ and .gitignore).

- [ ] **Step 2: Install dependencies**

```bash
pnpm install
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

Add to `scripts` in `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create .env.local.example**

Create `.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

- [ ] **Step 6: Create CLAUDE.md**

Create `CLAUDE.md`:
```markdown
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
```

- [ ] **Step 7: Verify setup**

```bash
pnpm build
pnpm test
```

Both should succeed (build produces Next.js output, tests find no test files but exit cleanly).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, Supabase deps, Vitest"
```

---

## Task 2: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- Books table
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  total_copies int not null default 1,
  publisher text,
  year_published int,
  genres text[] default '{}',
  themes text[] default '{}',
  description text,
  ai_enriched boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger books_updated_at
  before update on public.books
  for each row execute function public.update_updated_at();

-- App settings (single row)
create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  reminder_email text not null,
  loan_duration_days int not null default 28
);

-- Insert default settings row
insert into public.app_settings (reminder_email) values ('changeme@example.com');

-- Schools table
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  archived boolean default false
);

-- Checkouts table
create table public.checkouts (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  borrower_first_name text not null,
  borrower_surname_initial text not null,
  school_id uuid not null references public.schools(id),
  checked_out_at timestamptz default now(),
  due_at timestamptz not null,
  returned_at timestamptz,
  reminder_sent boolean default false,
  overdue_alert_sent boolean default false
);

-- Indexes
create index idx_checkouts_book_id on public.checkouts(book_id);
create index idx_checkouts_due_at on public.checkouts(due_at) where returned_at is null;
create index idx_checkouts_school_id on public.checkouts(school_id);
create index idx_books_title_author on public.books(lower(title), lower(author));

-- Row Level Security
alter table public.books enable row level security;
alter table public.schools enable row level security;
alter table public.checkouts enable row level security;
alter table public.app_settings enable row level security;

-- Policies: authenticated users can do everything
create policy "Authenticated users full access" on public.books
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users full access" on public.schools
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users full access" on public.checkouts
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users full access" on public.app_settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

- [ ] **Step 2: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema migration with RLS policies"
```

**Note for executor:** This migration will be applied to Supabase either via `supabase db push` (if using Supabase CLI) or by pasting into the Supabase Dashboard SQL Editor. The user will need to set up their Supabase project and configure `.env.local` before running the app.

---

## Task 3: Supabase Client + Auth Middleware

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/types.ts`, `src/middleware.ts`

- [ ] **Step 1: Create Supabase browser client**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create Supabase server client**

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create database types placeholder**

Create `src/lib/supabase/types.ts`:
```typescript
export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          title: string;
          author: string;
          total_copies: number;
          publisher: string | null;
          year_published: number | null;
          genres: string[];
          themes: string[];
          description: string | null;
          ai_enriched: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          author: string;
          total_copies?: number;
          publisher?: string | null;
          year_published?: number | null;
          genres?: string[];
          themes?: string[];
          description?: string | null;
          ai_enriched?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["books"]["Insert"]>;
      };
      schools: {
        Row: {
          id: string;
          name: string;
          archived: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          archived?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["schools"]["Insert"]>;
      };
      checkouts: {
        Row: {
          id: string;
          book_id: string;
          borrower_first_name: string;
          borrower_surname_initial: string;
          school_id: string;
          checked_out_at: string;
          due_at: string;
          returned_at: string | null;
          reminder_sent: boolean;
          overdue_alert_sent: boolean;
        };
        Insert: {
          id?: string;
          book_id: string;
          borrower_first_name: string;
          borrower_surname_initial: string;
          school_id: string;
          checked_out_at?: string;
          due_at: string;
          returned_at?: string | null;
          reminder_sent?: boolean;
          overdue_alert_sent?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["checkouts"]["Insert"]>;
      };
      app_settings: {
        Row: {
          id: string;
          reminder_email: string;
          loan_duration_days: number;
        };
        Insert: {
          id?: string;
          reminder_email: string;
          loan_duration_days?: number;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
      };
    };
  };
};

export type Book = Database["public"]["Tables"]["books"]["Row"];
export type School = Database["public"]["Tables"]["schools"]["Row"];
export type Checkout = Database["public"]["Tables"]["checkouts"]["Row"];
export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];
```

- [ ] **Step 4: Create auth middleware**

Create `src/middleware.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts
git commit -m "feat: add Supabase client setup and auth middleware"
```

---

## Task 4: Login Page

**Files:**
- Create: `src/app/login/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout**

Replace `src/app/layout.tsx` with:
```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mobile Library",
  description: "Track book checkouts for your mobile library",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create login page**

Create `src/app/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Mobile Library</h1>
          <p className="text-slate-400 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-slate-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-slate-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Delete default page.tsx**

Remove `src/app/page.tsx` — the middleware redirects `/` to `/login` or `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "feat: add login page with Supabase auth"
```

---

## Task 5: Authenticated Layout + Bottom Navigation

**Files:**
- Create: `src/app/(authenticated)/layout.tsx`, `src/components/bottom-nav.tsx`

- [ ] **Step 1: Write test for BottomNav**

Create `__tests__/components/bottom-nav.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/bottom-nav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("BottomNav", () => {
  it("renders all four navigation tabs", () => {
    render(<BottomNav />);
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Catalogue")).toBeDefined();
    expect(screen.getByText("Checkouts")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- __tests__/components/bottom-nav.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create BottomNav component**

Create `src/components/bottom-nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/catalogue", label: "Catalogue", icon: "book" },
  { href: "/checkouts", label: "Checkouts", icon: "clipboard" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

const icons: Record<string, (active: boolean) => React.ReactNode> = {
  home: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  ),
  book: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  clipboard: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`}>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  ),
  settings: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`}>
      <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 safe-area-bottom z-50">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              {icons[tab.icon](active)}
              <span className={`text-xs ${active ? "text-blue-400 font-medium" : "text-slate-500"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- __tests__/components/bottom-nav.test.tsx
```

Expected: PASS

- [ ] **Step 5: Create authenticated layout**

Create `src/app/(authenticated)/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="pb-16">
      <main className="max-w-lg mx-auto px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 6: Create placeholder pages**

Create `src/app/(authenticated)/dashboard/page.tsx`:
```tsx
export default function DashboardPage() {
  return <h1 className="text-xl font-bold">Dashboard</h1>;
}
```

Create `src/app/(authenticated)/catalogue/page.tsx`:
```tsx
export default function CataloguePage() {
  return <h1 className="text-xl font-bold">Catalogue</h1>;
}
```

Create `src/app/(authenticated)/checkouts/page.tsx`:
```tsx
export default function CheckoutsPage() {
  return <h1 className="text-xl font-bold">Checkouts</h1>;
}
```

Create `src/app/(authenticated)/settings/page.tsx`:
```tsx
export default function SettingsPage() {
  return <h1 className="text-xl font-bold">Settings</h1>;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/ __tests__/
git commit -m "feat: add authenticated layout with bottom navigation"
```

---

## Task 6: Data Hooks

**Files:**
- Create: `src/lib/hooks/use-books.ts`, `src/lib/hooks/use-checkouts.ts`, `src/lib/hooks/use-schools.ts`, `src/lib/hooks/use-settings.ts`

- [ ] **Step 1: Create useBooks hook**

Create `src/lib/hooks/use-books.ts`:
```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Book } from "@/lib/supabase/types";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("title");
    if (!error && data) setBooks(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  async function addBook(book: { title: string; author: string; total_copies?: number }) {
    const { data, error } = await supabase
      .from("books")
      .insert(book)
      .select()
      .single();
    if (!error && data) {
      setBooks((prev) => [...prev, data].sort((a, b) => a.title.localeCompare(b.title)));
    }
    return { data, error };
  }

  async function updateBook(id: string, updates: Partial<Book>) {
    const { data, error } = await supabase
      .from("books")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setBooks((prev) => prev.map((b) => (b.id === id ? data : b)));
    }
    return { data, error };
  }

  async function deleteBook(id: string) {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (!error) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
    return { error };
  }

  return { books, loading, fetchBooks, addBook, updateBook, deleteBook };
}
```

- [ ] **Step 2: Create useCheckouts hook**

Create `src/lib/hooks/use-checkouts.ts`:
```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Checkout } from "@/lib/supabase/types";

export type CheckoutWithDetails = Checkout & {
  books: { title: string; author: string } | null;
  schools: { name: string } | null;
};

export function useCheckouts(options?: { bookId?: string; activeOnly?: boolean }) {
  const [checkouts, setCheckouts] = useState<CheckoutWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCheckouts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("checkouts")
      .select("*, books(title, author), schools(name)")
      .order("due_at", { ascending: true });

    if (options?.bookId) {
      query = query.eq("book_id", options.bookId);
    }
    if (options?.activeOnly) {
      query = query.is("returned_at", null);
    }

    const { data, error } = await query;
    if (!error && data) setCheckouts(data as CheckoutWithDetails[]);
    setLoading(false);
  }, [supabase, options?.bookId, options?.activeOnly]);

  useEffect(() => {
    fetchCheckouts();
  }, [fetchCheckouts]);

  async function checkoutBook(checkout: {
    book_id: string;
    borrower_first_name: string;
    borrower_surname_initial: string;
    school_id: string;
    due_at: string;
  }) {
    const { data, error } = await supabase
      .from("checkouts")
      .insert(checkout)
      .select("*, books(title, author), schools(name)")
      .single();
    if (!error && data) {
      setCheckouts((prev) => [...prev, data as CheckoutWithDetails]);
    }
    return { data, error };
  }

  async function returnBook(checkoutId: string) {
    const { data, error } = await supabase
      .from("checkouts")
      .update({ returned_at: new Date().toISOString() })
      .eq("id", checkoutId)
      .select("*, books(title, author), schools(name)")
      .single();
    if (!error && data) {
      setCheckouts((prev) =>
        prev.map((c) => (c.id === checkoutId ? (data as CheckoutWithDetails) : c))
      );
    }
    return { data, error };
  }

  return { checkouts, loading, fetchCheckouts, checkoutBook, returnBook };
}
```

- [ ] **Step 3: Create useSchools hook**

Create `src/lib/hooks/use-schools.ts`:
```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { School } from "@/lib/supabase/types";

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("archived", false)
      .order("name");
    if (!error && data) setSchools(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  async function addSchool(name: string) {
    const { data, error } = await supabase
      .from("schools")
      .insert({ name })
      .select()
      .single();
    if (!error && data) {
      setSchools((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
    return { data, error };
  }

  async function updateSchool(id: string, name: string) {
    const { data, error } = await supabase
      .from("schools")
      .update({ name })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setSchools((prev) => prev.map((s) => (s.id === id ? data : s)));
    }
    return { data, error };
  }

  async function archiveSchool(id: string) {
    const { error } = await supabase
      .from("schools")
      .update({ archived: true })
      .eq("id", id);
    if (!error) {
      setSchools((prev) => prev.filter((s) => s.id !== id));
    }
    return { error };
  }

  return { schools, loading, fetchSchools, addSchool, updateSchool, archiveSchool };
}
```

- [ ] **Step 4: Create useSettings hook**

Create `src/lib/hooks/use-settings.ts`:
```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppSettings } from "@/lib/supabase/types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .single();
    if (!error && data) setSettings(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function updateSettings(updates: Partial<AppSettings>) {
    if (!settings) return { error: new Error("No settings loaded") };
    const { data, error } = await supabase
      .from("app_settings")
      .update(updates)
      .eq("id", settings.id)
      .select()
      .single();
    if (!error && data) setSettings(data);
    return { data, error };
  }

  return { settings, loading, fetchSettings, updateSettings };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/
git commit -m "feat: add data hooks for books, checkouts, schools, settings"
```

---

## Task 7: Search Logic + CSV Parser

**Files:**
- Create: `src/lib/search.ts`, `src/lib/csv.ts`
- Test: `__tests__/lib/search.test.ts`, `__tests__/lib/csv.test.ts`

- [ ] **Step 1: Write search tests**

Create `__tests__/lib/search.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { searchBooks } from "@/lib/search";
import type { Book } from "@/lib/supabase/types";

const mockBooks: Book[] = [
  {
    id: "1", title: "The Great Gatsby", author: "F. Scott Fitzgerald",
    total_copies: 1, publisher: "Scribner", year_published: 1925,
    genres: ["Fiction", "Classic"], themes: ["American Dream", "Wealth"],
    description: "A story of decadence", ai_enriched: true,
    created_at: "", updated_at: "",
  },
  {
    id: "2", title: "1984", author: "George Orwell",
    total_copies: 2, publisher: "Secker & Warburg", year_published: 1949,
    genres: ["Dystopian", "Sci-Fi"], themes: ["Surveillance", "Freedom"],
    description: "A totalitarian future", ai_enriched: true,
    created_at: "", updated_at: "",
  },
];

describe("searchBooks", () => {
  it("returns all books for empty query", () => {
    expect(searchBooks(mockBooks, "")).toEqual(mockBooks);
  });

  it("matches by title", () => {
    const results = searchBooks(mockBooks, "gatsby");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
  });

  it("matches by author", () => {
    const results = searchBooks(mockBooks, "orwell");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("2");
  });

  it("matches by genre", () => {
    const results = searchBooks(mockBooks, "sci-fi");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("2");
  });

  it("matches by theme", () => {
    const results = searchBooks(mockBooks, "wealth");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
  });

  it("is case-insensitive", () => {
    expect(searchBooks(mockBooks, "GATSBY")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- __tests__/lib/search.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement search**

Create `src/lib/search.ts`:
```typescript
import type { Book } from "@/lib/supabase/types";

export function searchBooks(books: Book[], query: string): Book[] {
  if (!query.trim()) return books;

  const q = query.toLowerCase();
  return books.filter((book) => {
    const fields = [
      book.title,
      book.author,
      book.publisher,
      ...(book.genres || []),
      ...(book.themes || []),
    ];
    return fields.some((field) => field?.toLowerCase().includes(q));
  });
}
```

- [ ] **Step 4: Run search test to verify it passes**

```bash
pnpm test -- __tests__/lib/search.test.ts
```

Expected: PASS

- [ ] **Step 5: Write CSV tests**

Create `__tests__/lib/csv.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseBooksCsv } from "@/lib/csv";

describe("parseBooksCsv", () => {
  it("parses valid CSV with all columns", () => {
    const csv = "title,author,copies\nThe Great Gatsby,F. Scott Fitzgerald,1\n1984,George Orwell,2";
    const result = parseBooksCsv(csv);
    expect(result.books).toHaveLength(2);
    expect(result.books[0]).toEqual({ title: "The Great Gatsby", author: "F. Scott Fitzgerald", total_copies: 1 });
    expect(result.books[1]).toEqual({ title: "1984", author: "George Orwell", total_copies: 2 });
    expect(result.errors).toHaveLength(0);
  });

  it("defaults copies to 1 when missing", () => {
    const csv = "title,author\nThe Great Gatsby,F. Scott Fitzgerald";
    const result = parseBooksCsv(csv);
    expect(result.books[0].total_copies).toBe(1);
  });

  it("reports errors for rows missing title", () => {
    const csv = "title,author,copies\n,F. Scott Fitzgerald,1";
    const result = parseBooksCsv(csv);
    expect(result.books).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Row 2");
  });

  it("trims whitespace from values", () => {
    const csv = "title,author,copies\n  The Great Gatsby  , F. Scott Fitzgerald ,1";
    const result = parseBooksCsv(csv);
    expect(result.books[0].title).toBe("The Great Gatsby");
    expect(result.books[0].author).toBe("F. Scott Fitzgerald");
  });

  it("skips empty rows", () => {
    const csv = "title,author,copies\nThe Great Gatsby,F. Scott Fitzgerald,1\n\n1984,George Orwell,2";
    const result = parseBooksCsv(csv);
    expect(result.books).toHaveLength(2);
  });
});
```

- [ ] **Step 6: Run CSV test to verify it fails**

```bash
pnpm test -- __tests__/lib/csv.test.ts
```

Expected: FAIL

- [ ] **Step 7: Implement CSV parser**

Create `src/lib/csv.ts`:
```typescript
type ParsedBook = {
  title: string;
  author: string;
  total_copies: number;
};

type ParseResult = {
  books: ParsedBook[];
  errors: string[];
};

export function parseBooksCsv(csvText: string): ParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  const books: ParsedBook[] = [];
  const errors: string[] = [];

  if (lines.length === 0) return { books, errors: ["CSV file is empty"] };

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const titleIdx = header.indexOf("title");
  const authorIdx = header.indexOf("author");
  const copiesIdx = header.indexOf("copies");

  if (titleIdx === -1 || authorIdx === -1) {
    return { books, errors: ["CSV must have 'title' and 'author' columns"] };
  }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const title = values[titleIdx] || "";
    const author = values[authorIdx] || "";
    const copies = copiesIdx !== -1 ? parseInt(values[copiesIdx], 10) : 1;

    if (!title) {
      errors.push(`Row ${i + 1}: missing title`);
      continue;
    }
    if (!author) {
      errors.push(`Row ${i + 1}: missing author`);
      continue;
    }

    books.push({
      title,
      author,
      total_copies: isNaN(copies) || copies < 1 ? 1 : copies,
    });
  }

  return { books, errors };
}
```

- [ ] **Step 8: Run CSV test to verify it passes**

```bash
pnpm test -- __tests__/lib/csv.test.ts
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/search.ts src/lib/csv.ts __tests__/lib/
git commit -m "feat: add client-side book search and CSV parser with tests"
```

---

## Task 8: Shared Components

**Files:**
- Create: `src/components/stat-card.tsx`, `src/components/book-card.tsx`, `src/components/checkout-row.tsx`, `src/components/confirm-dialog.tsx`, `src/components/search-input.tsx`

- [ ] **Step 1: Write confirm dialog test**

Create `__tests__/components/confirm-dialog.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "@/components/confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders title and message when open", () => {
    render(
      <ConfirmDialog open title="Confirm" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(screen.getByText("Confirm")).toBeDefined();
    expect(screen.getByText("Are you sure?")).toBeDefined();
  });

  it("does not render when closed", () => {
    render(
      <ConfirmDialog open={false} title="Confirm" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(screen.queryByText("Confirm")).toBeNull();
  });

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="Confirm" message="Are you sure?" onConfirm={onConfirm} onCancel={() => {}} />
    );
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button clicked", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="Confirm" message="Are you sure?" onConfirm={() => {}} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- __tests__/components/confirm-dialog.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Write book-card and checkout-row tests**

Create `__tests__/components/book-card.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookCard } from "@/components/book-card";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("BookCard", () => {
  it("renders title and author", () => {
    render(<BookCard id="1" title="1984" author="George Orwell" available={2} total={2} />);
    expect(screen.getByText("1984")).toBeDefined();
    expect(screen.getByText("George Orwell")).toBeDefined();
  });

  it("shows availability badge", () => {
    render(<BookCard id="1" title="1984" author="George Orwell" available={1} total={2} />);
    expect(screen.getByText("1/2")).toBeDefined();
  });

  it("links to book detail page", () => {
    render(<BookCard id="abc-123" title="1984" author="George Orwell" available={2} total={2} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/catalogue/abc-123");
  });
});
```

Create `__tests__/components/checkout-row.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckoutRow } from "@/components/checkout-row";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("CheckoutRow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows OVERDUE badge when past due date", () => {
    render(
      <CheckoutRow bookTitle="1984" borrowerName="Sarah" borrowerInitial="L"
        schoolName="Greenwood" dueAt="2026-03-19T00:00:00Z" returnedAt={null} />
    );
    expect(screen.getByText("OVERDUE")).toBeDefined();
  });

  it("shows DUE IN Xd badge when within 3 days", () => {
    render(
      <CheckoutRow bookTitle="1984" borrowerName="Sarah" borrowerInitial="L"
        schoolName="Greenwood" dueAt="2026-03-23T00:00:00Z" returnedAt={null} />
    );
    expect(screen.getByText("DUE IN 2d")).toBeDefined();
  });

  it("shows Returned when returned_at is set", () => {
    render(
      <CheckoutRow bookTitle="1984" borrowerName="Sarah" borrowerInitial="L"
        schoolName="Greenwood" dueAt="2026-04-01T00:00:00Z" returnedAt="2026-03-20T00:00:00Z" />
    );
    expect(screen.getByText("Returned")).toBeDefined();
  });

  it("shows Return button for active checkouts", () => {
    const onReturn = vi.fn();
    render(
      <CheckoutRow bookTitle="1984" borrowerName="Sarah" borrowerInitial="L"
        schoolName="Greenwood" dueAt="2026-04-18T00:00:00Z" returnedAt={null} onReturn={onReturn} />
    );
    expect(screen.getByText("Return")).toBeDefined();
  });
});
```

- [ ] **Step 4: Run new tests to verify they fail**

```bash
pnpm test -- __tests__/components/book-card.test.tsx __tests__/components/checkout-row.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 5: Create all shared components**

Create `src/components/confirm-dialog.tsx`:
```tsx
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-slate-800 border border-slate-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-slate-400">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            {confirmLabel || title}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/stat-card.tsx`:
```tsx
interface StatCardProps {
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "red";
}

const colorMap = {
  blue: "text-blue-400",
  green: "text-emerald-400",
  yellow: "text-amber-400",
  red: "text-red-400",
};

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
      <div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
      <div className="text-slate-500 text-sm mt-1">{label}</div>
    </div>
  );
}
```

Create `src/components/book-card.tsx`:
```tsx
import Link from "next/link";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  available: number;
  total: number;
}

export function BookCard({ id, title, author, available, total }: BookCardProps) {
  const badgeColor = available === 0 ? "bg-red-500" : available < total ? "bg-amber-500 text-black" : "bg-emerald-500";

  return (
    <Link href={`/catalogue/${id}`} className="block bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-slate-500 text-sm">{author}</div>
        </div>
        <span className={`${badgeColor} text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap`}>
          {available}/{total}
        </span>
      </div>
    </Link>
  );
}
```

Create `src/components/checkout-row.tsx`:
```tsx
import Link from "next/link";

interface CheckoutRowProps {
  bookTitle: string;
  borrowerName: string;
  borrowerInitial: string;
  schoolName: string;
  dueAt: string;
  returnedAt: string | null;
  onReturn?: () => void;
  bookId?: string;
}

export function CheckoutRow({ bookTitle, borrowerName, borrowerInitial, schoolName, dueAt, returnedAt, onReturn, bookId }: CheckoutRowProps) {
  const now = new Date();
  const due = new Date(dueAt);
  const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let statusBadge: React.ReactNode = null;
  if (returnedAt) {
    statusBadge = <span className="text-xs text-slate-500">Returned</span>;
  } else if (daysUntilDue < 0) {
    statusBadge = <span className="text-xs font-semibold text-red-400">OVERDUE</span>;
  } else if (daysUntilDue <= 3) {
    statusBadge = <span className="text-xs font-semibold text-amber-400">DUE IN {daysUntilDue}d</span>;
  } else {
    statusBadge = <span className="text-xs text-slate-500">Due {due.toLocaleDateString()}</span>;
  }

  const content = (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{bookTitle}</div>
          <div className="text-slate-500 text-sm">{borrowerName} {borrowerInitial}. — {schoolName}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {statusBadge}
          {!returnedAt && onReturn && (
            <button onClick={onReturn} className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 hover:bg-slate-700">
              Return
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (bookId) {
    return <Link href={`/catalogue/${bookId}`}>{content}</Link>;
  }
  return content;
}
```

Create `src/components/search-input.tsx`:
```tsx
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
    />
  );
}
```

- [ ] **Step 6: Run all component tests**

```bash
pnpm test -- __tests__/components/
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/ __tests__/components/
git commit -m "feat: add shared UI components (stat card, book card, checkout row, confirm dialog, search)"
```

---

## Task 9: Dashboard Page

**Files:**
- Modify: `src/app/(authenticated)/dashboard/page.tsx`

- [ ] **Step 1: Implement dashboard**

Replace `src/app/(authenticated)/dashboard/page.tsx`:
```tsx
"use client";

import { useMemo } from "react";
import { useBooks } from "@/lib/hooks/use-books";
import { useCheckouts, type CheckoutWithDetails } from "@/lib/hooks/use-checkouts";
import { StatCard } from "@/components/stat-card";
import { CheckoutRow } from "@/components/checkout-row";

export default function DashboardPage() {
  const { books } = useBooks();
  const { checkouts } = useCheckouts({ activeOnly: true });

  const stats = useMemo(() => {
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const dueSoon = checkouts.filter((c) => {
      const due = new Date(c.due_at);
      const diff = due.getTime() - now.getTime();
      return diff > 0 && diff <= threeDays;
    });
    const overdue = checkouts.filter((c) => new Date(c.due_at) < now);

    return {
      totalBooks: books.length,
      checkedOut: checkouts.length,
      dueSoon: dueSoon.length,
      overdue: overdue.length,
    };
  }, [books, checkouts]);

  const urgentCheckouts = useMemo(() => {
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return checkouts
      .filter((c) => {
        const due = new Date(c.due_at);
        return due.getTime() - now.getTime() <= threeDays;
      })
      .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  }, [checkouts]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Books" value={stats.totalBooks} color="blue" />
        <StatCard label="Checked Out" value={stats.checkedOut} color="green" />
        <StatCard label="Due Soon" value={stats.dueSoon} color="yellow" />
        <StatCard label="Overdue" value={stats.overdue} color="red" />
      </div>

      {urgentCheckouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Due Soon & Overdue</h2>
          {urgentCheckouts.map((c) => (
            <CheckoutRow
              key={c.id}
              bookId={c.book_id}
              bookTitle={c.books?.title ?? "Unknown"}
              borrowerName={c.borrower_first_name}
              borrowerInitial={c.borrower_surname_initial}
              schoolName={c.schools?.name ?? "Unknown"}
              dueAt={c.due_at}
              returnedAt={c.returned_at}
            />
          ))}
        </div>
      )}

      {urgentCheckouts.length === 0 && checkouts.length > 0 && (
        <p className="text-slate-500 text-center py-8">All books are on schedule.</p>
      )}

      {checkouts.length === 0 && (
        <p className="text-slate-500 text-center py-8">No books currently checked out.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(authenticated\)/dashboard/
git commit -m "feat: implement dashboard with stats cards and due soon list"
```

---

## Task 10: Catalogue Page + Add Book

**Files:**
- Modify: `src/app/(authenticated)/catalogue/page.tsx`

- [ ] **Step 1: Implement catalogue page**

Replace `src/app/(authenticated)/catalogue/page.tsx`:
```tsx
"use client";

import { useState, useMemo } from "react";
import { useBooks } from "@/lib/hooks/use-books";
import { useCheckouts } from "@/lib/hooks/use-checkouts";
import { searchBooks } from "@/lib/search";
import { BookCard } from "@/components/book-card";
import { SearchInput } from "@/components/search-input";

export default function CataloguePage() {
  const { books, addBook } = useBooks();
  const { checkouts } = useCheckouts({ activeOnly: true });
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCopies, setNewCopies] = useState("1");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => searchBooks(books, query), [books, query]);

  const availabilityMap = useMemo(() => {
    const map: Record<string, number> = {};
    checkouts.forEach((c) => {
      if (!c.returned_at) {
        map[c.book_id] = (map[c.book_id] || 0) + 1;
      }
    });
    return map;
  }, [checkouts]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    const { error } = await addBook({
      title: newTitle.trim(),
      author: newAuthor.trim(),
      total_copies: parseInt(newCopies) || 1,
    });
    setAdding(false);
    if (error) {
      setAddError(error.message);
      return;
    }
    setNewTitle("");
    setNewAuthor("");
    setNewCopies("1");
    setShowAdd(false);
    // AI enrichment is triggered by the edge function (database webhook or manual call)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Catalogue</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700"
        >
          + Add Book
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          {addError && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-2 text-sm">{addError}</div>
          )}
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Book title"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="Author"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="number"
            value={newCopies}
            onChange={(e) => setNewCopies(e.target.value)}
            min="1"
            placeholder="Copies"
            className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" disabled={adding} className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
            {adding ? "Adding..." : "Add Book"}
          </button>
        </form>
      )}

      <SearchInput value={query} onChange={setQuery} placeholder="Search by title, author, genre, theme..." />

      <div className="space-y-2">
        {filtered.map((book) => (
          <BookCard
            key={book.id}
            id={book.id}
            title={book.title}
            author={book.author}
            available={book.total_copies - (availabilityMap[book.id] || 0)}
            total={book.total_copies}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-slate-500 text-center py-8">
            {query ? "No books match your search." : "No books in the catalogue yet."}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(authenticated\)/catalogue/page.tsx
git commit -m "feat: implement catalogue page with search and add book form"
```

---

## Task 11: Book Detail Page (View, Edit, Delete, Checkout)

**Files:**
- Create: `src/app/(authenticated)/catalogue/[id]/page.tsx`

- [ ] **Step 1: Implement book detail page**

Create `src/app/(authenticated)/catalogue/[id]/page.tsx`:
```tsx
"use client";

import { useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { useBooks } from "@/lib/hooks/use-books";
import { useCheckouts } from "@/lib/hooks/use-checkouts";
import { useSchools } from "@/lib/hooks/use-schools";
import { useSettings } from "@/lib/hooks/use-settings";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CheckoutRow } from "@/components/checkout-row";

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { books, updateBook, deleteBook } = useBooks();
  const { checkouts, checkoutBook, returnBook } = useCheckouts({ bookId: id });
  const { schools } = useSchools();
  const { settings } = useSettings();

  const book = books.find((b) => b.id === id);
  const activeCheckouts = checkouts.filter((c) => !c.returned_at);
  const available = book ? book.total_copies - activeCheckouts.length : 0;

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCopies, setEditCopies] = useState("");

  const [showCheckout, setShowCheckout] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [surnameInitial, setSurnameInitial] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [showReturnId, setShowReturnId] = useState<string | null>(null);

  const loanDays = settings?.loan_duration_days ?? 28;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + loanDays);

  function startEdit() {
    if (!book) return;
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditCopies(String(book.total_copies));
    setEditing(true);
  }

  async function handleSaveEdit() {
    await updateBook(id, {
      title: editTitle.trim(),
      author: editAuthor.trim(),
      total_copies: parseInt(editCopies) || 1,
    });
    setEditing(false);
  }

  async function handleDelete() {
    await deleteBook(id);
    router.push("/catalogue");
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setCheckingOut(true);
    await checkoutBook({
      book_id: id,
      borrower_first_name: firstName.trim(),
      borrower_surname_initial: surnameInitial.trim().toUpperCase(),
      school_id: schoolId,
      due_at: dueDate.toISOString(),
    });
    setCheckingOut(false);
    setFirstName("");
    setSurnameInitial("");
    setSchoolId("");
    setShowCheckout(false);
  }

  async function handleReturn() {
    if (showReturnId) {
      await returnBook(showReturnId);
      setShowReturnId(null);
    }
  }

  if (!book) {
    return <p className="text-slate-500 text-center py-8">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-blue-400 text-sm">&larr; Back</button>

      {!editing ? (
        <div className="space-y-2">
          <h1 className="text-xl font-bold">{book.title}</h1>
          <p className="text-slate-400">{book.author}</p>
          {book.publisher && <p className="text-slate-500 text-sm">Publisher: {book.publisher}</p>}
          {book.year_published && <p className="text-slate-500 text-sm">Year: {book.year_published}</p>}
          {book.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.genres.map((g) => (
                <span key={g} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{g}</span>
              ))}
            </div>
          )}
          {book.themes?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.themes.map((t) => (
                <span key={t} className="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
          {book.description && <p className="text-slate-400 text-sm">{book.description}</p>}
          {!book.ai_enriched && (
            <div className="flex items-center gap-2">
              <p className="text-amber-400 text-xs">Metadata not yet enriched by AI</p>
              <button
                onClick={async () => {
                  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enrich-book`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({ book_id: id }),
                  });
                  // Refresh book data after enrichment
                  window.location.reload();
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={startEdit} className="text-sm border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-800">
              Edit
            </button>
            <button
              onClick={() => setShowDelete(true)}
              disabled={activeCheckouts.length > 0}
              className="text-sm border border-red-800 text-red-400 rounded-lg px-3 py-1.5 hover:bg-red-900/30 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none" />
          <input value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none" />
          <input type="number" value={editCopies} onChange={(e) => setEditCopies(e.target.value)} min="1" className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">Save</button>
            <button onClick={() => setEditing(false)} className="border border-slate-700 rounded-lg px-4 py-2 hover:bg-slate-800">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">
            {available}/{book.total_copies} available
          </span>
          {available > 0 && (
            <button
              onClick={() => setShowCheckout(!showCheckout)}
              className="bg-blue-600 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-blue-700"
            >
              Check Out
            </button>
          )}
        </div>
      </div>

      {showCheckout && (
        <form onSubmit={handleCheckout} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold">Check Out</h3>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            value={surnameInitial}
            onChange={(e) => setSurnameInitial(e.target.value.slice(0, 1))}
            placeholder="Surname initial"
            required
            maxLength={1}
            className="w-16 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select school...</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <p className="text-slate-500 text-sm">Due: {dueDate.toLocaleDateString()}</p>
          <button type="submit" disabled={checkingOut} className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
            {checkingOut ? "Processing..." : "Confirm Checkout"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Checkout History</h2>
        {checkouts.length === 0 && (
          <p className="text-slate-500 text-sm">No checkout history.</p>
        )}
        {checkouts.map((c) => (
          <CheckoutRow
            key={c.id}
            bookTitle={book.title}
            borrowerName={c.borrower_first_name}
            borrowerInitial={c.borrower_surname_initial}
            schoolName={c.schools?.name ?? "Unknown"}
            dueAt={c.due_at}
            returnedAt={c.returned_at}
            onReturn={!c.returned_at ? () => setShowReturnId(c.id) : undefined}
          />
        ))}
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Book"
        message={`Delete "${book.title}" and all its checkout history? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <ConfirmDialog
        open={!!showReturnId}
        title="Return Book"
        message="Mark this book as returned?"
        confirmLabel="Return"
        onConfirm={handleReturn}
        onCancel={() => setShowReturnId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(authenticated\)/catalogue/\[id\]/
git commit -m "feat: implement book detail page with edit, delete, checkout, and return"
```

---

## Task 12: Checkouts Page

**Files:**
- Modify: `src/app/(authenticated)/checkouts/page.tsx`

- [ ] **Step 1: Implement checkouts page**

Replace `src/app/(authenticated)/checkouts/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useCheckouts } from "@/lib/hooks/use-checkouts";
import { CheckoutRow } from "@/components/checkout-row";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function CheckoutsPage() {
  const { checkouts: activeCheckouts, returnBook: returnActive } = useCheckouts({ activeOnly: true });
  const { checkouts: allCheckouts } = useCheckouts();
  const [showHistory, setShowHistory] = useState(false);
  const [showReturnId, setShowReturnId] = useState<string | null>(null);

  const displayCheckouts = showHistory
    ? allCheckouts.filter((c) => c.returned_at)
    : activeCheckouts;

  async function handleReturn() {
    if (showReturnId) {
      await returnActive(showReturnId);
      setShowReturnId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Checkouts</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setShowHistory(false)}
          className={`text-sm rounded-lg px-3 py-1.5 ${!showHistory ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-400 hover:bg-slate-800"}`}
        >
          Active
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className={`text-sm rounded-lg px-3 py-1.5 ${showHistory ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-400 hover:bg-slate-800"}`}
        >
          History
        </button>
      </div>

      <div className="space-y-2">
        {displayCheckouts.map((c) => (
          <CheckoutRow
            key={c.id}
            bookTitle={c.books?.title ?? "Unknown"}
            borrowerName={c.borrower_first_name}
            borrowerInitial={c.borrower_surname_initial}
            schoolName={c.schools?.name ?? "Unknown"}
            dueAt={c.due_at}
            returnedAt={c.returned_at}
            onReturn={!c.returned_at ? () => setShowReturnId(c.id) : undefined}
          />
        ))}
        {displayCheckouts.length === 0 && (
          <p className="text-slate-500 text-center py-8">
            {showHistory ? "No returned books yet." : "No active checkouts."}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={!!showReturnId}
        title="Return Book"
        message="Mark this book as returned?"
        confirmLabel="Return"
        onConfirm={handleReturn}
        onCancel={() => setShowReturnId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(authenticated\)/checkouts/
git commit -m "feat: implement checkouts page with active/history toggle and return flow"
```

---

## Task 13: Settings Page

**Files:**
- Modify: `src/app/(authenticated)/settings/page.tsx`

- [ ] **Step 1: Implement settings page**

Replace `src/app/(authenticated)/settings/page.tsx`:
```tsx
"use client";

import { useState, useRef } from "react";
import { useSchools } from "@/lib/hooks/use-schools";
import { useSettings } from "@/lib/hooks/use-settings";
import { useBooks } from "@/lib/hooks/use-books";
import { parseBooksCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function SettingsPage() {
  const { schools, addSchool, updateSchool, archiveSchool } = useSchools();
  const { settings, updateSettings } = useSettings();
  const { books, addBook } = useBooks();
  const supabase = createClient();

  // Staff
  const [staffUsers, setStaffUsers] = useState<{ id: string; email: string; created_at: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState("");

  // Fetch staff on mount
  useState(() => {
    supabase.auth.admin.listUsers().then(({ data }) => {
      if (data?.users) {
        setStaffUsers(data.users.map((u) => ({ id: u.id, email: u.email ?? "", created_at: u.created_at })));
      }
    }).catch(() => {
      // admin API may not be available from client — staff list will be empty
      // In production, use a server action or edge function to list users
    });
  });

  // Schools
  const [newSchool, setNewSchool] = useState("");
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [editSchoolName, setEditSchoolName] = useState("");
  const [archiveId, setArchiveId] = useState<string | null>(null);

  // CSV import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);

  // Settings
  const [email, setEmail] = useState(settings?.reminder_email ?? "");
  const [loanDays, setLoanDays] = useState(String(settings?.loan_duration_days ?? 28));
  const [saving, setSaving] = useState(false);

  async function handleAddSchool(e: React.FormEvent) {
    e.preventDefault();
    if (!newSchool.trim()) return;
    await addSchool(newSchool.trim());
    setNewSchool("");
  }

  async function handleSaveSchoolEdit() {
    if (editingSchoolId && editSchoolName.trim()) {
      await updateSchool(editingSchoolId, editSchoolName.trim());
      setEditingSchoolId(null);
    }
  }

  async function handleArchiveSchool() {
    if (archiveId) {
      await archiveSchool(archiveId);
      setArchiveId(null);
    }
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    const text = await file.text();
    const { books: parsedBooks, errors } = parseBooksCsv(text);

    let added = 0;
    let skipped = 0;

    for (const pb of parsedBooks) {
      const exists = books.some(
        (b) => b.title.toLowerCase() === pb.title.toLowerCase() && b.author.toLowerCase() === pb.author.toLowerCase()
      );
      if (exists) {
        skipped++;
        continue;
      }
      const { error } = await addBook(pb);
      if (!error) added++;
      else errors.push(`Failed to add "${pb.title}": ${error.message}`);
    }

    setImportResult({ added, skipped, errors });
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSaveSettings() {
    setSaving(true);
    await updateSettings({
      reminder_email: email.trim(),
      loan_duration_days: parseInt(loanDays) || 28,
    });
    setSaving(false);
  }

  async function handleInviteStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteResult("");
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail.trim());
      if (error) {
        setInviteResult(`Error: ${error.message}`);
      } else {
        setInviteResult(`Invitation sent to ${inviteEmail.trim()}`);
        setInviteEmail("");
      }
    } catch {
      setInviteResult("Error: Admin API not available. Invite users from the Supabase Dashboard.");
    }
    setInviting(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Schools */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Schools</h2>
        <form onSubmit={handleAddSchool} className="flex gap-2">
          <input
            value={newSchool}
            onChange={(e) => setNewSchool(e.target.value)}
            placeholder="Add school name"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700">Add</button>
        </form>
        <div className="space-y-1">
          {schools.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2">
              {editingSchoolId === s.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    value={editSchoolName}
                    onChange={(e) => setEditSchoolName(e.target.value)}
                    className="flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                  <button onClick={handleSaveSchoolEdit} className="text-xs text-blue-400">Save</button>
                  <button onClick={() => setEditingSchoolId(null)} className="text-xs text-slate-500">Cancel</button>
                </div>
              ) : (
                <>
                  <span className="text-sm">{s.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingSchoolId(s.id); setEditSchoolName(s.name); }} className="text-xs text-slate-400 hover:text-slate-200">Edit</button>
                    <button onClick={() => setArchiveId(s.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {schools.length === 0 && <p className="text-slate-500 text-sm">No schools added yet.</p>}
        </div>
      </section>

      {/* CSV Import */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Import Books (CSV)</h2>
        <p className="text-slate-500 text-sm">CSV format: title, author, copies (copies is optional, defaults to 1)</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleCsvImport}
          disabled={importing}
          className="text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:cursor-pointer hover:file:bg-blue-700"
        />
        {importing && <p className="text-slate-400 text-sm">Importing...</p>}
        {importResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm space-y-1">
            <p className="text-emerald-400">{importResult.added} books added</p>
            {importResult.skipped > 0 && <p className="text-amber-400">{importResult.skipped} duplicates skipped</p>}
            {importResult.errors.map((err, i) => <p key={i} className="text-red-400">{err}</p>)}
          </div>
        )}
      </section>

      {/* Reminder & Loan Settings */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Notifications & Loan</h2>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Reminder email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Loan duration (days)</label>
          <input
            value={loanDays}
            onChange={(e) => setLoanDays(e.target.value)}
            type="number"
            min="1"
            className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button onClick={handleSaveSettings} disabled={saving} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </section>

      {/* Staff Management */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Staff</h2>
        <div className="space-y-1">
          {staffUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2">
              <span className="text-sm">{user.email}</span>
              <span className="text-xs text-slate-500">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
              </span>
            </div>
          ))}
          {staffUsers.length === 0 && <p className="text-slate-500 text-sm">No staff members found.</p>}
        </div>
        <form onSubmit={handleInviteStaff} className="flex gap-2">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            type="email"
            placeholder="Invite staff by email"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" disabled={inviting} className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-50">
            {inviting ? "..." : "Invite"}
          </button>
        </form>
        {inviteResult && <p className={`text-sm ${inviteResult.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>{inviteResult}</p>}
      </section>

      {/* Sign Out */}
      <section>
        <button onClick={handleSignOut} className="text-red-400 text-sm hover:text-red-300">
          Sign Out
        </button>
      </section>

      <ConfirmDialog
        open={!!archiveId}
        title="Remove School"
        message="This school will be archived. Existing checkout records will be preserved."
        confirmLabel="Remove"
        onConfirm={handleArchiveSchool}
        onCancel={() => setArchiveId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(authenticated\)/settings/
git commit -m "feat: implement settings page with schools, CSV import, notifications config"
```

---

## Task 14: AI Enrichment Edge Function

**Files:**
- Create: `supabase/functions/enrich-book/index.ts`

- [ ] **Step 1: Create edge function**

Create `supabase/functions/enrich-book/index.ts`:
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  try {
    const { book_id } = await req.json();
    if (!book_id) {
      return new Response(JSON.stringify({ error: "book_id required" }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: book, error: fetchError } = await supabase
      .from("books")
      .select("title, author")
      .eq("id", book_id)
      .single();

    if (fetchError || !book) {
      return new Response(JSON.stringify({ error: "Book not found" }), { status: 404 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `For the book "${book.title}" by ${book.author}, provide the following information as JSON:
{
  "publisher": "original publisher name",
  "year_published": 1234,
  "genres": ["genre1", "genre2"],
  "themes": ["theme1", "theme2", "theme3"],
  "description": "A 1-2 sentence description of the book"
}

Respond ONLY with valid JSON, no other text.`,
          },
        ],
      }),
    });

    const aiResult = await response.json();
    const content = aiResult.content?.[0]?.text;

    if (!content) {
      return new Response(JSON.stringify({ error: "No AI response" }), { status: 500 });
    }

    const metadata = JSON.parse(content);

    const { error: updateError } = await supabase
      .from("books")
      .update({
        publisher: metadata.publisher || null,
        year_published: metadata.year_published || null,
        genres: metadata.genres || [],
        themes: metadata.themes || [],
        description: metadata.description || null,
        ai_enriched: true,
      })
      .eq("id", book_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, metadata }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/enrich-book/
git commit -m "feat: add AI enrichment edge function using Claude Haiku"
```

**Note for executor:** Deploy with `supabase functions deploy enrich-book`. Set the secret with `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`. The function can be called from the app after adding a book, or set up as a database webhook on `books` INSERT.

---

## Task 15: Email Reminder Edge Function

**Files:**
- Create: `supabase/functions/send-reminders/index.ts`

- [ ] **Step 1: Create reminder edge function**

Create `supabase/functions/send-reminders/index.ts`:
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get reminder email from settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("reminder_email")
      .single();

    if (!settings?.reminder_email || settings.reminder_email === "changeme@example.com") {
      return new Response(JSON.stringify({ message: "No reminder email configured" }), { status: 200 });
    }

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find due-soon checkouts (within 3 days, not yet reminded)
    const { data: dueSoon } = await supabase
      .from("checkouts")
      .select("id, due_at, borrower_first_name, borrower_surname_initial, books(title), schools(name)")
      .is("returned_at", null)
      .eq("reminder_sent", false)
      .lte("due_at", threeDaysFromNow.toISOString())
      .gt("due_at", now.toISOString());

    // Find overdue checkouts (not yet alerted)
    const { data: overdue } = await supabase
      .from("checkouts")
      .select("id, due_at, borrower_first_name, borrower_surname_initial, books(title), schools(name)")
      .is("returned_at", null)
      .eq("overdue_alert_sent", false)
      .lt("due_at", now.toISOString());

    const emailParts: string[] = [];

    if (overdue && overdue.length > 0) {
      emailParts.push("<h2>Overdue Books</h2><ul>");
      for (const c of overdue) {
        const bookTitle = (c as any).books?.title ?? "Unknown";
        const school = (c as any).schools?.name ?? "Unknown";
        const dueDate = new Date(c.due_at).toLocaleDateString();
        emailParts.push(
          `<li><strong>${bookTitle}</strong> — ${c.borrower_first_name} ${c.borrower_surname_initial}. (${school}) — was due ${dueDate}</li>`
        );
      }
      emailParts.push("</ul>");

      // Mark as alerted
      const ids = overdue.map((c) => c.id);
      await supabase.from("checkouts").update({ overdue_alert_sent: true }).in("id", ids);
    }

    if (dueSoon && dueSoon.length > 0) {
      emailParts.push("<h2>Due Soon</h2><ul>");
      for (const c of dueSoon) {
        const bookTitle = (c as any).books?.title ?? "Unknown";
        const school = (c as any).schools?.name ?? "Unknown";
        const dueDate = new Date(c.due_at).toLocaleDateString();
        emailParts.push(
          `<li><strong>${bookTitle}</strong> — ${c.borrower_first_name} ${c.borrower_surname_initial}. (${school}) — due ${dueDate}</li>`
        );
      }
      emailParts.push("</ul>");

      // Mark as reminded
      const ids = dueSoon.map((c) => c.id);
      await supabase.from("checkouts").update({ reminder_sent: true }).in("id", ids);
    }

    if (emailParts.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to send" }), { status: 200 });
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Mobile Library <noreply@resend.dev>",
        to: settings.reminder_email,
        subject: `Library Reminder: ${(overdue?.length ?? 0)} overdue, ${(dueSoon?.length ?? 0)} due soon`,
        html: emailParts.join(""),
      }),
    });

    const emailResult = await emailResponse.json();

    return new Response(
      JSON.stringify({
        message: "Reminders sent",
        overdue: overdue?.length ?? 0,
        dueSoon: dueSoon?.length ?? 0,
        emailResult,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/send-reminders/
git commit -m "feat: add email reminder edge function for due-soon and overdue books"
```

**Note for executor:** Deploy with `supabase functions deploy send-reminders`. Set `supabase secrets set RESEND_API_KEY=re_...`. Schedule via Supabase Dashboard → Database → Extensions → enable `pg_cron`, then:
```sql
select cron.schedule('daily-reminders', '0 8 * * *', $$
  select net.http_post(
    'https://YOUR_PROJECT.supabase.co/functions/v1/send-reminders',
    '{}',
    'application/json',
    ARRAY[http_header('Authorization', 'Bearer YOUR_ANON_KEY')]
  );
$$);
```

---

## Task 16: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Modify: `src/app/layout.tsx`, `next.config.ts`

- [ ] **Step 1: Install next-pwa**

```bash
pnpm add next-pwa
```

- [ ] **Step 2: Create manifest**

Create `public/manifest.json`:
```json
{
  "name": "Mobile Library",
  "short_name": "Library",
  "description": "Track book checkouts for your mobile library",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 3: Create placeholder icons**

```bash
mkdir -p public/icons
```

Generate simple placeholder icons (192x192 and 512x512 PNGs with a book icon). These can be replaced with proper branding later.

- [ ] **Step 4: Update next.config.ts for PWA**

Update `next.config.ts`:
```typescript
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
```

- [ ] **Step 5: Add manifest link to layout**

In `src/app/layout.tsx`, add to the `metadata` export:
```typescript
export const metadata: Metadata = {
  title: "Mobile Library",
  description: "Track book checkouts for your mobile library",
  manifest: "/manifest.json",
};
```

- [ ] **Step 6: Verify build**

```bash
pnpm build
```

Expected: Build succeeds with PWA service worker generated.

- [ ] **Step 7: Commit**

```bash
git add public/ next.config.ts src/app/layout.tsx
git commit -m "feat: add PWA configuration with manifest and service worker"
```

---

## Task 17: Integration Wiring + Final Polish

**Files:**
- Modify: `src/app/(authenticated)/catalogue/page.tsx` (add enrichment trigger after book add)

- [ ] **Step 1: Add enrichment trigger to catalogue page**

In `src/app/(authenticated)/catalogue/page.tsx`, after the `addBook` call succeeds, trigger the enrichment edge function:

```typescript
// After addBook succeeds, trigger AI enrichment
if (data) {
  fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enrich-book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ book_id: data.id }),
  }).catch(() => {
    // Enrichment failure is non-blocking
  });
}
```

Add the same enrichment trigger in the settings page CSV import loop, after each successful `addBook`.

- [ ] **Step 2: Add root redirect**

Create `src/app/page.tsx`:
```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 4: Run build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: wire up AI enrichment triggers and add root redirect"
```

---

## Deployment Checklist (Manual Steps)

These are not code tasks — they require the user to set up external services:

1. **Create Supabase project** at supabase.com (free tier)
2. **Run the migration** — paste `supabase/migrations/001_initial_schema.sql` into the SQL Editor
3. **Configure auth** — in Supabase Dashboard → Auth → Settings, disable "Enable email signups" (invite-only)
4. **Create first user** — in Supabase Dashboard → Auth → Users, create the library manager's account
5. **Set `.env.local`** — copy `.env.local.example` and fill in Supabase URL + anon key
6. **Deploy edge functions** — install Supabase CLI, `supabase functions deploy enrich-book`, `supabase functions deploy send-reminders`
7. **Set secrets** — `supabase secrets set ANTHROPIC_API_KEY=... RESEND_API_KEY=...`
8. **Set up cron** — enable `pg_cron` extension and schedule `send-reminders`
9. **Deploy to Vercel** — connect GitHub repo, add env vars, deploy
10. **Generate QR code** — create QR code pointing to the Vercel URL for staff access
