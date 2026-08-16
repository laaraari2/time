'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CalendarDays, LockKeyhole, Mail, Smartphone } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

async function redirectByRole() {
  const response = await fetch('/api/timetable/me', { cache: 'no-store' });
  const data = await response.json().catch(() => ({ role: 'manager' }));
  window.location.replace(data.role === 'teacher' ? '/mobile-v2/teacher' : '/mobile-v2');
}

export default function MobileLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void redirectByRole();
      else setChecking(false);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('المرجو إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError('بيانات الدخول غير صحيحة أو الحساب غير مفعّل.');
        return;
      }
      await redirectByRole();
    } catch (err) {
      console.error(err);
      setError('تعذر الاتصال بخدمة تسجيل الدخول.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return <main dir="rtl" className="min-h-screen grid place-items-center bg-slate-100 font-bold">جاري التحقق من الجلسة...</main>;
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-br from-[#123E70] via-[#20518D] to-[#2B68B1] p-4 grid place-items-center">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#20518D]"><Smartphone className="h-8 w-8" /></div>
        <div className="mt-4 text-center"><h1 className="text-2xl font-black">TimeTables Mobile</h1><p className="mt-2 text-xs leading-5 text-slate-500">سجّل الدخول للوصول إلى فضاءك حسب صلاحيتك.</p></div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div><label htmlFor="mobile-email" className="mb-1.5 block text-xs font-black">حساب الدخول</label><div className="relative"><Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="mobile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="PROF001@prof.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-3 text-sm outline-none focus:border-[#2B68B1] focus:bg-white" /></div><p className="mt-1 text-[9px] font-bold text-slate-400">مثال للأستاذ: PROF001@prof.com</p></div>
          <div><label htmlFor="mobile-password" className="mb-1.5 block text-xs font-black">كلمة المرور</label><div className="relative"><LockKeyhole className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="mobile-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="أدخل كلمة المرور" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-3 text-sm outline-none focus:border-[#2B68B1] focus:bg-white" /></div></div>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div>}
          <button disabled={submitting} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#20518D] py-3 text-sm font-black text-white disabled:opacity-60"><CalendarDays className="h-4 w-4" />{submitting ? 'جاري الدخول...' : 'تسجيل الدخول'}</button>
        </form>
        <p className="mt-5 text-center text-[9px] font-bold text-slate-400">المدير يدخل للوحة المؤسسة، والأستاذ يدخل مباشرة إلى جدوله.</p>
      </div>
    </main>
  );
}
