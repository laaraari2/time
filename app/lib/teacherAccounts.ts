import { createSupabaseAdminClient } from './supabase/admin';

type TeacherAccountInput = {
  id?: string | null;
  code?: string | null;
};

export async function syncTeacherAccounts(projectId: string, teachers: TeacherAccountInput[]) {
  const admin = createSupabaseAdminClient();
  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const usersByEmail = new Map((existingUsers.users ?? []).map((user) => [user.email?.toLowerCase(), user]));

  for (const teacher of teachers) {
    const teacherId = String(teacher.id ?? '').trim();
    const loginId = String(teacher.code ?? teacher.id ?? '').trim();
    if (!teacherId || !loginId) continue;

    // The employee-facing teacher code (for example ENS-001) is the
    // teacher's login ID. Keep the internal teacher.id for timetable links.
    const safeLoginId = encodeURIComponent(loginId).replace(/%/g, '_').toLowerCase();
    const email = `${safeLoginId}@prof.com`;
    const password = loginId;
    let user = usersByEmail.get(email);

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      user = data.user;
      usersByEmail.set(email, user);
    }

    const { error: accountError } = await admin
      .from('teacher_accounts')
      .upsert(
        { project_id: projectId, teacher_id: teacherId, user_id: user.id },
        { onConflict: 'project_id,teacher_id' }
      );

    if (accountError) throw accountError;
  }
}
