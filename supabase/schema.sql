-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- One row per user holding their tasks, schedule and settings.

create table if not exists public.plans (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  tasks      jsonb not null default '[]'::jsonb,
  schedule   jsonb not null default '{}'::jsonb,
  settings   jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: each user can only ever touch their own row.
alter table public.plans enable row level security;

create policy "Users read own plan"
  on public.plans for select to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own plan"
  on public.plans for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own plan"
  on public.plans for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
