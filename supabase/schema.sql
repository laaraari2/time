-- TimeTables / Supabase database setup
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  config jsonb not null default '{}'::jsonb,
  subjects jsonb not null default '[]'::jsonb,
  teachers jsonb not null default '[]'::jsonb,
  classes jsonb not null default '[]'::jsonb,
  rooms jsonb not null default '[]'::jsonb,
  lessons jsonb not null default '[]'::jsonb,
  placements jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists projects_updated_at_idx on public.projects(updated_at desc);

create or replace function public.set_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_projects_updated_at();

alter table public.projects enable row level security;

drop policy if exists "Users can view their projects" on public.projects;
create policy "Users can view their projects"
on public.projects for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can create their projects" on public.projects;
create policy "Users can create their projects"
on public.projects for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Users can update their projects" on public.projects;
create policy "Users can update their projects"
on public.projects for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users can delete their projects" on public.projects;
create policy "Users can delete their projects"
on public.projects for delete
to authenticated
using (owner_id = auth.uid());

-- Optional storage bucket for school/ministry logos.
insert into storage.buckets (id, name, public)
values ('school-assets', 'school-assets', true)
on conflict (id) do nothing;

-- Public read, authenticated upload/update/delete only inside this bucket.
drop policy if exists "Public can view school assets" on storage.objects;
create policy "Public can view school assets"
on storage.objects for select
to public
using (bucket_id = 'school-assets');

drop policy if exists "Authenticated users can upload school assets" on storage.objects;
create policy "Authenticated users can upload school assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'school-assets');

drop policy if exists "Authenticated users can update school assets" on storage.objects;
create policy "Authenticated users can update school assets"
on storage.objects for update
to authenticated
using (bucket_id = 'school-assets')
with check (bucket_id = 'school-assets');

drop policy if exists "Authenticated users can delete school assets" on storage.objects;
create policy "Authenticated users can delete school assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'school-assets');
