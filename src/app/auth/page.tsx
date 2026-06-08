'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://www.ganj.directory/auth/callback',
      },
    });
    if (error) {
      setError('خطا در ورود با گوگل. لطفاً دوباره امتحان کنید.');
      setGoogleLoading(false);
    }
    // On success, browser navigates away - no need to setGoogleLoading(false)
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setMagicLinkLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: 'https://www.ganj.directory/auth/callback',
      },
    });
    setMagicLinkLoading(false);
    if (error) {
      setError('خطا در ارسال لینک. لطفاً دوباره امتحان کنید.');
    } else {
      setMagicLinkSent(true);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-card/80 dark:bg-warning/10 backdrop-blur-sm rounded-3xl border border-border p-8 shadow-lg shadow-primary/5">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            ورود به دفتر گنج
          </h1>
          <p className="text-muted-foreground dark:text-secondary-foreground text-sm">
            برای همگام‌سازی علاقه‌مندی‌هایتان وارد شوید
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-stone-800 border border-border hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <span className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>{googleLoading ? 'در حال ورود...' : 'ورود با گوگل'}</span>
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-card dark:bg-transparent text-muted-foreground">یا</span>
          </div>
        </div>

        {/* Magic Link */}
        {magicLinkSent ? (
          <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <p className="text-emerald-700 dark:text-emerald-300 text-sm">
              لینک ورود به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید.
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                ورود با ایمیل
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ایمیل شما"
                required
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-base"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={magicLinkLoading || !email.trim()}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {magicLinkLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  در حال ارسال...
                </span>
              ) : (
                'ارسال لینک ورود'
              )}
            </button>
          </form>
        )}

        {/* Back to home */}
        <div className="mt-8 text-center space-y-2">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
          >
            بازگشت به صفحه اصلی
          </Link>
          <p className="text-sm text-muted-foreground">
            با ورود به سایت،{" "}
            <Link
              href="/privacy"
              className="underline hover:text-foreground transition-colors"
            >
              سیاست حریم خصوصی
            </Link>{" "}
            ما را می‌پذیرید.
          </p>
        </div>
      </div>
    </div>
  );
}
