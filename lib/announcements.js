import { createClient } from './supabase/server';
import { logServerError } from './server-error';

export async function getActiveAnnouncement() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logServerError('site.get_announcement', error);
    return null;
  }
  return data;
}
