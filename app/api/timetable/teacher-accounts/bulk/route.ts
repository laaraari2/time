import { NextResponse } from 'next/server';
import { requireSupabaseUser } from '../../../../lib/supabase/server';
import { getProject } from '../../../../lib/projects';
import { syncTeacherAccounts } from '../../../../lib/teacherAccounts';

export async function POST(request: Request) {
    const { user } = await requireSupabaseUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const projectId = body.projectId;

        if (!projectId) {
            return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 });
        }

        const project = await getProject(projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }

        const teachers = Array.isArray(project.teachers) ? project.teachers : [];

        // syncTeacherAccounts already handles creating accounts for teachers who don't have one
        // and uses their code as the password.
        await syncTeacherAccounts(project.id, teachers);

        return NextResponse.json({ success: true, count: teachers.length });
    } catch (error: any) {
        console.error('Failed to bulk generate teacher accounts:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate accounts' },
            { status: 500 }
        );
    }
}
