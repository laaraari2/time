import { requireSupabaseUser } from './supabase/server';

export type ProjectRecord = {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  config: unknown;
  subjects: unknown;
  teachers: unknown;
  classes: unknown;
  rooms: unknown;
  lessons: unknown;
  placements: unknown;
};

type ProjectRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  config: unknown;
  subjects: unknown;
  teachers: unknown;
  classes: unknown;
  rooms: unknown;
  lessons: unknown;
  placements: unknown;
};

function mapProject(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    config: row.config ?? {},
    subjects: row.subjects ?? [],
    teachers: row.teachers ?? [],
    classes: row.classes ?? [],
    rooms: row.rooms ?? [],
    lessons: row.lessons ?? [],
    placements: row.placements ?? [],
  };
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const { supabase, user } = await requireSupabaseUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('id,name,created_at,updated_at,config,subjects,teachers,classes,rooms,lessons,placements')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ProjectRow[]).map(mapProject);
}

export async function getProject(id: string) {
  const { supabase, user } = await requireSupabaseUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('projects')
    .select('id,name,created_at,updated_at,config,subjects,teachers,classes,rooms,lessons,placements')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProject(data as ProjectRow) : null;
}

export async function createProject(input: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const { supabase, user } = await requireSupabaseUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      name: input.name,
      config: input.config ?? {},
      subjects: input.subjects ?? [],
      teachers: input.teachers ?? [],
      classes: input.classes ?? [],
      rooms: input.rooms ?? [],
      lessons: input.lessons ?? [],
      placements: input.placements ?? [],
    })
    .select('id,name,created_at,updated_at,config,subjects,teachers,classes,rooms,lessons,placements')
    .single();

  if (error) throw error;
  return mapProject(data as ProjectRow);
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase, user } = await requireSupabaseUser();
  if (!user) return null;

  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.config !== undefined) update.config = patch.config;
  if (patch.subjects !== undefined) update.subjects = patch.subjects;
  if (patch.teachers !== undefined) update.teachers = patch.teachers;
  if (patch.classes !== undefined) update.classes = patch.classes;
  if (patch.rooms !== undefined) update.rooms = patch.rooms;
  if (patch.lessons !== undefined) update.lessons = patch.lessons;
  if (patch.placements !== undefined) update.placements = patch.placements;

  const { data, error } = await supabase
    .from('projects')
    .update(update)
    .eq('id', id)
    .select('id,name,created_at,updated_at,config,subjects,teachers,classes,rooms,lessons,placements')
    .maybeSingle();

  if (error) throw error;
  return data ? mapProject(data as ProjectRow) : null;
}

export async function deleteProject(id: string) {
  const { supabase, user } = await requireSupabaseUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
