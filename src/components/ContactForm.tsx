'use client';

import React from 'react';
import { useToast } from '@/components/Toast';

const ContactForm = () => {
  const { toast } = useToast();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (res.status === 429) {
        throw new Error(data?.error || 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً بعداً تلاش کنید.');
      }
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
          <label htmlFor="contact-name" className="block text-sm text-secondary-foreground mb-1">نام</label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-required="true"
            className="w-full rounded-lg border border-input dark:border-border bg-card dark:bg-primary px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm text-secondary-foreground mb-1">ایمیل</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            className="w-full rounded-lg border border-input dark:border-border bg-card dark:bg-primary px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm text-secondary-foreground mb-1">پیام</label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          aria-required="true"
          rows={6}
          className="w-full rounded-lg border border-input dark:border-border bg-card dark:bg-primary px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label={isSubmitting ? 'در حال ارسال پیام' : 'ارسال پیام'}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground dark:text-foreground hover:bg-primary dark:hover:bg-muted disabled:opacity-60"
        >
          {isSubmitting ? 'در حال ارسال...' : 'ارسال'}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;


