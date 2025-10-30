'use client';

import React from 'react';
import { useToast } from '@/components/Toast';

export default function ContactForm(): JSX.Element {
  const { toast } = useToast();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'خطا در ارسال فرم');
      toast.success('پیام شما با موفقیت ارسال شد. متشکرم!');
      setName(''); setEmail(''); setMessage('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطایی رخ داد. لطفاً دوباره تلاش کنید.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-stone-700 dark:text-stone-300 mb-1">نام</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm text-stone-700 dark:text-stone-300 mb-1">ایمیل</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-stone-700 dark:text-stone-300 mb-1">پیام</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={6}
          className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-60"
        >
          {isSubmitting ? 'در حال ارسال...' : 'ارسال'}
        </button>
      </div>
    </form>
  );
}


