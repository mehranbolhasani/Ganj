'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useBookmarks, removeBookmark } from '@/lib/bookmarks-manager';
import { useToast } from '@/components/Toast';
import { toPersianDigits } from '@/lib/persian-digits';
import { useAuth } from '@/hooks/useAuth';
import { getMyProfile, markLocalImportDone } from '@/lib/user-profile-api';
import { getCloudBookmarks, removeCloudBookmark, bulkImportBookmarks } from '@/lib/cloud-bookmarks-api';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, Cancel01Icon, HeartIcon, ListViewIcon } from '@hugeicons/core-free-icons';

const NUDGE_KEY = 'ganj_auth_nudge_dismissed';

export default function BookmarksPage() {
  const { bookmarks: localBookmarks, loading: localLoading } = useBookmarks();
  const { toast } = useToast();
  const { user } = useAuth();

  const [cloudBookmarks, setCloudBookmarks] = useState<typeof localBookmarks>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [profile, setProfile] = useState<{ localImportDone: boolean } | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [removingBookmark, setRemovingBookmark] = useState<{poemId: number; title: string} | null>(null);

  // Load nudge dismissed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNudgeDismissed(localStorage.getItem(NUDGE_KEY) === 'true');
    }
  }, []);

  // Load profile when logged in
  useEffect(() => {
    if (user) {
      getMyProfile().then((p) => setProfile(p ?? { localImportDone: false }));
    } else {
      setProfile(null);
    }
  }, [user]);

  // Load cloud bookmarks when in cloud mode
  useEffect(() => {
    if (user && profile) {
      const needsImport = !profile.localImportDone && localBookmarks.length > 0;
      if (!needsImport) {
        setCloudLoading(true);
        getCloudBookmarks().then((cloud) => {
          setCloudBookmarks(cloud);
          setCloudLoading(false);
        });
      }
    }
  }, [user, profile, localBookmarks]);

  const dismissNudge = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NUDGE_KEY, 'true');
    }
    setNudgeDismissed(true);
  }, []);

  const handleImport = async () => {
    const ids = localBookmarks.map((b) => b.poemId);
    if (ids.length === 0) return;
    setImporting(true);
    try {
      await bulkImportBookmarks(ids);
      await markLocalImportDone();
      const cloud = await getCloudBookmarks();
      setCloudBookmarks(cloud);
      setProfile((prev) => (prev ? { ...prev, localImportDone: true } : { localImportDone: true }));
      toast.success('انتقال انجام شد', `${toPersianDigits(ids.length)} نشانک به حساب شما منتقل شد`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('خطا', 'خطا در انتقال نشانک‌ها');
    } finally {
      setImporting(false);
    }
  };

  const handleSkipImport = async () => {
    await markLocalImportDone();
    setProfile((prev) => (prev ? { ...prev, localImportDone: true } : { localImportDone: true }));
    const cloud = await getCloudBookmarks();
    setCloudBookmarks(cloud);
  };

  // Determine active bookmarks and loading state
  const isGuest = !user;
  const needsImport = user && profile && !profile.localImportDone && localBookmarks.length > 0;
  const isCloud = user && !needsImport;

  const activeBookmarks = isCloud ? cloudBookmarks : localBookmarks;
  const loading = isCloud ? cloudLoading : localLoading;

  // Group bookmarks by poet
  const bookmarksByPoet = useMemo(() => {
    const grouped: Record<string, typeof activeBookmarks> = {};
    activeBookmarks.forEach((bookmark) => {
      if (!grouped[bookmark.poetName]) {
        grouped[bookmark.poetName] = [];
      }
      grouped[bookmark.poetName].push(bookmark);
    });
    return grouped;
  }, [activeBookmarks]);

  // Track current time for time ago calculations
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: number): string => {
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;
    if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;
    if (days < 7) return `${toPersianDigits(days)} روز پیش`;
    return new Date(timestamp).toLocaleDateString('fa-IR');
  };

  const handleRemoveBookmark = (poemId: number, title: string) => {
    setRemovingBookmark({ poemId, title });
  };

  const confirmRemove = async () => {
    if (removingBookmark) {
      try {
        if (isCloud) {
          await removeCloudBookmark(removingBookmark.poemId);
          setCloudBookmarks((prev) => prev.filter((b) => b.poemId !== removingBookmark.poemId));
        } else {
          await removeBookmark(removingBookmark.poemId);
        }
        toast.success('حذف شد', 'شعر از علاقه‌مندی‌ها حذف شد');
        setRemovingBookmark(null);
      } catch (error) {
        console.error('Failed to remove bookmark:', error);
        toast.error('خطا', 'خطا در حذف علاقه‌مندی');
      }
    }
  };

  const cancelRemove = () => {
    setRemovingBookmark(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground dark:text-secondary-foreground">در حال بارگذاری علاقه‌مندی‌ها...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full min-h-fit bg-primary/5 p-6 rounded-3xl flex flex-col gap-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <HugeiconsIcon icon={HeartIcon} size={32} className="text-destructive" />
          <h1 className="text-3xl font-bold text-foreground">علاقه‌مندی‌ها</h1>
        </div>
        <p className="text-muted-foreground dark:text-secondary-foreground">
          {toPersianDigits(activeBookmarks.length)} شعر در علاقه‌مندی‌های شما
        </p>
      </div>

      {/* Guest nudge banner */}
      {isGuest && !nudgeDismissed && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-border mb-4">
          <div className="flex-1">
            <p className="text-sm text-foreground">
              برای همگام‌سازی علاقه‌مندی‌ها در دستگاه‌های مختلف،{' '}
              <Link href="/auth" className="text-warning hover:underline font-medium">
                وارد شوید
              </Link>
            </p>
          </div>
          <button
            onClick={dismissNudge}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            aria-label="بستن"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>
      )}

      {/* Import prompt banner */}
      {needsImport && (
        <div className="flex flex-col gap-3 px-4 py-4 rounded-xl bg-warning/10 border border-warning/30 mb-4">
          <p className="text-sm text-foreground">
            {toPersianDigits(localBookmarks.length)} نشانک محلی پیدا شد. آیا می‌خواهید آن‌ها را به حساب خود منتقل کنید؟
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'در حال انتقال...' : 'بله، انتقال بده'}
            </button>
            <button
              onClick={handleSkipImport}
              disabled={importing}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors text-sm font-medium disabled:opacity-50"
            >
              نه، از نو شروع کن
            </button>
          </div>
        </div>
      )}

      {/* localStorage notice (guest only) */}
      {isGuest && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground mb-4">
          <span className="shrink-0 mt-0.5" aria-hidden="true">💾</span>
          <p>
            علاقه‌مندی‌ها فقط در این مرورگر ذخیره می‌شوند و با پاک کردن داده‌های مرورگر یا تغییر دستگاه از بین می‌روند.
          </p>
        </div>
      )}

      {/* Cloud notice (logged in) */}
      {isCloud && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground mb-4">
          <span className="shrink-0 mt-0.5" aria-hidden="true">☁️</span>
          <p>
            علاقه‌مندی‌های شما در حساب کاربری ذخیره شده و در دستگاه‌های مختلف همگام‌سازی می‌شوند.
          </p>
        </div>
      )}

      {/* Bookmarks List */}
      {activeBookmarks.length === 0 ? (
        <div className="text-center py-12">
          <HugeiconsIcon icon={HeartIcon} size={64} className="text-secondary-foreground dark:text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-foreground mb-2">هنوز علاقه‌مندی‌ای ندارید</h3>
          <p className="text-muted-foreground mb-6">شعرهای مورد علاقه خود را با کلیک روی آیکون قلب ذخیره کنید</p>
          <Link href="/" className="inline-block px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors">
            شروع جستجو
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(bookmarksByPoet).map(([poetName, poetBookmarks]) => (
            <div key={poetName} className="bg-card/50 dark:bg-warning/20 rounded-xl p-4 border border-white dark:border-warning/50">
              {/* Poet Header - Only show if there are multiple poets */}
              {Object.keys(bookmarksByPoet).length > 1 && (
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border justify-between">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={ListViewIcon} size={16} className="text-muted-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">{poetName}</h2>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="text-sm text-muted-foreground">{toPersianDigits(poetBookmarks.length)} شعر</span>
                  </div>
                </div>
              )}

              {/* Bookmarks List - More compact layout */}
              <div className="space-y-2">
                {poetBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-start gap-3 p-1 rounded-lg hover:bg-muted dark:hover:bg-secondary transition-colors group mb-8"
                  >
                    <div className="flex-1 min-w-0">
                      <Link href={bookmark.url} className="block">
                        <h3 className="font-medium text-foreground text-right mb-1 hover:text-secondary-foreground dark:hover:text-secondary-foreground transition-colors truncate">
                          {bookmark.title}
                        </h3>
                        {bookmark.categoryTitle && (
                          <p className="text-sm text-muted-foreground text-right truncate">{bookmark.categoryTitle}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <HugeiconsIcon icon={Calendar01Icon} size={14} />
                          <span>{formatTimeAgo(bookmark.timestamp)}</span>
                        </div>
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveBookmark(bookmark.poemId, bookmark.title);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-destructive/10 dark:hover:bg-destructive/20 text-destructive hover:text-destructive dark:hover:text-red-300 transition-all duration-200"
                        title="حذف از علاقه‌مندی‌ها"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {removingBookmark && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                  <HugeiconsIcon icon={Cancel01Icon} size={20} className="text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">حذف از علاقه‌مندی‌ها</h3>
                  <p className="text-sm text-muted-foreground">این عمل قابل بازگشت نیست</p>
                </div>
              </div>

              <p className="text-secondary-foreground mb-6">
                آیا مطمئن هستید که می‌خواهید <span className="font-medium">&quot;{removingBookmark.title}&quot;</span> را از علاقه‌مندی‌هایتان حذف کنید؟
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelRemove}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground dark:hover:text-secondary-foreground transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmRemove}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-primary-foreground rounded-lg transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
