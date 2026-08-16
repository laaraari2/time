'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarDays, ChevronLeft, LogOut, RefreshCw, School, UserRound, BookOpen, Network, Clock3 } from 'lucide-react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import type { SavedScheduleProfile, ClassGroup, Teacher, TimePeriod } from '../types';

type View = 'schedule' | 'assignments' | 'teachers' | 'structure';
const fallbackDays = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function MobileV2() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [profiles, setProfiles] = useState<SavedScheduleProfile[]>([]);
  const [project, setProject] = useState<SavedScheduleProfile | null>(null);
  const [view, setView] = useState<View>('schedule');
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [day, setDay] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadProfiles() {
    setLoading(true);
    try {
      const response = await fetch('/api/timetable/profiles', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load profiles: ${response.status}`);
      const data: unknown = await response.json();
      setProfiles(Array.isArray(data) ? (data as SavedScheduleProfile[]) : []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setLogged(Boolean(data.session));
        setReady(true);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setLogged(Boolean(session));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (logged) void loadProfiles();
  }, [logged]);

  if (!ready) return <div dir="rtl" className="min-h-screen grid place-items-center bg-slate-100 font-bold">جاري التحقق...</div>;

  if (!logged) {
    return (
      <main dir="rtl" className="min-h-screen bg-gradient-to-br from-[#123E70] to-[#2B68B1] p-4 grid place-items-center">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
          <CalendarDays className="mx-auto h-12 w-12 text-[#20518D]" />
          <h1 className="mt-4 text-2xl font-black">TimeTables Mobile</h1>
          <p className="mt-2 text-sm text-slate-500">نفس حساب وبيانات نسخة الكمبيوتر.</p>
          <a href="/mobile-v2/login" className="mt-6 block rounded-2xl bg-[#20518D] p-4 font-black text-white">تسجيل الدخول</a>
        </div>
      </main>
    );
  }

  if (!project) {
    return <ProjectPicker profiles={profiles} loading={loading} onRefresh={loadProfiles} onOpen={(selected) => {
      setProject(selected);
      setClassId(selected.classes[0]?.id ?? '');
      setTeacherId(selected.teachers[0]?.id ?? '');
    }} />;
  }

  const days = project.config.days.length > 0 ? project.config.days : fallbackDays;
  const classes = project.classes;
  const teachers = project.teachers;

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 pb-24">
      <header className="sticky top-0 z-40 bg-[#123E70] px-4 pb-3 pt-[max(10px,env(safe-area-inset-top))] text-white">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => setProject(null)} className="rounded-xl bg-white/10 p-2" aria-label="العودة"><ChevronLeft /></button>
          <div className="min-w-0 flex-1"><p className="text-[10px] text-white/60">TimeTables Mobile</p><h1 className="truncate font-black">{project.name}</h1></div>
          <button type="button" onClick={() => void loadProfiles()} className="rounded-xl bg-white/10 p-2" aria-label="تحديث"><RefreshCw /></button>
          <button type="button" onClick={async () => { await createSupabaseBrowserClient().auth.signOut(); setLogged(false); setProject(null); }} className="rounded-xl bg-red-500/20 p-2" aria-label="تسجيل الخروج"><LogOut /></button>
        </div>
      </header>

      <div className="mx-auto max-w-xl p-3">
        {view === 'schedule' && <Schedule project={project} classes={classes} classId={classId} setClassId={setClassId} days={days} day={day} setDay={setDay} />}
        {view === 'assignments' && <Assignments project={project} />}
        {view === 'teachers' && <TeacherPlan project={project} teachers={teachers} teacherId={teacherId} setTeacherId={setTeacherId} />}
        {view === 'structure' && <Structure project={project} />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 px-1 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,.08)]">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
          <Nav active={view === 'schedule'} icon={<CalendarDays />} label="الجداول" onClick={() => setView('schedule')} />
          <Nav active={view === 'assignments'} icon={<BookOpen />} label="الإسنادات" onClick={() => setView('assignments')} />
          <Nav active={view === 'teachers'} icon={<UserRound />} label="الأساتذة" onClick={() => setView('teachers')} />
          <Nav active={view === 'structure'} icon={<Network />} label="بنية الأقسام" onClick={() => setView('structure')} />
        </div>
      </nav>
    </main>
  );
}

function Nav({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-xl p-2 text-[9px] font-black ${active ? 'bg-blue-50 text-[#20518D]' : 'text-slate-500'}`}><span className="mx-auto mb-1 block h-4 w-4">{icon}</span>{label}</button>;
}

function ProjectPicker({ profiles, loading, onRefresh, onOpen }: { profiles: SavedScheduleProfile[]; loading: boolean; onRefresh: () => void; onOpen: (profile: SavedScheduleProfile) => void }) {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 p-3">
      <header className="mx-auto max-w-xl rounded-2xl bg-[#123E70] p-4 text-white"><div className="flex items-center justify-between"><div><p className="text-[10px] text-white/60">TimeTables</p><h1 className="text-xl font-black">اختر المشروع</h1></div><button type="button" onClick={onRefresh} className="rounded-xl bg-white/10 p-2" aria-label="تحديث"><RefreshCw /></button></div></header>
      <div className="mx-auto mt-3 max-w-xl space-y-3">
        {loading ? <div className="rounded-2xl bg-white p-8 text-center font-bold">جاري التحميل...</div> : profiles.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center font-bold text-slate-500">لا توجد مشاريع. أنشئ المشروع من نسخة الكمبيوتر.</div> : profiles.map((profile) => <button type="button" key={profile.id} onClick={() => onOpen(profile)} className="w-full rounded-2xl bg-white p-4 text-right shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-[#20518D]"><School /></span><div className="min-w-0 flex-1"><b className="block truncate">{profile.name}</b><small className="text-slate-500">{profile.classes.length} أقسام · {profile.teachers.length} أساتذة</small></div><ChevronLeft /></div></button>)}
      </div>
    </main>
  );
}

function Schedule({ project, classes, classId, setClassId, days, day, setDay }: { project: SavedScheduleProfile; classes: ClassGroup[]; classId: string; setClassId: (value: string) => void; days: string[]; day: number; setDay: (value: number) => void }) {
  const lessons = project.lessons;
  const placements = project.placements;
  const rows = placements.filter((placement) => placement.dayIndex === day).map((placement) => ({ placement, lesson: lessons.find((lesson) => lesson.id === placement.lessonId) })).filter(({ lesson }) => lesson?.classGroupId === classId).sort((a, b) => a.placement.periodIndex - b.placement.periodIndex);

  return (
    <section>
      <div className="rounded-2xl bg-white p-3 shadow-sm"><label className="mb-2 block text-xs font-black" htmlFor="mobile-class">القسم</label><select id="mobile-class" value={classId} onChange={(event) => setClassId(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold">{classes.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></div>
      <div className="my-3 flex gap-2 overflow-x-auto pb-1">{days.map((name, index) => <button type="button" key={`${name}-${index}`} onClick={() => setDay(index)} className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black ${index === day ? 'bg-[#20518D] text-white' : 'bg-white text-slate-600'}`}>{name}</button>)}</div>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">جدول الحصص</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-[#20518D]">{rows.length} حصص</span></div>
      {rows.length === 0 ? <Empty text="لا توجد حصص مبرمجة لهذا اليوم." /> : <div className="space-y-2">{rows.map(({ placement, lesson }) => <ScheduleCard key={placement.id} placementPeriod={placement.periodIndex} lesson={lesson} periods={project.config.periods} subjects={project.subjects} teachers={project.teachers} />)}</div>}
    </section>
  );
}

function ScheduleCard({ placementPeriod, lesson, periods, subjects, teachers }: { placementPeriod: number; lesson: SavedScheduleProfile['lessons'][number] | undefined; periods: TimePeriod[]; subjects: SavedScheduleProfile['subjects']; teachers: Teacher[] }) {
  const subject = subjects.find((item) => item.id === lesson?.subjectId);
  const teacher = teachers.find((item) => item.id === lesson?.teacherId);
  const period = periods[placementPeriod];
  return <article className="rounded-2xl bg-white p-3 shadow-sm"><div className="flex gap-3"><div className="w-16 shrink-0 rounded-xl bg-blue-50 p-2 text-center"><Clock3 className="mx-auto h-4 w-4 text-[#20518D]" /><b className="block text-[10px]">{period?.startTime ?? ''}</b><small className="text-[9px] text-slate-400">{period?.endTime ?? ''}</small></div><div><b>{subject?.name ?? 'مادة'}</b><p className="mt-1 text-[10px] text-slate-500">{teacher?.name ?? 'أستاذ'}</p></div></div></article>;
}

function Assignments({ project }: { project: SavedScheduleProfile }) {
  const teacherCards = project.teachers.map((teacher) => {
    const assignments = (teacher.weeklyHoursAssignments ?? [])
      .map((assignment) => {
        const classGroupId = assignment.classGroupId || assignment.classId || '';
        const weeklyHours = Number(assignment.weeklyHours ?? assignment.hours ?? 0) || 0;
        const classGroup = project.classes.find((item) => item.id === classGroupId);
        const subject = project.subjects.find((item) => item.id === assignment.subjectId);
        return { assignment, classGroup, subject, weeklyHours };
      })
      .filter((item) => item.classGroup && item.weeklyHours > 0);

    const totalHours = assignments.reduce((sum, item) => sum + item.weeklyHours, 0);
    return { teacher, assignments, totalHours };
  });

  const assignedTeachers = teacherCards.filter((item) => item.assignments.length > 0);
  const unassignedTeachers = teacherCards.filter((item) => item.assignments.length === 0);
  const totalHours = assignedTeachers.reduce((sum, item) => sum + item.totalHours, 0);

  return (
    <section>
      <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">إسناد الأقسام</h2>
            <p className="mt-1 text-[11px] text-slate-500">كل أستاذ والأقسام المسندة إليه وعدد الساعات الأسبوعية.</p>
          </div>
          <div className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-center">
            <b className="block text-lg font-black text-emerald-700">{totalHours}</b>
            <span className="text-[9px] font-bold text-emerald-700">ساعة/أسبوع</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
          <div className="rounded-xl bg-slate-50 p-2">الأساتذة المسندون <b className="text-[#20518D]">{assignedTeachers.length}</b></div>
          <div className="rounded-xl bg-slate-50 p-2">مجموع الأساتذة <b className="text-[#20518D]">{project.teachers.length}</b></div>
        </div>
      </div>

      {assignedTeachers.length > 0 && (
        <div className="space-y-3">
          {assignedTeachers.map(({ teacher, assignments, totalHours: teacherTotal }) => (
            <article key={teacher.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b bg-[#123E70] p-3 text-white">
                <div className="min-w-0">
                  <b className="block truncate">{teacher.name}</b>
                  {teacher.code ? <span className="text-[9px] text-white/70">{teacher.code}</span> : null}
                </div>
                <div className="shrink-0 rounded-xl bg-white/15 px-3 py-1.5 text-center">
                  <b className="block text-base">{teacherTotal}</b>
                  <span className="text-[8px] text-white/75">ساعات</span>
                </div>
              </div>
              <div className="divide-y">
                {assignments.map(({ assignment, classGroup, subject, weeklyHours }, index) => (
                  <div key={`${teacher.id}-${assignment.classGroupId || assignment.classId || index}`} className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0"><b className="block text-sm">{classGroup?.code ?? classGroup?.name ?? 'قسم'}</b><span className="text-[10px] text-slate-500">{subject?.name ?? 'مادة غير محددة'}</span></div>
                    <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-[#20518D]">{weeklyHours} س</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {unassignedTeachers.length > 0 && (
        <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm"><h3 className="font-black">أساتذة بدون إسناد</h3><div className="mt-2 flex flex-wrap gap-2">{unassignedTeachers.map(({ teacher }) => <span key={teacher.id} className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700">{teacher.name}</span>)}</div></div>
      )}
    </section>
  );
}

function TeacherPlan({ project, teachers, teacherId, setTeacherId }: { project: SavedScheduleProfile; teachers: Teacher[]; teacherId: string; setTeacherId: (value: string) => void }) {
  const teacher = teachers.find((item) => item.id === teacherId) ?? teachers[0];
  const rows = teacher ? project.placements.map((placement) => ({ placement, lesson: project.lessons.find((lesson) => lesson.id === placement.lessonId) })).filter(({ lesson }) => lesson?.teacherId === teacher.id).sort((a, b) => a.placement.dayIndex - b.placement.dayIndex || a.placement.periodIndex - b.placement.periodIndex) : [];
  return <section><div className="rounded-2xl bg-white p-3 shadow-sm"><label htmlFor="mobile-teacher" className="mb-2 block text-xs font-black">الأستاذ</label><select id="mobile-teacher" value={teacher?.id ?? ''} onChange={(event) => setTeacherId(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold">{teachers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="my-3 flex items-center justify-between"><h2 className="text-lg font-black">مخطط الأستاذ</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-[#20518D]">{rows.length} حصص</span></div>{rows.length === 0 ? <Empty text="لا توجد حصص مبرمجة لهذا الأستاذ." /> : <div className="space-y-2">{rows.map(({ placement, lesson }) => { const subject = project.subjects.find((item) => item.id === lesson?.subjectId); const classGroup = project.classes.find((item) => item.id === lesson?.classGroupId); const period = project.config.periods[placement.periodIndex]; return <article key={placement.id} className="rounded-2xl bg-white p-3 shadow-sm"><b>{subject?.name ?? 'مادة'}</b><p className="mt-1 text-[10px] text-slate-500">{classGroup?.code ?? 'قسم'} · {project.config.days[placement.dayIndex] ?? fallbackDays[placement.dayIndex] ?? ''} · {period?.startTime ?? ''}</p></article>; })}</div>}</section>;
}

function Structure({ project }: { project: SavedScheduleProfile }) {
  const levels = new Map<string, ClassGroup[]>();
  project.classes.forEach((item) => { const key = item.gradeLevel || 'أقسام'; const list = levels.get(key) ?? []; list.push(item); levels.set(key, list); });
  return <section><div className="mb-3 grid grid-cols-3 gap-2"><Stat value={project.classes.length} label="الأقسام" /><Stat value={project.classes.reduce((sum, item) => sum + Number(item.studentCount || 0), 0)} label="التلاميذ" /><Stat value={project.subjects.length} label="المواد" /></div>{[...levels.entries()].map(([level, items]) => <div key={level} className="mb-3 overflow-hidden rounded-2xl bg-white shadow-sm"><div className="border-b bg-slate-50 p-3"><b>{level}</b><span className="mr-2 text-[9px] text-slate-400">{items.length} أقسام</span></div>{items.map((item) => <div key={item.id} className="border-b p-3 last:border-b-0"><div className="flex items-center justify-between"><div><b>{item.code}</b><p className="text-[10px] text-slate-500">{item.name}</p></div><span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-black text-[#20518D]">{item.studentCount || 0} تلميذ</span></div></div>)}</div>)}</section>;
}

function Stat({ value, label }: { value: number; label: string }) { return <div className="rounded-2xl bg-white p-3 text-center shadow-sm"><b className="block text-lg">{value}</b><span className="text-[9px] font-bold text-slate-500">{label}</span></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500 shadow-sm">{text}</div>; }
