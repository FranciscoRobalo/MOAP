-- Análise de Orçamentos — Workspace schema
-- Adds persistent storage for saved analyses, per-item decisions,
-- notes and AI-generated negotiation scripts. All rows are owned
-- by the authenticated user via RLS.

-- =======================================================
-- Saved analyses (snapshots)
-- =======================================================
create table if not exists public.analise_saved (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  obra_id          uuid null,
  file_name        text not null,
  region           text,
  total_budget     numeric,
  total_reference  numeric,
  overall_variance numeric,
  overall_rating   text,
  quality_score    numeric,
  match_rate       numeric,
  potential_savings numeric,
  risk_items       int,
  stats            jsonb,
  category_breakdown jsonb,
  recommendations  jsonb,
  items            jsonb not null,   -- full BudgetItem[] snapshot
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists analise_saved_user_created_idx
  on public.analise_saved (user_id, created_at desc);

create index if not exists analise_saved_obra_idx
  on public.analise_saved (obra_id);

-- =======================================================
-- Per-item decisions  (accepted / negotiate / rejected)
-- =======================================================
create table if not exists public.analise_decisions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  analysis_id   uuid not null references public.analise_saved(id) on delete cascade,
  item_id       text not null,
  decision      text not null default 'pending'
                 check (decision in ('pending','accepted','negotiate','rejected')),
  target_price  numeric null,
  updated_at    timestamptz not null default now(),
  unique (analysis_id, item_id)
);

create index if not exists analise_decisions_analysis_idx
  on public.analise_decisions (analysis_id);

-- =======================================================
-- Per-item notes
-- =======================================================
create table if not exists public.analise_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  analysis_id  uuid not null references public.analise_saved(id) on delete cascade,
  item_id      text not null,
  body         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists analise_notes_analysis_item_idx
  on public.analise_notes (analysis_id, item_id, created_at desc);

-- =======================================================
-- AI-generated negotiation scripts (cached per item)
-- =======================================================
create table if not exists public.analise_scripts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  analysis_id  uuid not null references public.analise_saved(id) on delete cascade,
  item_id      text not null,
  script       text not null,
  created_at   timestamptz not null default now()
);

create index if not exists analise_scripts_analysis_item_idx
  on public.analise_scripts (analysis_id, item_id, created_at desc);

-- =======================================================
-- RLS
-- =======================================================
alter table public.analise_saved     enable row level security;
alter table public.analise_decisions enable row level security;
alter table public.analise_notes     enable row level security;
alter table public.analise_scripts   enable row level security;

-- analise_saved
drop policy if exists "analise_saved_owner_select" on public.analise_saved;
drop policy if exists "analise_saved_owner_insert" on public.analise_saved;
drop policy if exists "analise_saved_owner_update" on public.analise_saved;
drop policy if exists "analise_saved_owner_delete" on public.analise_saved;

create policy "analise_saved_owner_select" on public.analise_saved
  for select using (auth.uid() = user_id);
create policy "analise_saved_owner_insert" on public.analise_saved
  for insert with check (auth.uid() = user_id);
create policy "analise_saved_owner_update" on public.analise_saved
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "analise_saved_owner_delete" on public.analise_saved
  for delete using (auth.uid() = user_id);

-- analise_decisions
drop policy if exists "analise_decisions_owner_all" on public.analise_decisions;
create policy "analise_decisions_owner_all" on public.analise_decisions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- analise_notes
drop policy if exists "analise_notes_owner_all" on public.analise_notes;
create policy "analise_notes_owner_all" on public.analise_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- analise_scripts
drop policy if exists "analise_scripts_owner_all" on public.analise_scripts;
create policy "analise_scripts_owner_all" on public.analise_scripts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =======================================================
-- Updated-at trigger (shared)
-- =======================================================
create or replace function public.analise_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists analise_saved_touch on public.analise_saved;
create trigger analise_saved_touch
  before update on public.analise_saved
  for each row execute function public.analise_touch_updated_at();

drop trigger if exists analise_decisions_touch on public.analise_decisions;
create trigger analise_decisions_touch
  before update on public.analise_decisions
  for each row execute function public.analise_touch_updated_at();
