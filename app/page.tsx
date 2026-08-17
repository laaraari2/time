'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from './lib/supabase/browser';
import { Users, Calendar, Sparkles } from 'lucide-react';

import { SavedScheduleProfile } from './types';
import { Dashboard } from './components/Dashboard';
import { TimetableApp } from './TimetableApp';

async function getTimetableRole(): Promise<'manager' | 'teacher' | 'none'> {
  try {
    const response = await fetch('/api/timetable/me', {
      cache: 'no-store',
    });
    if (!response.ok) return 'none';

    const data = await response.json();
    if (
      data?.role === 'manager' ||
      data?.role === 'teacher' ||
      data?.role === 'none'
    ) {
      return data.role;
    }
  } catch (error) {
    console.error('Failed to resolve timetable role:', error);
  }

  return 'none';
}

function LoginScreen({
  onLogin,
}: {
  onLogin: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError('المرجو إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    try {
      setError('');
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError('بيانات الدخول غير صحيحة أو الحساب غير مفعّل.');
        return;
      }

      onLogin();
    } catch (authError) {
      console.error(authError);
      setError('تعذر الاتصال بخدمة تسجيل الدخول. تأكد من إعداد Supabase.');
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 px-4 py-6 sm:px-6 lg:py-10"
    >
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] items-center justify-center">
        <div className="w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200 lg:h-[470px] lg:flex">
          {/* BRAND / PRESENTATION */}
          <section className="relative overflow-hidden bg-gradient-to-br from-[#123E70] via-[#20518D] to-[#2B68B1] p-6 text-white sm:p-7 lg:w-1/2 lg:p-8">
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-amber-300/10" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-black backdrop-blur-sm">
                  <Calendar className="h-4 w-4 text-amber-300" />
                  TimeTables
                </div>

                <h1 className="mt-6 text-2xl font-black leading-tight sm:text-3xl">
                  نظّم وقتك،
                  <br />
                  <span className="text-amber-300">وابنِ جدولك بثقة.</span>
                </h1>

                <p className="mt-3 max-w-md text-[13px] leading-6 text-white/75 sm:text-sm">
                  منصة واحدة لإعداد استعمال الزمن، تنظيم الأساتذة والأقسام
                  والقاعات، ثم إنشاء جدول واضح وسهل التسيير.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-center lg:mt-0">
                <div className="relative w-48 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-xl backdrop-blur-sm rotate-[-2deg] sm:w-60">
                  <div className="flex h-6 items-center gap-1 rounded-t-lg bg-white/15 px-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </div>

                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 15 }).map((_, index) => (
                      <div
                        key={index}
                        className={`h-3.5 rounded ${
                          index % 5 === 1
                            ? 'bg-amber-300/80'
                            : index % 4 === 0
                              ? 'bg-white/40'
                              : 'bg-white/15'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="absolute -bottom-4 -right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-900 shadow-lg rotate-[8deg]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[11px] text-white/55">
                  كل مشروع مستقل، وكل جدول يبدأ من اختيارك.
                </p>
                <div className="mt-2 text-[10px] font-semibold text-white/45">
                  © 2026 TimeTables · Developed by مصطفى لعرعاري · MUSTAPHA LAARAARI
                </div>
              </div>
            </div>
          </section>

          {/* LOGIN */}
          <section className="flex items-center bg-white p-6 sm:p-7 lg:w-1/2 lg:p-8">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-4">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#20518D]">
                  <Users className="h-5 w-5" />
                </div>

                <h2 className="text-2xl font-black text-slate-900">
                  مرحباً بك
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  سجّل الدخول للانتقال إلى مساحة مشاريعك.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-xs font-black text-slate-700"
                  >
                    البريد الإلكتروني
                  </label>

                  <div className="relative">
                    <Users className="absolute right-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      autoComplete="username"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-10 pl-4 text-sm text-slate-900 outline-none transition focus:border-[#2B68B1] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-xs font-black text-slate-700"
                  >
                    كلمة المرور
                  </label>

                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="أدخل كلمة المرور"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#2B68B1] focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#20518D] to-[#2B68B1] py-2.5 text-sm font-black text-white shadow-lg transition hover:brightness-110 active:scale-[0.99]"
                >
                  تسجيل الدخول
                </button>

                <div className="flex items-center justify-between pt-1 text-[10px] font-semibold text-slate-400">
                  <span>TimeTables</span>
                  <span>مساحة عمل منظمة وآمنة</span>
                </div>
              </form>

              <div className="mt-5 border-t border-slate-100 pt-4 text-center text-[10px] font-semibold text-slate-400">
                تطوير وبرمجة
                <span className="mx-1 font-black text-slate-600">
                  مصطفى لعرعاري
                </span>
                · MUSTAPHA LAARAARI
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [selectedProfile, setSelectedProfile] =
    useState<SavedScheduleProfile | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        const role = await getTimetableRole();

        if (!active) return;

        if (role === 'teacher') {
          window.location.replace('/mobile-v2/teacher');
          return;
        }

        setIsLoggedIn(true);
      }

      setAuthReady(true);
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;

      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setSelectedProfile(null);
        setShowDashboard(true);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    const role = await getTimetableRole();

    if (role === 'teacher') {
      window.location.replace('/mobile-v2/teacher');
      return;
    }

    setIsLoggedIn(true);
    setShowDashboard(true);
    setSelectedProfile(null);
  };

  const handleLogout = () => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.signOut();
    setSelectedProfile(null);
    setShowDashboard(true);
    setIsLoggedIn(false);
  };

  if (!authReady) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-100"
      >
        <div className="rounded-xl bg-white px-6 py-4 text-sm font-bold text-slate-600 shadow-sm">
          جاري التحقق من الجلسة...
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (showDashboard) {
    return (
      <Dashboard
        onOpenProfile={(profile) => {
          setSelectedProfile(profile);
          setShowDashboard(false);
        }}
        onCreateSchedule={() => {
          setSelectedProfile(null);
          setShowDashboard(false);
        }}
      />
    );
  }

  return (
    <TimetableApp
      initialProfile={selectedProfile}
      openNewSchedule={!selectedProfile}
      onBackToDashboard={() => {
        setSelectedProfile(null);
        setShowDashboard(true);
      }}
      onLogout={handleLogout}
    />
  );
}
