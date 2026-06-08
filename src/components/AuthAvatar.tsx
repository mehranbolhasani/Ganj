'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { HugeiconsIcon } from '@hugeicons/react';
import { User02Icon, Logout05Icon, HeartIcon, HistoryIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/hooks/useAuth';
import { getMyProfile } from '@/lib/user-profile-api';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { toPersianDigits } from '@/lib/persian-digits';
import Image from 'next/image';

interface AuthAvatarProps {
  onOpenHistory: () => void;
  historyCount: number;
  bookmarksCount: number;
}

export default function AuthAvatar({ onOpenHistory, historyCount, bookmarksCount }: AuthAvatarProps) {
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

  const initial = user
    ? (displayName.trim().charAt(0) || user.email?.charAt(0) || '؟')
    : '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center justify-center p-3 rounded-lg text-foreground hover:bg-warning/20 dark:hover:bg-destructive/20 active:bg-accent dark:active:bg-destructive/30 transition-colors touch-manipulation"
        aria-label="منوی کاربر"
        aria-expanded={dropdownOpen}
      >
        {user && avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            className="w-9 h-9 object-cover"
          />

        ) : user ? (
          <div className="w-9 h-9 bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-sm font-bold text-stone-600 dark:text-stone-300">
            {initial}
          </div>
          ) : (
          <div className="flex items-center gap-1">
            <HugeiconsIcon icon={User02Icon} size={24} aria-hidden="true" />
            <span className="text-sm">حساب کاربری</span>
          </div>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-card dark:bg-warning/10 border border-border rounded-xl shadow-lg shadow-primary/5 z-50 overflow-hidden">
          <div className="py-1">
            {/* History */}
            <button
              onClick={() => {
                setDropdownOpen(false);
                onOpenHistory();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted dark:hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={HistoryIcon} size={24} aria-hidden="true" />
                <span>تاریخچه</span>
              </div>
              {historyCount > 0 && (
                <span className="bg-muted text-muted-foreground text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold">
                  {historyCount > 9 ? '۹+' : toPersianDigits(historyCount)}
                </span>
              )}
            </button>

            {/* Bookmarks */}
            <Link
              href="/bookmarks"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted dark:hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={HeartIcon} size={24} aria-hidden="true" />
                <span>علاقه‌مندی‌ها</span>
              </div>
              {bookmarksCount > 0 && (
                <span className="bg-destructive/20 text-destructive text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold">
                  {bookmarksCount > 9 ? '۹+' : toPersianDigits(bookmarksCount)}
                </span>
              )}
            </Link>

            <div className="my-1 border-t border-border" />

            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted dark:hover:bg-secondary transition-colors"
                >
                  <HugeiconsIcon icon={User02Icon} size={24} aria-hidden="true" />
                  <span>پروفایل</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <HugeiconsIcon icon={Logout05Icon} size={24} aria-hidden="true" />
                  <span>خروج</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted dark:hover:bg-secondary transition-colors"
              >
                <HugeiconsIcon icon={User02Icon} size={24} aria-hidden="true" />
                <span>ورود / ثبت‌نام</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
