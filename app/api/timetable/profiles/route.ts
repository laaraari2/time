import { NextResponse } from 'next/server';
import { requireSupabaseUser } from '../../../lib/supabase/server';
import { createProject, listProjects } from '../../../lib/projects';
import { syncTeacherAccounts } from '../../../lib/teacherAccounts';

type ProfilePayload = {
  name?: string;
  config?: unknown;
  subjects?: unknown;
  teachers?: unknown;
  classes?: unknown;
  rooms?: unknown;
  lessons?: unknown;
  placements?: unknown;
};

export async function GET() {
  const { user } = await requireSupabaseUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const projects = await listProjects();
    return NextResponse.json(projects);
  } catch (error: unknown) {
    const e = error as { message?: string; code?: string; details?: string; hint?: string; status?: number };
    console.error('Failed to load projects:', { userId: user.id, message: e?.message, code: e?.code, details: e?.details, hint: e?.hint, status: e?.status });
    return NextResponse.json({ success: false, error: 'Failed to load projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user } = await requireSupabaseUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await request.json()) as ProfilePayload;
    const name = String(body.name ?? '').trim();
    if (!name) return NextResponse.json({ success: false, error: 'Project name is required' }, { status: 400 });

    const project = await createProject({
      name,
      config: body.config ?? {},
      subjects: body.subjects ?? [],
      teachers: body.teachers ?? [],
      classes: body.classes ?? [],
      rooms: body.rooms ?? [],
      lessons: body.lessons ?? [],
      placements: body.placements ?? [],
    });

    await syncTeacherAccounts(project.id, Array.isArray(project.teachers) ? project.teachers : []);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
  }
}
