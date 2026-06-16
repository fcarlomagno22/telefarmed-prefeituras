-- Live location sharing for Corrida e Caminhada (token-based viewer)

create table if not exists public.run_walk_live_sessions (
  id uuid primary key default gen_random_uuid(),
  share_token text not null unique,
  participant_name text not null,
  activity_name text not null,
  is_active boolean not null default true,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours'),
  created_at timestamptz not null default now()
);

create table if not exists public.run_walk_live_points (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.run_walk_live_sessions(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters double precision,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_run_walk_live_points_session_recorded
  on public.run_walk_live_points (session_id, recorded_at asc);

create index if not exists idx_run_walk_live_sessions_token
  on public.run_walk_live_sessions (share_token);

alter table public.run_walk_live_sessions enable row level security;
alter table public.run_walk_live_points enable row level security;

drop policy if exists "anon_select_run_walk_live_sessions" on public.run_walk_live_sessions;
drop policy if exists "anon_insert_run_walk_live_sessions" on public.run_walk_live_sessions;
drop policy if exists "anon_update_run_walk_live_sessions" on public.run_walk_live_sessions;
drop policy if exists "anon_select_run_walk_live_points" on public.run_walk_live_points;
drop policy if exists "anon_insert_run_walk_live_points" on public.run_walk_live_points;

create policy "anon_select_run_walk_live_sessions"
  on public.run_walk_live_sessions for select to anon using (true);

create policy "anon_insert_run_walk_live_sessions"
  on public.run_walk_live_sessions for insert to anon with check (true);

create policy "anon_update_run_walk_live_sessions"
  on public.run_walk_live_sessions for update to anon using (true);

create policy "anon_select_run_walk_live_points"
  on public.run_walk_live_points for select to anon using (true);

create policy "anon_insert_run_walk_live_points"
  on public.run_walk_live_points for insert to anon with check (true);

grant select, insert, update on public.run_walk_live_sessions to anon;
grant select, insert on public.run_walk_live_points to anon;
