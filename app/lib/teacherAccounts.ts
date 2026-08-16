import { createSupabaseAdminClient } from './supabase/admin';

export async function syncTeacherAccounts(projectId: string, teachers: Array<{ id?: string | null }>) {
  const admin = createSupabaseAdminClient();
  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const usersByEmail = new Map((existingUsers.users ?? []).map((user) => [user.email?.toLowerCase(), user]));

  for (const teacher of teachers) {
    const teacherId = String(teacher.id ?? '').trim();
    if (!teacherId) continue;

    const email = `${teacherId}@prof.com`.toLowerCase();
    const password = teacherId;
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
