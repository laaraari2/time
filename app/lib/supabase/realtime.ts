import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED';

/**
 * Subscribe to project-row changes for the current owner.
 * The callback re-fetches the project through the normal API so the mobile
 * UI always receives the same server-side shape as the desktop application.
 */
export function subscribeToProjectChanges(
  supabase: SupabaseClient,
  ownerId: string,
  onChange: () => void,
  onStatus?: (status: RealtimeStatus) => void,
) {
  const channel: RealtimeChannel = supabase
    .channel(`timetable-projects:${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `owner_id=eq.${ownerId}`,
      },
      (payload) => {
        console.info('[Realtime] projects change received', payload.eventType, payload.new);
        onChange();
      },
    )
    .subscribe((status) => {
      console.info('[Realtime] subscription status:', status);
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        onStatus?.(status);
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
