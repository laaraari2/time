import { NextResponse } from 'next/server';
import { requireSupabaseUser } from '../../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../../lib/supabase/admin';

async function requireManager() {
  // Authentication is handled here; authorization is enforced per project
  // below using the project's owner_id. This avoids depending on the optional
  // get_timetable_user_role RPC for the manager UI.
  const { supabase, user } = await requireSupabaseUser();
  return { supabase, user };
}

export async function GET(request: Request) {
  try {
    const { user } = await requireManager();
    if (!user) return NextResponse.json({ error: 'غير مصرح.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId مطلوب.' }, { status: 400 });

    const admin = createSupabaseAdminClient();
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id,name,teachers')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!project) return NextResponse.json({ error: 'المشروع غير موجود.' }, { status: 404 });

    const { data: accounts, error: accountsError } = await admin
      .from('teacher_accounts')
      .select('id,teacher_id,user_id,created_at')
      .eq('project_id', projectId);

    if (accountsError) throw accountsError;

    const teachers = Array.isArray(project.teachers) ? project.teachers : [];
    const users = new Map<string, { email?: string; name?: string }>();

    for (const account of accounts ?? []) {
      const { data } = await admin.auth.admin.getUserById(account.user_id);
      if (data.user) {
        users.set(account.user_id, {
          email: data.user.email ?? undefined,
          name: String(data.user.user_metadata?.name ?? ''),
        });
      }
    }

    return NextResponse.json({
      project: { id: project.id, name: project.name },
      teachers: teachers.map((teacher: any) => {
        const account = (accounts ?? []).find((item) => item.teacher_id === teacher.id);
        const accountUser = account ? users.get(account.user_id) : undefined;
        return {
          id: teacher.id,
          code: teacher.code ?? '',
          name: teacher.name ?? '',
          accountId: account?.id ?? null,
          userId: account?.user_id ?? null,
          email: accountUser?.email ?? '',
        };
      }),
    });
  } catch (error) {
    console.error('Teacher accounts GET error:', error);
    return NextResponse.json({ error: 'تعذر تحميل المستخدمين.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireManager();
    if (!user) return NextResponse.json({ error: 'غير مصرح.' }, { status: 403 });

    const body = await request.json();
    const projectId = String(body.projectId ?? '').trim();
    const teacherId = String(body.teacherId ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const displayName = String(body.name ?? '').trim();

    if (!projectId || !teacherId || !email || !password) {
      return NextResponse.json({ error: 'المشروع والأستاذ والبريد وكلمة المرور مطلوبة.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id,teachers')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!project) return NextResponse.json({ error: 'المشروع غير موجود.' }, { status: 404 });

    const teachers = Array.isArray(project.teachers) ? project.teachers : [];
    const teacher = teachers.find((item: any) => item.id === teacherId);
    if (!teacher) return NextResponse.json({ error: 'الأستاذ غير موجود في المشروع.' }, { status: 404 });

    const { data: existing } = await admin
      .from('teacher_accounts')
      .select('id,user_id')
      .eq('project_id', projectId)
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'هذا الأستاذ لديه حساب بالفعل.' }, { status: 409 });
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: displayName || teacher.name,
        role: 'teacher',
      },
    });

    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message ?? 'تعذر إنشاء الحساب.' }, { status: 400 });
    }

    const { error: linkError } = await admin
      .from('teacher_accounts')
      .insert({
        project_id: projectId,
        teacher_id: teacherId,
        user_id: created.user.id,
      });

    if (linkError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw linkError;
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: created.user.id,
        email: created.user.email,
        name: displayName || teacher.name,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Teacher accounts POST error:', error);
    return NextResponse.json({ error: 'تعذر إنشاء حساب الأستاذ.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await requireManager();
    if (!user) return NextResponse.json({ error: 'غير مصرح.' }, { status: 403 });

    const body = await request.json();
    const projectId = String(body.projectId ?? '').trim();
    const teacherId = String(body.teacherId ?? '').trim();
    if (!projectId || !teacherId) return NextResponse.json({ error: 'بيانات الحساب ناقصة.' }, { status: 400 });

    const admin = createSupabaseAdminClient();
    const { data: project } = await admin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!project) return NextResponse.json({ error: 'المشروع غير موجود.' }, { status: 404 });

    const { data: account, error: accountError } = await admin
      .from('teacher_accounts')
      .select('id,user_id')
      .eq('project_id', projectId)
      .eq('teacher_id', teacherId)
      .maybeSingle();
    if (accountError) throw accountError;
    if (!account) return NextResponse.json({ error: 'لا يوجد حساب مرتبط بهذا الأستاذ.' }, { status: 404 });

    const { error: deleteLinkError } = await admin
      .from('teacher_accounts')
      .delete()
      .eq('id', account.id);
    if (deleteLinkError) throw deleteLinkError;

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(account.user_id);
    if (deleteUserError) throw deleteUserError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Teacher accounts DELETE error:', error);
    return NextResponse.json({ error: 'تعذر حذف حساب الأستاذ.' }, { status: 500 });
  }
}
