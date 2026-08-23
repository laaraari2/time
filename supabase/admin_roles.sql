-- TimeTables: admin / guard accounts
-- Run this migration once in Supabase SQL Editor AFTER schema.sql / teacher_access.sql.
-- The app creates admin users with auth.users.app_metadata.role = 'admin'.

-- Managers/admins can access projects they own; admin accounts can access all projects.
drop policy if exists "Users can view their projects" on public.projects;
create policy "Users can view their projects"
on public.projects for select
to authenticated
using (
  owner_id = auth.uid()
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Users can create their projects" on public.projects;
create policy "Users can create their projects"
on public.projects for insert
to authenticated
with check (
  owner_id = auth.uid()
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Users can update their projects" on public.projects;
create policy "Users can update their projects"
on public.projects for update
to authenticated
using (
  owner_id = auth.uid()
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  owner_id = auth.uid()
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Users can delete their projects" on public.projects;
create policy "Users can delete their projects"
on public.projects for delete
to authenticated
using (
  owner_id = auth.uid()
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Admins can manage teacher accounts for every project.
drop policy if exists "Managers can view teacher accounts" on public.teacher_accounts;
create policy "Managers can view teacher accounts"
on public.teacher_accounts for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

drop policy if exists "Managers can create teacher accounts" on public.teacher_accounts;
create policy "Managers can create teacher accounts"
on public.teacher_accounts for insert
to authenticated
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

drop policy if exists "Managers can update teacher accounts" on public.teacher_accounts;
create policy "Managers can update teacher accounts"
on public.teacher_accounts for update
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

drop policy if exists "Managers can delete teacher accounts" on public.teacher_accounts;
create policy "Managers can delete teacher accounts"
on public.teacher_accounts for delete
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

-- Replace the role function so an app-level admin is a manager even when they do not own a project.
create or replace function public.get_timetable_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select case
    when (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' then 'manager'
    when exists (select 1 from public.projects p where p.owner_id = auth.uid()) then 'manager'
    when exists (select 1 from public.teacher_accounts ta where ta.user_id = auth.uid()) then 'teacher'
    else 'none'
  end;
$$;

-- Admins receive all projects; ordinary managers receive only their own project(s).
create or replace function public.get_accessible_projects()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
     or exists (select 1 from public.projects p where p.owner_id = auth.uid()) then
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
    where (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
       or p.owner_id = auth.uid();
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
