import { createSupabaseAdminClient } from './supabase/admin';
import { getTeacherAuthPassword } from './teacherAuth';

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
    const password = getTeacherAuthPassword(loginId);
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

    // A teacher code identifies one login account per project. If the same
    // login account is already linked to another teacher in this project,
    // keep the existing mapping instead of failing the whole project save
    // on the unique (project_id, user_id) constraint.
    const { data: existingAccount, error: existingAccountError } = await admin
      .from('teacher_accounts')
      .select('teacher_id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingAccountError) throw existingAccountError;
    if (existingAccount && existingAccount.teacher_id !== teacherId) continue;

    const { error: accountError } = await admin
      .from('teacher_accounts')
      .upsert(
        { project_id: projectId, teacher_id: teacherId, user_id: user.id },
        { onConflict: 'project_id,teacher_id' }
      );

    if (accountError) throw accountError;
  }
}
