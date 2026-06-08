import { createSupabaseBrowserClient } from './supabase-browser';

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  localImportDone: boolean;
}

function rowToProfile(row: {
  id: string;
  display_name: string;
  avatar_url: string | null;
  local_import_done: boolean;
}): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    localImportDone: row.local_import_done,
  };
}

export async function getMyProfile(): Promise<UserProfile | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, avatar_url, local_import_done')
    .maybeSingle();

  if (error || !data) return null;
  return rowToProfile(data);
}

export async function upsertProfile(profile: {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: profile.id,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl ?? null,
    });

  if (error) {
    console.warn('upsertProfile error:', error.message);
    return false;
  }
  return true;
}

export async function updateDisplayName(displayName: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({ display_name: displayName });

  if (error) {
    console.warn('updateDisplayName error:', error.message);
    return false;
  }
  return true;
}

export async function markLocalImportDone(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await supabase
    .from('user_profiles')
    .update({ local_import_done: true });
  // fire-and-forget, same pattern as bot analytics
}
