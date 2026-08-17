import { requireSupabaseUser } from './supabase/server';
import { createSupabaseAdminClient } from './supabase/admin';

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

function restrictProjectForTeacher(row: ProjectRow, teacherId: string): ProjectRecord {
  const teachers = Array.isArray(row.teachers) ? row.teachers as Array<Record<string, unknown>> : [];
  const subjects = Array.isArray(row.subjects) ? row.subjects as Array<Record<string, unknown>> : [];
  const classes = Array.isArray(row.classes) ? row.classes as Array<Record<string, unknown>> : [];
  const lessons = Array.isArray(row.lessons) ? row.lessons as Array<Record<string, unknown>> : [];
  const placements = Array.isArray(row.placements) ? row.placements as Array<Record<string, unknown>> : [];

  const teacherLessons = lessons.filter((lesson) => String(lesson.teacherId ?? lesson.teacher_id ?? '') === teacherId);
  const teacherLessonIds = new Set(teacherLessons.map((lesson) => String(lesson.id ?? '')));
  const teacherSubjectIds = new Set(teacherLessons.map((lesson) => String(lesson.subjectId ?? lesson.subject_id ?? '')).filter(Boolean));
  const teacherClassIds = new Set(teacherLessons.map((lesson) => String(lesson.classGroupId ?? lesson.classId ?? lesson.class_group_id ?? '')).filter(Boolean));

  return mapProject({
    ...row,
    teachers: teachers.filter((teacher) => String(teacher.id ?? '') === teacherId),
    subjects: subjects.filter((subject) => teacherSubjectIds.has(String(subject.id ?? ''))),
    classes: classes.filter((classItem) => teacherClassIds.has(String(classItem.id ?? ''))),
    rooms: [],
    lessons: teacherLessons,
    placements: placements.filter((placement) => teacherLessonIds.has(String(placement.lessonId ?? placement.lesson_id ?? ''))),
  });
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const { supabase, user } = await requireSupabaseUser();
  if (!user) return [];

  // This RPC is the preferred authorization boundary for mobile access. Owners receive
  // their full projects; teachers receive only their own teacher/lessons/classes.
  const { data: accessibleProjects, error: rpcError } = await supabase.rpc('get_accessible_projects');
  if (!rpcError && Array.isArray(accessibleProjects)) {
    return accessibleProjects.map(mapRpcProject).filter((item): item is ProjectRecord => Boolean(item));
  }

  // Backward-compatible fallback for databases where teacher_access.sql has not
  // created the RPC yet. Use the server-side admin client only after authenticating
  // the current user, then explicitly restrict the returned data to their project.
  const admin = createSupabaseAdminClient();
  const { data: accounts, error: accountsError } = await admin
    .from('teacher_accounts')
    .select('project_id,teacher_id')
    .eq('user_id', user.id);

  if (!accountsError && Array.isArray(accounts) && accounts.length > 0) {
    const accountByProject = new Map<string, string>();
    for (const account of accounts) {
      accountByProject.set(String(account.project_id), String(account.teacher_id));
    }

    const { data: teacherProjects, error: teacherProjectsError } = await admin
      .from('projects')
      .select('id,name,created_at,updated_at,config,subjects,teachers,classes,rooms,lessons,placements')
      .order('updated_at', { ascending: false });

    if (teacherProjectsError) throw teacherProjectsError;

    return ((teacherProjects ?? []) as ProjectRow[])
      .filter((row) => accountByProject.has(String(row.id)))
      .map((row) => restrictProjectForTeacher(row, accountByProject.get(String(row.id))!));
  }

  // Manager fallback: keep the existing experience working when the RPC migration
  // is unavailable, but never expose projects owned by another manager.
  const { data, error } = await admin
    .from('projects')
    .select('id,name,created_at,updated_at,config,subjects,teachers,classes,rooms,lessons,placements')
    .eq('owner_id', user.id)
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
  const admin = createSupabaseAdminClient();
  const { data: ownProjects } = await admin.from('projects').select('id').eq('owner_id', user.id).limit(1);
  if (ownProjects && ownProjects.length > 0) return 'manager';

  const { data: teacherAccount } = await admin.from('teacher_accounts').select('id').eq('user_id', user.id).limit(1);
  return teacherAccount && teacherAccount.length > 0 ? 'teacher' : 'none';
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
