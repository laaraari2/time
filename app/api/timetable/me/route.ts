import { NextResponse } from 'next/server';
import { requireSupabaseUser } from '../../../lib/supabase/server';
import { getTimetableUserRole } from '../../../lib/projects';

export async function GET() {
  const { user } = await requireSupabaseUser();
  if (!user) return NextResponse.json({ role: 'none' }, { status: 401 });

  try {
    const role = await getTimetableUserRole();
    return NextResponse.json({ role, userId: user.id });
  } catch (error) {
    console.error('Failed to load timetable role:', error);
    return NextResponse.json({ role: 'none' }, { status: 500 });
  }
}
