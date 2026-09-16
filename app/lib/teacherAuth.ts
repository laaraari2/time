const SHORT_TEACHER_PASSWORD_SUFFIX = '__tt';

/**
 * Supabase requires passwords to be at least 6 characters long.
 * Keep the teacher code as the user-facing credential while deriving a
 * deterministic internal password only when the code is too short.
 */
export function getTeacherAuthPassword(loginId: string): string {
  const value = loginId.trim();
  return value.length >= 6 ? value : `${value}${SHORT_TEACHER_PASSWORD_SUFFIX}`;
}

export function normalizeTeacherLoginEmail(loginId: string): string {
  return `${encodeURIComponent(loginId.trim()).replace(/%/g, '_').toLowerCase()}@prof.com`;
}
