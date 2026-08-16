import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Subscribes to changes on the profiles table and invokes onChange.
 * The mobile UI can re-fetch the affected profile after a change so it
 * always uses the same server-side shape as the desktop application.
 */
export function subscribeToProfileChanges(
  supabase: SupabaseClient,
  ownerId: string,
  onChange: () => void,
) {
  const channel = supabase
    .channel(`timetable-profiles:${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `owner_id=eq.${ownerId}`,
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
