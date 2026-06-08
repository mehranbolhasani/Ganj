'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { UserCircle, LogOut, Heart, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMyProfile } from '@/lib/user-profile-api';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function AuthAvatar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getMyProfile().then((profile) => {
        if (profile) {
          setDisplayName(profile.displayName);
          setAvatarUrl(profile.avatarUrl);
        }
      });
    }
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push('/');
  };

  if (loading) return null;

  // Logged out state
  if (!user) {
    return (
      <Link
        href="/auth"
        className="p-2 rounded-lg text-foreground hover:bg-primary/10 hover:backdrop-blur-xs transition-colors flex items-center gap-1 cursor-pointer"
        aria-label="ورود"
      >
        <UserCircle size={20} />
      </Link>
    );
  }

  const initial = displayName.trim().charAt(0) || user.email?.charAt(0) || '؟';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border border-border hover:ring-2 hover:ring-ring transition-all focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="منوی کاربر"
        aria-expanded={dropdownOpen}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-9 h-9 object-cover"
          />
        ) : (
          <div className="w-9 h-9 bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-sm font-bold text-stone-600 dark:text-stone-300">
            {initial}
          </div>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-card dark:bg-warning/10 border border-border rounded-xl shadow-lg shadow-primary/5 z-50 overflow-hidden">
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted dark:hover:bg-secondary transition-colors"
            >
              <User size={16} />
              <span>پروفایل</span>
            </Link>
            <Link
              href="/bookmarks"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted dark:hover:bg-secondary transition-colors"
            >
              <Heart size={16} />
              <span>علاقه‌مندی‌ها</span>
            </Link>
            <div className="my-1 border-t border-border" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={16} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
