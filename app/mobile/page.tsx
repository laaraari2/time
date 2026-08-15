'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  Clock3,
  LogOut,
  Plus,
  RefreshCw,
  School,
  UserRound,
  Users,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { SavedScheduleProfile } from '../types';

const daysFallback = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

type MobileView = 'projects' | 'schedule' | 'remaining';

export default function MobilePage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [profiles, setProfiles] = useState<SavedScheduleProfile[]>([]);
  const [selected, setSelected] = useState<SavedScheduleProfile | null>(null);
  const [view, setView] = useState<MobileView>('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/timetable/profiles', { cache: 'no-store' });
      if (!response.ok) throw new Error(`profiles:${response.status}`);
      const data = await response.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل المشاريع.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setLoggedIn(Boolean(data.session));
      setSessionReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!active) return;
      setLoggedIn(Boolean(authSession));
      setSessionReady(true);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loggedIn) void loadProfiles();
  }, [loggedIn]);

  const openProject = (profile: SavedScheduleProfile) => {
    setSelected(profile);
    setView('schedule');
  };

  const logout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setSelected(null);
    setLoggedIn(false);
  };

  if (!sessionReady) {
    return <div dir="rtl" className="mobile-page flex min-h-screen items-center justify-center bg-slate-100 text-sm font-bold text-slate-500">جاري التحقق...</div>;
  }

  if (!loggedIn) {
    return (
      <main dir="rtl" className="mobile-page min-h-screen bg-gradient-to-br from-[#123E70] via-[#20518D] to-[#2B68B1] p-4">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md items-center">
          <div className="w-full rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#20518D]"><CalendarDays className="h-8 w-8" /></div>
            <h1 className="mt-5 text-center text-2xl font-black text-slate-900">TimeTables Mobile</h1>
            <p className="mt-2 text-center text-sm leading-6 text-slate-500">نسخة الهاتف لإدارة مشاريعك ومراجعة استعمال الزمن بسرعة.</p>
            <a href="/" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#20518D] px-4 py-3.5 text-sm font-black text-white shadow-lg">تسجيل الدخول <ChevronLeft className="h-4 w-4" /></a>
            <p className="mt-3 text-center text-[11px] font-semibold text-slate-400">يتم استعمال نفس حساب Supabase والبيانات نفسها.</p>
          </div>
        </div>
      </main>
    );
  }

  const project = selected;
  const days = project?.config?.days?.length ? project.config.days : daysFallback;

  return (
    <main dir="rtl" className="mobile-page min-h-screen bg-slate-100 pb-24">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-[#123E70]/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] text-white backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold text-white/70"><CalendarDays className="h-4 w-4 text-amber-300" /> TimeTables Mobile</div>
            <h1 className="mt-1 truncate text-lg font-black">{project?.name || 'مشاريعي'}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => void loadProfiles()} aria-label="تحديث" className="rounded-xl bg-white/10 p-2.5 active:scale-95"><RefreshCw className="h-4 w-4" /></button>
            <button onClick={() => void logout()} aria-label="خروج" className="rounded-xl bg-red-500/20 p-2.5 active:scale-95"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-3 pt-3">
        {!project && view !== 'projects' && (
          <button onClick={() => setView('projects')} className="mb-3 flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"><ChevronLeft className="h-4 w-4" /> المشاريع</button>
        )}

        {view === 'projects' && (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div><p className="text-[11px] font-bold text-slate-500">مساحة العمل</p><h2 className="text-xl font-black text-slate-900">مشاريعك</h2></div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#20518D]">{profiles.length}</span>
            </div>

            {loading && <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500">جاري تحميل المشاريع...</div>}
            {!loading && error && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm font-bold text-red-700">{error}<button onClick={() => void loadProfiles()} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs text-white">إعادة المحاولة</button></div>}
            {!loading && !error && profiles.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><School className="mx-auto h-10 w-10 text-[#20518D]" /><h3 className="mt-3 font-black text-slate-900">لا توجد مشاريع</h3><p className="mt-1 text-xs leading-5 text-slate-500">أنشئ المشروع من نسخة الكمبيوتر وسيظهر هنا مباشرة.</p><a href="/" className="mt-4 inline-flex items-center gap-1 rounded-xl bg-[#20518D] px-4 py-2.5 text-xs font-black text-white">إنشاء مشروع <Plus className="h-4 w-4" /></a></div>
            )}

            <div className="grid gap-3">
              {!loading && !error && profiles.map((profile) => {
                const placed = Array.isArray(profile.placements) ? profile.placements.length : 0;
                const lessons = Array.isArray(profile.lessons) ? profile.lessons.length : 0;
                return (
                  <button key={profile.id} onClick={() => openProject(profile)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm active:scale-[0.99]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#20518D]"><School className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1"><h3 className="truncate font-black text-slate-900">{profile.name}</h3><p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{profile.config?.schoolName || 'مؤسسة تعليمية'}</p></div>
                      <ChevronLeft className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px] font-black"><span className="rounded-lg bg-slate-50 p-2 text-slate-600">{profile.classes?.length || 0} أقسام</span><span className="rounded-lg bg-blue-50 p-2 text-blue-700">{lessons} حصص</span><span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">{placed} مبرمجة</span></div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {project && view === 'schedule' && <MobileSchedule project={project} days={days} />}
        {project && view === 'remaining' && <MobileRemaining project={project} />}
      </div>

      {project && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="mx-auto grid max-w-xl grid-cols-3 gap-1">
            <button onClick={() => setView('projects')} className={`rounded-xl px-2 py-2 text-[10px] font-black ${view === 'projects' ? 'bg-blue-50 text-[#20518D]' : 'text-slate-500'}`}><School className="mx-auto mb-1 h-4 w-4" />المشاريع</button>
            <button onClick={() => setView('schedule')} className={`rounded-xl px-2 py-2 text-[10px] font-black ${view === 'schedule' ? 'bg-blue-50 text-[#20518D]' : 'text-slate-500'}`}><CalendarDays className="mx-auto mb-1 h-4 w-4" />الجدول</button>
            <button onClick={() => setView('remaining')} className={`rounded-xl px-2 py-2 text-[10px] font-black ${view === 'remaining' ? 'bg-amber-50 text-amber-700' : 'text-slate-500'}`}><Clock3 className="mx-auto mb-1 h-4 w-4" />المتبقي</button>
          </div>
        </nav>
      )}
    </main>
  );
}

function MobileSchedule({ project, days }: { project: SavedScheduleProfile; days: string[] }) {
  const [dayIndex, setDayIndex] = useState(0);
  const day = days[dayIndex] || days[0];
  const placements = Array.isArray(project.placements) ? project.placements : [];
  const lessons = Array.isArray(project.lessons) ? project.lessons : [];
  const periods = project.config?.periods || [];

  const items = placements
    .filter((p) => p.dayIndex === dayIndex)
    .sort((a, b) => a.periodIndex - b.periodIndex)
    .map((placement) => {
      const lesson = lessons.find((l) => l.id === placement.lessonId);
      if (!lesson) return null;
      return { placement, lesson };
    })
    .filter(Boolean) as Array<{ placement: SavedScheduleProfile['placements'][number]; lesson: SavedScheduleProfile['lessons'][number] }>;

  return (
    <section>
      <div className="mb-3 overflow-x-auto pb-1"><div className="flex min-w-max gap-1.5">{days.map((name, index) => <button key={`${name}-${index}`} onClick={() => setDayIndex(index)} className={`rounded-xl px-4 py-2.5 text-xs font-black ${index === dayIndex ? 'bg-[#20518D] text-white shadow-md' : 'bg-white text-slate-600'}`}>{name}</button>)}</div></div>
      <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold text-slate-500">برنامج اليوم</p><h2 className="text-lg font-black text-slate-900">{day}</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-[#20518D]">{items.length} حصص</span></div>
      {items.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500">لا توجد حصص مبرمجة لهذا اليوم.</div> : <div className="space-y-2">{items.map(({ placement, lesson }) => { const subject = project.subjects.find(s => s.id === lesson.subjectId); const teacher = project.teachers.find(t => t.id === lesson.teacherId); const cls = project.classes.find(c => c.id === lesson.classGroupId); const period = periods[placement.periodIndex]; return <article key={placement.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start gap-3"><div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-slate-50 p-2 text-center"><Clock3 className="h-4 w-4 text-[#20518D]" /><span className="mt-1 text-[10px] font-black text-slate-700">{period?.startTime || ''}</span><span className="text-[9px] font-bold text-slate-400">{period?.endTime || ''}</span></div><div className="min-w-0 flex-1"><h3 className="font-black text-slate-900">{subject?.name || lesson.subjectId}</h3><div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] font-bold"><span className="rounded-lg bg-blue-50 px-2 py-1.5 text-blue-700"><School className="mr-1 inline h-3 w-3" />{cls?.code || 'قسم'}</span><span className="rounded-lg bg-emerald-50 px-2 py-1.5 text-emerald-700"><UserRound className="mr-1 inline h-3 w-3" />{teacher?.name || 'أستاذ'}</span></div></div></div></article>; })}</div>}
    </section>
  );
}

function MobileRemaining({ project }: { project: SavedScheduleProfile }) {
  const status = useMemo(() => {
    const placements = Array.isArray(project.placements) ? project.placements : [];
    const lessons = Array.isArray(project.lessons) ? project.lessons : [];
    const result: Array<{ teacher: string; subject: string; cls: string; required: number; scheduled: number; remaining: number }> = [];

    for (const teacher of project.teachers || []) {
      for (const assignment of teacher.weeklyHoursAssignments || []) {
        const required = Math.max(0, Number(assignment.weeklyHours ?? assignment.hours) || 0);
        const classId = assignment.classGroupId || assignment.classId;
        if (!assignment.subjectId || !classId || !required) continue;
        let scheduled = 0;
        const counted = new Set<string>();
        for (const placement of placements) {
          const lesson = lessons.find(l => l.id === placement.lessonId);
          if (!lesson || lesson.teacherId !== teacher.id || lesson.classGroupId !== classId || lesson.subjectId !== assignment.subjectId) continue;
          if (placement.doubleGroupId) {
            if (counted.has(placement.doubleGroupId)) continue;
            counted.add(placement.doubleGroupId);
            scheduled += 2;
          } else scheduled += lesson.isDoublePeriod ? 2 : 1;
        }
        const subject = project.subjects.find(s => s.id === assignment.subjectId);
        const cls = project.classes.find(c => c.id === classId);
        result.push({ teacher: teacher.name, subject: subject?.name || assignment.subjectId, cls: cls?.code || classId, required, scheduled, remaining: Math.max(0, required - scheduled) });
      }
    }
    return result;
  }, [project]);

  const missing = status.filter(item => item.remaining > 0);

  return <section><div className="mb-3 rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold text-slate-500">انطلاقاً من إسناد الأقسام</p><h2 className="text-lg font-black text-slate-900">الحصص المتبقية</h2></div><div className="rounded-xl bg-amber-50 p-2 text-amber-700"><Clock3 className="h-5 w-5" /></div></div><div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] font-black"><span className="rounded-lg bg-slate-50 p-2">{status.reduce((n, x) => n + x.required, 0)} مطلوب</span><span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">{status.reduce((n, x) => n + x.scheduled, 0)} منجز</span><span className="rounded-lg bg-amber-50 p-2 text-amber-800">{missing.reduce((n, x) => n + x.remaining, 0)} متبقي</span></div></div>{missing.length === 0 ? <div className="rounded-2xl bg-emerald-50 p-7 text-center text-sm font-black text-emerald-800"><CheckCircle2 className="mx-auto mb-2 h-8 w-8" />كل الإسنادات مكتملة.</div> : <div className="space-y-2">{missing.map((item, index) => <article key={`${item.teacher}-${item.cls}-${item.subject}-${index}`} className="rounded-2xl border border-amber-200 bg-white p-3 shadow-sm"><div className="flex items-start gap-3"><div className="rounded-xl bg-amber-50 p-2 text-amber-700"><AlertTriangle className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h3 className="font-black text-slate-900">{item.subject}</h3><p className="mt-1 text-[10px] font-bold text-slate-500">{item.cls} · {item.teacher}</p><div className="mt-2 flex items-center justify-between text-[10px] font-black"><span>المطلوب {item.required} س</span><span className="rounded-lg bg-amber-100 px-2 py-1 text-amber-800">باقي {item.remaining} س</span></div></div></div></article>)}</div>}<a href="/" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#20518D] px-4 py-3 text-xs font-black text-white"><ExternalLink className="h-4 w-4" /> فتح النسخة الكاملة</a></section>;
}
