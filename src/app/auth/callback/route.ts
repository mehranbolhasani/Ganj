import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-auth-server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;

      // Determine display name and avatar from provider metadata
      const meta = user.user_metadata ?? {};
      const displayName: string =
        meta.full_name ?? meta.name ?? meta.email ?? user.email ?? '';
      const avatarUrl: string | null =
        meta.avatar_url ?? meta.picture ?? null;

      // 1. Insert only if not exists (ignoreDuplicates skips on conflict)
      await supabase.from('user_profiles').upsert(
        { id: user.id, display_name: displayName, avatar_url: avatarUrl },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      // 2. For returning users, update avatar_url if it changed
      // (display_name intentionally NOT updated - user may have changed it)
      if (avatarUrl) {
        await supabase
          .from('user_profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', user.id)
          .is('avatar_url', null); // Only update if avatar was not set before
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong - redirect to auth page with error param
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}
