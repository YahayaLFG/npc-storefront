import { createClient } from './supabase/server';

export async function getActiveAnnouncement() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getActiveAnnouncement error:', error.message);
    return null;
  }
  return data;
}
