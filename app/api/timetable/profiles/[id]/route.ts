import { NextResponse } from 'next/server';
import { requireSupabaseUser } from '../../../../lib/supabase/server';
import { deleteProject, getProject, updateProject } from '../../../../lib/projects';
import { syncTeacherAccounts } from '../../../../lib/teacherAccounts';

type RouteContext = { params: Promise<{ id: string }> };

type ProfileUpdatePayload = {
  name?: string;
  config?: unknown;
  subjects?: unknown;
  teachers?: unknown;
  classes?: unknown;
  rooms?: unknown;
  lessons?: unknown;
  placements?: unknown;
};

export async function GET(_request: Request, context: RouteContext) {
  const { user } = await requireSupabaseUser();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await context.params;
    const project = await getProject(id);
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to load project:', error);
    return NextResponse.json({ success: false, error: 'Failed to load project' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { user } = await requireSupabaseUser();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = (await request.json()) as ProfileUpdatePayload;
    if (body.name !== undefined && !String(body.name).trim()) {
      return NextResponse.json({ success: false, error: 'Project name is required' }, { status: 400 });
    }

    const project = await updateProject(id, {
      ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
      ...(body.config !== undefined ? { config: body.config } : {}),
      ...(body.subjects !== undefined ? { subjects: body.subjects } : {}),
      ...(body.teachers !== undefined ? { teachers: body.teachers } : {}),
      ...(body.classes !== undefined ? { classes: body.classes } : {}),
      ...(body.rooms !== undefined ? { rooms: body.rooms } : {}),
      ...(body.lessons !== undefined ? { lessons: body.lessons } : {}),
      ...(body.placements !== undefined ? { placements: body.placements } : {}),
    });

    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

    if (body.teachers !== undefined) {
      await syncTeacherAccounts(project.id, Array.isArray(project.teachers) ? project.teachers : []);
    }

    return NextResponse.json({ success: true, profile: project });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ success: false, error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user } = await requireSupabaseUser();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const { id: projectId } = await context.params;
    const deleted = await deleteProject(projectId);
    if (!deleted) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 });
  }
}
