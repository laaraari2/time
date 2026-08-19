'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, LogOut, RefreshCw, School } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import type { SavedScheduleProfile } from '../../types';

const fallbackDays = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

type TeacherProject = SavedScheduleProfile;
type Row = { id: string; dayIndex: number; periodIndex: number; day: string; start: string; end: string; subject: string; className: string };

export default function TeacherMobilePage() {
  const [project, setProject] = useState<TeacherProject | null>(null);
  const [day, setDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/timetable/teacher', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? 'تعذر تحميل الجدول');
      setProject((Array.isArray(data.projects) ? data.projects[0] : null) as TeacherProject | null);
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل جدولك. تأكد أن الحساب مربوط بالأستاذ.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const days = project?.config.days?.length ? project.config.days : fallbackDays;
  const schoolName = project?.config.schoolName?.trim() || project?.name || 'المؤسسة';
  const schoolLogo = project?.config.schoolLogo;
  const teacherName = project?.teachers?.[0]?.name || 'الأستاذ';

  const rows = useMemo<Row[]>(() => {
    if (!project) return [];
    return project.placements.map((placement) => {
      const lesson = project.lessons.find((item) => item.id === placement.lessonId);
      if (!lesson) return null;
      const subject = project.subjects.find((item) => item.id === lesson.subjectId);
      const classGroup = project.classes.find((item) => item.id === lesson.classGroupId);
      const period = project.config.periods[placement.periodIndex];
      return { id: placement.id, dayIndex: placement.dayIndex, periodIndex: placement.periodIndex, day: days[placement.dayIndex] ?? fallbackDays[placement.dayIndex] ?? '', start: period?.startTime ?? '', end: period?.endTime ?? '', subject: subject?.name ?? 'مادة', className: classGroup?.code ?? classGroup?.name ?? 'قسم' };
    }).filter((item): item is Row => Boolean(item)).sort((a, b) => a.dayIndex - b.dayIndex || a.periodIndex - b.periodIndex);
  }, [project, days]);

  const todayRows = rows.filter((row) => row.dayIndex === day);
  const assignedClasses = project?.classes ?? [];

  if (loading) return <main dir="rtl" className="min-h-screen grid place-items-center bg-slate-100 font-bold">جاري تحميل جدولك...</main>;

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 pb-8">
      <header className="sticky top-0 z-40 bg-[#123E70] px-4 pb-4 pt-[max(12px,env(safe-area-inset-top))] text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">
            {schoolLogo ? <img src={schoolLogo} alt="شعار المؤسسة" className="h-full w-full object-contain p-1" /> : <School className="h-6 w-6 text-[#20518D]" />}
          </div>
          <div className="min-w-0 flex-1"><p className="text-[10px] text-white/60">TimeTables — فضاء الأستاذ</p><h1 className="truncate text-lg font-black">{schoolName}</h1><p className="truncate text-[10px] text-white/75">الأستاذ(ة): {teacherName}</p></div>
          <button type="button" onClick={() => void load()} className="rounded-xl bg-white/10 p-2" aria-label="تحديث"><RefreshCw className="h-5 w-5" /></button>
          <button type="button" onClick={async () => { await createSupabaseBrowserClient().auth.signOut(); window.location.replace('/mobile-v2/login'); }} className="rounded-xl bg-red-500/20 p-2" aria-label="تسجيل الخروج"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>

      <div className="mx-auto max-w-xl p-3">
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</div> : !project ? <div className="rounded-2xl bg-white p-7 text-center font-bold text-slate-500">لا يوجد جدول مربوط بهذا الحساب.</div> : <>
          <section className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-base font-black">الأقسام المسندة إليك</h2><p className="mt-1 text-[10px] text-slate-500">هذه الأقسام فقط مرتبطة بجدولك.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-[#20518D]">{assignedClasses.length} أقسام</span></div>
            {assignedClasses.length > 0 ? <div className="flex gap-2 overflow-x-auto pb-1">{assignedClasses.map((item) => <span key={item.id} className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">{item.code}</span>)}</div> : <p className="rounded-xl bg-slate-50 p-3 text-center text-xs font-bold text-slate-500">لا توجد أقسام مسندة حالياً.</p>}
          </section>

          <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm"><div className="flex gap-2 overflow-x-auto pb-1">{days.map((name, index) => <button key={`${name}-${index}`} type="button" onClick={() => setDay(index)} className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black ${day === index ? 'bg-[#20518D] text-white' : 'bg-slate-100 text-slate-600'}`}>{name}</button>)}</div></div>

          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-xl font-black">{days[day]}</h2><p className="text-[10px] text-slate-500">جدول الحصص الخاص بك فقط</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-[#20518D]">{todayRows.length} حصص</span></div>

          {todayRows.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500">لا توجد حصص مبرمجة لك هذا اليوم.</div> : <div className="space-y-2">{todayRows.map((row) => <article key={row.id} className="rounded-2xl bg-white p-3 shadow-sm"><div className="flex items-center gap-3"><div className="w-20 shrink-0 rounded-xl bg-blue-50 p-2 text-center text-[#20518D]"><Clock3 className="mx-auto h-4 w-4" /><b className="mt-1 block text-[10px]">{row.start}</b><small className="text-[9px] text-slate-400">{row.end}</small></div><div className="min-w-0 flex-1"><b className="block text-base">{row.subject}</b><span className="text-[10px] text-slate-500">{row.className}</span></div></div></article>)}</div>}

          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-[#20518D]"><CalendarDays className="h-5 w-5" /><b>الأسبوع</b></div><p className="mt-1 text-[10px] text-slate-500">مجموع الحصص المبرمجة لك: <b>{rows.length}</b></p></div>
        </>}
      </div>
    </main>
  );
}
