'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useAuth } from '@/hooks/useAuth';
import { getMyProfile, updateDisplayName } from '@/lib/user-profile-api';
import Image from 'next/image';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        setLoading(true);
        const profile = await getMyProfile();
        if (profile) {
          setDisplayName(profile.displayName);
          setAvatarUrl(profile.avatarUrl);
        }
        setLoading(false);
      };
      loadProfile();
    }
  }, [user]);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    setSaved(false);
    const success = await updateDisplayName(displayName.trim());
    setSaving(false);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const initial = displayName.trim().charAt(0) || user.email?.charAt(0) || '؟';

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md grid gap-4">

        <div className="flex items-center gap-4">

          {/* Avatar */}
          <div className="flex justify-center">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={80}
                height={80}
                className="w-20 h-20 rounded-md object-cover border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-2xl font-bold text-stone-600 dark:text-stone-300 border-2 border-border">
                {initial}
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="flex-1">
            <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-2">
              نام نمایشی
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-base"
            />
          </div>

        </div>

        <div className="flex flex-row-reverse justify-start gap-4">

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !displayName.trim()}
            className="w-fit h-10 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span className="sr-only">در حال ذخیره...</span>
              </span>
            ) : (
              'ذخیره'
            )}
          </button>

          {/* Success Message */}
          {saved && (
            <div className="px-6 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm text-center">
              نام شما ذخیره شد
            </div>
          )}

        </div>


        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="fixed w-fit bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded-full bg-destructive/25 border border-destructive text-destructive hover:bg-destructive/10 transition-colors font-medium backdrop-blur-md"
        >
          خروج از حساب
        </button>
      </div>
    </div>
  );
}
