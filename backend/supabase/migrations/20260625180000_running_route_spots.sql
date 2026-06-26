-- Community-submitted running/walking spots (Corrida e Caminhada)

create table if not exists public.running_route_spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  type text not null check (type in ('park', 'track', 'waterfront', 'trail', 'plaza')),
  latitude double precision not null,
  longitude double precision not null,
  address_label text,
  location_source text not null check (location_source in ('gps', 'address')),
  cover_photo_url text,
  submitted_by_cpf text,
  submitted_by_name text,
  recommend_count integer not null default 0,
  not_recommend_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_running_route_spots_created_at
  on public.running_route_spots (created_at desc);

alter table public.running_route_spots enable row level security;

drop policy if exists "anon_select_running_route_spots" on public.running_route_spots;
drop policy if exists "anon_insert_running_route_spots" on public.running_route_spots;

create policy "anon_select_running_route_spots"
  on public.running_route_spots for select to anon using (true);

create policy "anon_insert_running_route_spots"
  on public.running_route_spots for insert to anon with check (true);

grant select, insert on public.running_route_spots to anon;
