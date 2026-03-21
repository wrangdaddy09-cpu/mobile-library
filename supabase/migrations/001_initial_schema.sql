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
