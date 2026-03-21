# Mobile Library App — Design Specification

## Overview

A Progressive Web App (PWA) for tracking book checkouts from a mobile library serving high school students. Staff access the app via QR code, manage a catalogue of ~100+ books, check books in/out to students, and receive reminders when books are due.

## Goals

- Replace manual tracking with a simple, mobile-friendly digital system
- Minimize data entry — AI enriches book metadata automatically
- Provide at-a-glance visibility into overdue and due-soon books
- Send automated email reminders when books approach their due date

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js (React) + Tailwind CSS | PWA via next-pwa |
| Backend/DB | Supabase (Postgres) | Free tier sufficient |
| Auth | Supabase Auth | Email/password, all users equal access |
| AI Enrichment | Claude API (Haiku) | Auto-populate book metadata |
| Email Reminders | Supabase Edge Functions + Resend/SMTP | Scheduled daily check |
| Hosting | Vercel | Free tier, auto-deploy on push |

## Data Model

### `books`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, auto-generated | |
| title | text | NOT NULL | |
| author | text | NOT NULL | |
| total_copies | int | NOT NULL, DEFAULT 1 | Some books have 2 copies |
| publisher | text | | AI-populated |
| year_published | int | | AI-populated |
| genres | text[] | | AI-populated, e.g. ["Fiction", "Classic"] |
| themes | text[] | | AI-populated, e.g. ["Justice", "Identity"] |
| description | text | | AI-populated, brief synopsis |
| ai_enriched | boolean | DEFAULT false | Whether AI metadata has been populated |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | Auto-updated via trigger on row change |

### `app_settings`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, auto-generated | Single row |
| reminder_email | text | NOT NULL | Email address for due/overdue reminders |
| loan_duration_days | int | NOT NULL, DEFAULT 28 | Configurable checkout period |

### `schools`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, auto-generated | |
| name | text | NOT NULL, UNIQUE | Predefined list managed in Settings |
| archived | boolean | DEFAULT false | Soft-delete to preserve checkout history |

### `checkouts`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, auto-generated | |
| book_id | uuid | FK → books.id, NOT NULL | |
| borrower_first_name | text | NOT NULL | e.g. "Sarah" |
| borrower_surname_initial | text | NOT NULL | e.g. "L" |
| school_id | uuid | FK → schools.id, NOT NULL | |
| checked_out_at | timestamptz | DEFAULT now() | |
| due_at | timestamptz | NOT NULL | checked_out_at + 4 weeks |
| returned_at | timestamptz | | NULL until returned |
| reminder_sent | boolean | DEFAULT false | Tracks if due-soon email was sent |
| overdue_alert_sent | boolean | DEFAULT false | Tracks if overdue email was sent |

### Auth

Handled by Supabase's built-in `auth.users` table. No custom roles — all authenticated users have full access to all features. Supabase Auth is configured as **invite-only** — new staff members must be invited by an existing user via the Settings screen (uses Supabase admin invite API). This prevents unauthorized signups from anyone who discovers the QR code URL.

## Book Availability Logic

A book's available copies = `total_copies - (active checkouts for that book)` where an active checkout has `returned_at IS NULL`.

- If available copies > 0: book can be checked out
- If available copies = 0: book shows as unavailable, checkout button disabled

## AI Enrichment Flow

1. Staff adds a book with **title**, **author**, and **total_copies**
2. A Supabase Edge Function calls the Claude API (Haiku model) with the title and author
3. Claude returns structured JSON: `{ publisher, year_published, genres, themes, description }`
4. The edge function updates the book record and sets `ai_enriched = true`
5. Same flow runs per-book during CSV bulk import

Fallback: if the API call fails, the book is saved with `ai_enriched = false` and can be retried later.

During CSV bulk import, books are enriched sequentially (one at a time) to respect API rate limits. A progress indicator shows enrichment status. If individual enrichments fail, they are skipped and can be retried from the Book Detail screen.

## Search & Filtering

The catalogue search matches against: title, author, genres, themes, publisher. A single search input filters client-side across all these fields (performant at ~100 books). Users can type things like "sci-fi", "justice", or "Orwell" and get relevant results. All books are loaded once on page load; filtering is instant in the browser.

## Screens

### 1. Login
- Email and password fields
- Supabase auth handles session management
- Redirects to Dashboard on success

### 2. Dashboard (Home)
- **Stats cards:** Total books, Checked out, Due soon (within 3 days), Overdue
- **Due soon & overdue list:** Shows book title, borrower name/initial, school, and status badge (OVERDUE / DUE IN X DAYS)
- Tapping a book in the list navigates to its detail page

### 3. Catalogue
- **Search bar** at the top — filters books in real-time
- **Book list** showing: title, author, availability badge (e.g. "1/2 available")
- Colour-coded availability: green (all available), yellow (some available), red (none available)
- **"+ Add Book" button** — opens add book form
- Tapping a book opens its detail page

### 4. Book Detail
- Shows all metadata: title, author, publisher, year, genres, themes, description
- Shows current checkout status (who has it, when due)
- **"Check Out" button** (if available copies > 0)
- **"Edit" button** — edit title, author, total_copies, or manually override AI metadata
- **"Delete" button** — only enabled if no active checkouts; shows confirmation dialog; hard-deletes the book and its checkout history
- **Checkout history** for this book

### 5. Checkout Flow
- Select or pre-filled book
- Enter borrower first name (text input)
- Enter surname initial (single character input)
- Select school from dropdown
- Auto-calculated due date displayed (today + configured loan duration, default 28 days)
- Confirm button

### 6. Checkouts List
- All active checkouts, sorted by due date (most urgent first)
- Each row: book title, borrower, school, due date, status badge
- **"Return" button** on each row — shows confirmation dialog before marking as returned
- Toggle to show returned/historical checkouts

### 7. Settings
- **Schools:** Add/edit schools; archive (soft-delete) schools to preserve checkout history
- **CSV Import:** Upload a CSV file to bulk-add books (columns: title, author, copies). Duplicates (matched by title + author, case-insensitive) are skipped with a summary shown after import.
- **Staff:** View current staff members, invite new staff via email (Supabase invite API)
- **Reminder Email:** Configure which email address receives due/overdue notifications
- **Loan Duration:** Configure default loan period (defaults to 28 days)

### Navigation
- Bottom tab bar with 4 tabs: Home, Catalogue, Checkouts, Settings
- Persistent across all screens (except Login)

## Reminders System

### In-App
- Dashboard shows due-soon (within 3 days) and overdue books prominently
- Colour-coded badges throughout the app

### Email
- A Supabase Edge Function runs daily (via pg_cron or Supabase scheduled function)
- Checks for books where `due_at` is within 3 days AND `reminder_sent = false`
- Sends an email to the address configured in `app_settings.reminder_email` listing all books due soon
- Sets `reminder_sent = true` after sending
- Also checks for books where `due_at < now()` AND `overdue_alert_sent = false`, sends an overdue alert, and sets `overdue_alert_sent = true`

## CSV Import Format

Expected CSV columns:
```
title,author,copies
The Great Gatsby,F. Scott Fitzgerald,1
1984,George Orwell,2
To Kill a Mockingbird,Harper Lee,2
```

- `copies` column is optional (defaults to 1)
- After import, each book is queued for AI enrichment
- Import shows a progress indicator and summary on completion

## PWA Configuration

- Service worker for offline capability (view cached catalogue). Checkout and return operations require network connectivity — an offline message is shown if attempted without connection.
- Web app manifest for "Add to Home Screen"
- App icon and splash screen
- Responsive design optimized for mobile (but works on desktop too)

## Security

- All Supabase tables protected by Row Level Security (RLS)
- RLS policy: authenticated users can read/write all records
- No public access — must be logged in
- Supabase API keys stored as environment variables, never exposed in client code
- Claude API key stored in Supabase Edge Function secrets only

## Out of Scope

- Student accounts or self-service checkout
- Book cover images
- Multiple library branches
- Fine/fee tracking
- Book reservations or waitlists
- Detailed borrower profiles or history tracking per student
- Native mobile app (iOS/Android)
