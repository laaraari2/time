-- Teacher account access for the mobile app.
-- Run this file once in the Supabase SQL Editor.

create table if not exists public.teacher_accounts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  teacher_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, teacher_id),
  unique (project_id, user_id)
);

create index if not exists teacher_accounts_user_id_idx on public.teacher_accounts(user_id);
create index if not exists teacher_accounts_project_id_idx on public.teacher_accounts(project_id);

alter table public.teacher_accounts enable row level security;

drop policy if exists "Managers can view teacher accounts" on public.teacher_accounts;
create policy "Managers can view teacher accounts"
on public.teacher_accounts for select
to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

drop policy if exists "Managers can create teacher accounts" on public.teacher_accounts;
create policy "Managers can create teacher accounts"
on public.teacher_accounts for insert
to authenticated
with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

drop policy if exists "Managers can update teacher accounts" on public.teacher_accounts;
create policy "Managers can update teacher accounts"
on public.teacher_accounts for update
to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

drop policy if exists "Managers can delete teacher accounts" on public.teacher_accounts;
create policy "Managers can delete teacher accounts"
on public.teacher_accounts for delete
to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- Returns the role of the current authenticated account.
create or replace function public.get_timetable_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.projects p where p.owner_id = auth.uid()) then 'manager'
    when exists (select 1 from public.teacher_accounts ta where ta.user_id = auth.uid()) then 'teacher'
    else 'none'
  end;
$$;

-- Returns projects visible to the current user.
-- Managers receive their complete projects.
-- Teachers receive a reduced project containing only their own teacher,
-- their lessons, the referenced classes/subjects, and the placements for those lessons.
create or replace function public.get_accessible_projects()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if exists (select 1 from public.projects p where p.owner_id = auth.uid()) then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'createdAt', p.created_at,
      'updatedAt', p.updated_at,
      'config', p.config,
      'subjects', p.subjects,
      'teachers', p.teachers,
      'classes', p.classes,
      'rooms', p.rooms,
      'lessons', p.lessons,
      'placements', p.placements
    ) order by p.updated_at desc), '[]'::jsonb)
    into result
    from public.projects p
    where p.owner_id = auth.uid();
    return result;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'createdAt', p.created_at,
    'updatedAt', p.updated_at,
    'config', p.config,
    'subjects', (
      select coalesce(jsonb_agg(s), '[]'::jsonb)
      from jsonb_array_elements(p.subjects) s
      where (s->>'id') in (
        select distinct l->>'subjectId'
        from jsonb_array_elements(p.lessons) l
        join public.teacher_accounts ta2 on ta2.project_id = p.id and ta2.user_id = auth.uid()
        where l->>'teacherId' = ta2.teacher_id
      )
    ),
    'teachers', (
      select coalesce(jsonb_agg(t), '[]'::jsonb)
      from jsonb_array_elements(p.teachers) t
      join public.teacher_accounts ta2 on ta2.project_id = p.id and ta2.user_id = auth.uid()
      where t->>'id' = ta2.teacher_id
    ),
    'classes', (
      select coalesce(jsonb_agg(c), '[]'::jsonb)
      from jsonb_array_elements(p.classes) c
      where (c->>'id') in (
        select distinct l->>'classGroupId'
        from jsonb_array_elements(p.lessons) l
        join public.teacher_accounts ta2 on ta2.project_id = p.id and ta2.user_id = auth.uid()
        where l->>'teacherId' = ta2.teacher_id
      )
    ),
    'rooms', '[]'::jsonb,
    'lessons', (
      select coalesce(jsonb_agg(l), '[]'::jsonb)
      from jsonb_array_elements(p.lessons) l
      join public.teacher_accounts ta2 on ta2.project_id = p.id and ta2.user_id = auth.uid()
      where l->>'teacherId' = ta2.teacher_id
    ),
    'placements', (
      select coalesce(jsonb_agg(pl), '[]'::jsonb)
      from jsonb_array_elements(p.placements) pl
      where (pl->>'lessonId') in (
        select l->>'id'
        from jsonb_array_elements(p.lessons) l
        join public.teacher_accounts ta2 on ta2.project_id = p.id and ta2.user_id = auth.uid()
        where l->>'teacherId' = ta2.teacher_id
      )
    )
  ) order by p.updated_at desc), '[]'::jsonb)
  into result
  from public.projects p
  where exists (
    select 1 from public.teacher_accounts ta
    where ta.project_id = p.id and ta.user_id = auth.uid()
  );

  return result;
end;
$$;

grant execute on function public.get_timetable_user_role() to authenticated;
grant execute on function public.get_accessible_projects() to authenticated;
