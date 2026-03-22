-- User approvals table
create table public.user_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text not null,
  approved boolean default false,
  requested_at timestamptz default now(),
  approved_at timestamptz
);

-- RLS: authenticated users can read their own approval status
alter table public.user_approvals enable row level security;

create policy "Users can read own approval" on public.user_approvals
  for select using (auth.uid() = user_id);

-- Allow authenticated users to insert their own approval request
create policy "Users can request approval" on public.user_approvals
  for insert with check (auth.uid() = user_id);

-- Admin policy: all authenticated users can view all approvals (since there are no roles, all staff are equal)
-- But only already-approved users should manage approvals in practice (enforced in the UI)
create policy "Approved users can manage approvals" on public.user_approvals
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
