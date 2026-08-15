'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronRight, RefreshCw, School, Users, BookOpen, Clock3 } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import type { SavedScheduleProfile } from '../../types';

export default function MobileStructure() {
  const [profile, setProfile] = useState<SavedScheduleProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/timetable/profiles', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load profiles: ${response.status}`);
      const data: unknown = await response.json();
      const profiles = Array.isArray(data) ? (data as SavedScheduleProfile[]) : [];
      setProfile(profiles[0] ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void load();
      else setLoading(false);
    });
  }, []);

  const groups = useMemo(() => {
    if (!profile) return [];
    const map = new Map<string, SavedScheduleProfile['classes']>();
    for (const item of profile.classes) {
      const level = item.gradeLevel || 'أقسام';
      const list = map.get(level) ?? [];
      list.push(item);
      map.set(level, list);
    }
    return [...map.entries()];
  }, [profile]);

  if (loading) return <main dir="rtl" className="min-h-screen grid place-items-center bg-slate-100 font-bold">جاري تحميل بنية الأقسام...</main>;
  if (!profile) return <main dir="rtl" className="min-h-screen grid place-items-center bg-slate-100 p-6 text-center font-bold">لا توجد بيانات للمشروع.</main>;

  return <main dir="rtl" className="min-h-screen bg-slate-100 pb-8">
    <header className="sticky top-0 z-20 bg-[#123E70] p-4 text-white shadow-lg">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div><p className="text-[10px] text-white/60">TimeTables Mobile</p><h1 className="text-xl font-black">بنية الأقسام</h1><p className="text-[10px] text-white/70">{profile.name}</p></div>
        <button type="button" onClick={() => void load()} className="rounded-xl bg-white/10 p-2" aria-label="تحديث"><RefreshCw /></button>
      </div>
    </header>

    <div className="mx-auto max-w-xl space-y-4 p-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat icon={<School />} value={profile.classes.length} label="الأقسام" />
        <Stat icon={<Users />} value={profile.classes.reduce((n, c) => n + Number(c.studentCount || 0), 0)} label="التلاميذ" />
        <Stat icon={<BookOpen />} value={profile.subjects.length} label="المواد" />
      </div>

      {groups.map(([level, classes]) => <section key={level} className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b bg-slate-50 p-3"><ChevronRight className="h-4 w-4 text-[#20518D]" /><h2 className="font-black">{level}</h2><span className="mr-auto rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black text-[#20518D]">{classes.length} أقسام</span></div>
        <div className="divide-y divide-slate-100">
          {classes.map((item) => {
            const assignments = profile.teachers.flatMap((teacher) => (teacher.weeklyHoursAssignments ?? []).filter((a) => (a.classGroupId || a.classId) === item.id).map((a) => ({ teacher, a })));
            const hours = assignments.reduce((n, { a }) => n + Number(a.weeklyHours ?? a.hours ?? 0), 0);
            const teacherNames = [...new Set(assignments.map(({ teacher }) => teacher.name))];
            return <article key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><b className="block text-base">{item.code}</b><p className="text-xs text-slate-500">{item.name}</p></div><div className="rounded-xl bg-blue-50 px-3 py-2 text-center"><b className="block text-base text-[#20518D]">{item.studentCount || 0}</b><span className="text-[8px] font-bold text-[#20518D]">تلميذ</span></div></div>
              <div className="mt-3 grid grid-cols-2 gap-2"><Info icon={<Clock3 />} label="الساعات المسندة" value={`${hours} ساعة`} /><Info icon={<Users />} label="الأساتذة" value={teacherNames.length ? teacherNames.join('، ') : 'بدون إسناد'} /></div>
            </article>;
          })}
        </div>
      </section>)}
    </div>
  </main>;
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) { return <div className="rounded-2xl bg-white p-3 text-center shadow-sm"><span className="mx-auto mb-1 block w-fit text-[#20518D]">{icon}</span><b className="block text-lg">{value}</b><span className="text-[9px] font-bold text-slate-500">{label}</span></div>; }
function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-2"><div className="flex items-center gap-1 text-[8px] font-bold text-slate-400"><span className="h-3 w-3">{icon}</span>{label}</div><p className="mt-1 text-[10px] font-bold text-slate-700">{value}</p></div>; }
