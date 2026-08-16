import { NextResponse } from 'next/server';
import { requireSupabaseUser } from '../../../lib/supabase/server';

export async function GET() {
  const { supabase, user } = await requireSupabaseUser();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.rpc('get_accessible_projects');
  if (error) {
    console.error('Failed to load teacher timetable:', error);
    return NextResponse.json({ success: false, error: 'تعذر تحميل جدول الأستاذ' }, { status: 500 });
  }

  const projects = Array.isArray(data) ? data : [];
  return NextResponse.json({ success: true, projects });
}
