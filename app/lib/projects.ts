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

function mapRpcProject(value: unknown): ProjectRecord | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.name !== 'string') return null;
  return {
    id: row.id,
    name: row.name,
    createdAt: String(row.createdAt ?? ''),
    updatedAt: String(row.updatedAt ?? ''),
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

  // This RPC is the authorization boundary for mobile access. Owners receive
  // their full project; teachers receive only their own teacher/lessons/classes.
  const { data: accessibleProjects, error: rpcError } = await supabase.rpc('get_accessible_projects');
  if (!rpcError && Array.isArray(accessibleProjects)) {
    return accessibleProjects.map(mapRpcProject).filter((item): item is ProjectRecord => Boolean(item));
  }

  // Keep the manager experience working if the new SQL function has not yet
  // been applied to Supabase. Teachers will become available after migration.
  const { data, error } = await supabase
    .from('projects')
    .select('id,name,created_at,updated_at,config,subjects,teachers,classes,rooms,lessons,placements')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ProjectRow[]).map(mapProject);
}

export async function getTimetableUserRole(): Promise<'manager' | 'teacher' | 'none'> {
  const { supabase, user } = await requireSupabaseUser();
  if (!user) return 'none';

  const { data, error } = await supabase.rpc('get_timetable_user_role');
  if (!error && (data === 'manager' || data === 'teacher' || data === 'none')) {
    return data;
  }

  // Fallback for existing databases before the migration is applied.
  const { data: ownProjects } = await supabase.from('projects').select('id').limit(1);
  return ownProjects && ownProjects.length > 0 ? 'manager' : 'none';
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
