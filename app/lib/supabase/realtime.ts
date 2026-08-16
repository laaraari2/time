import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Subscribe to project-row changes for the current owner.
 * The callback re-fetches the project through the normal API so the mobile
 * UI always receives the same server-side shape as the desktop application.
 */
export function subscribeToProjectChanges(
  supabase: SupabaseClient,
  ownerId: string,
  onChange: () => void,
) {
  const channel = supabase
    .channel(`timetable-projects:${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `owner_id=eq.${ownerId}`,
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
