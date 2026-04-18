create table if not exists public.users (
  _id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  _id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bugs (
  _id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.bugs enable row level security;

create policy "service role can manage users"
on public.users
for all
to service_role
using (true)
with check (true);

create policy "service role can manage projects"
on public.projects
for all
to service_role
using (true)
with check (true);

create policy "service role can manage bugs"
on public.bugs
for all
to service_role
using (true)
with check (true);
