'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, LogOut, RefreshCw, School, UserRound, BookOpen, Network, Clock3 } from 'lucide-react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { SavedScheduleProfile } from '../types';

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

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/timetable/profiles', { cache: 'no-store' });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      setProfiles(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) { setLogged(Boolean(data.session)); setReady(true); } });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (active) setLogged(Boolean(session)); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (logged) void load(); }, [logged]);

  if (!ready) return <div dir="rtl" className="min-h-screen grid place-items-center bg-slate-100 font-bold">جاري التحقق...</div>;
  if (!logged) return <main dir="rtl" className="min-h-screen bg-gradient-to-br from-[#123E70] to-[#2B68B1] p-4 grid place-items-center"><div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl"><CalendarDays className="mx-auto h-12 w-12 text-[#20518D]"/><h1 className="mt-4 text-2xl font-black">TimeTables Mobile</h1><p className="mt-2 text-sm text-slate-500">نفس حساب وبيانات نسخة الكمبيوتر.</p><a href="/" className="mt-6 block rounded-2xl bg-[#20518D] p-4 font-black text-white">تسجيل الدخول</a></div></main>;

  if (!project) return <ProjectPicker profiles={profiles} loading={loading} onRefresh={load} onOpen={(p) => { setProject(p); setClassId(p.classes?.[0]?.id || ''); setTeacherId(p.teachers?.[0]?.id || ''); }}/>} 

  const days = project.config?.days?.length ? project.config.days : fallbackDays;
  const classes = project.classes || [];
  const teachers = project.teachers || [];

  return <main dir="rtl" className="min-h-screen bg-slate-100 pb-24">
    <header className="sticky top-0 z-40 bg-[#123E70] px-4 pb-3 pt-[max(10px,env(safe-area-inset-top))] text-white"><div className="flex items-center justify-between gap-3"><button onClick={() => setProject(null)} className="rounded-xl bg-white/10 p-2"><ChevronLeft/></button><div className="min-w-0 flex-1"><p className="text-[10px] text-white/60">TimeTables Mobile</p><h1 className="truncate font-black">{project.name}</h1></div><button onClick={() => void load()} className="rounded-xl bg-white/10 p-2"><RefreshCw/></button><button onClick={async()=>{await createSupabaseBrowserClient().auth.signOut();setLogged(false)}} className="rounded-xl bg-red-500/20 p-2"><LogOut/></button></div></header>
    <div className="mx-auto max-w-xl p-3">
      {view === 'schedule' && <Schedule project={project} classes={classes} classId={classId} setClassId={setClassId} days={days} day={day} setDay={setDay}/>} 
      {view === 'assignments' && <Assignments project={project}/>} 
      {view === 'teachers' && <TeacherPlan project={project} teachers={teachers} teacherId={teacherId} setTeacherId={setTeacherId}/>} 
      {view === 'structure' && <Structure project={project}/>} 
    </div>
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 px-1 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,.08)]"><div className="mx-auto grid max-w-xl grid-cols-4 gap-1"><Nav active={view==='schedule'} icon={<CalendarDays/>} label="الجداول" onClick={()=>setView('schedule')}/><Nav active={view==='assignments'} icon={<BookOpen/>} label="الإسنادات" onClick={()=>setView('assignments')}/><Nav active={view==='teachers'} icon={<UserRound/>} label="الأساتذة" onClick={()=>setView('teachers')}/><Nav active={view==='structure'} icon={<Network/>} label="بنية الأقسام" onClick={()=>setView('structure')}/></div></nav>
  </main>;
}

function Nav({active,icon,label,onClick}:{active:boolean;icon:React.ReactNode;label:string;onClick:()=>void}) { return <button onClick={onClick} className={`rounded-xl p-2 text-[9px] font-black ${active?'bg-blue-50 text-[#20518D]':'text-slate-500'}`}><span className="mx-auto mb-1 block h-4 w-4">{icon}</span>{label}</button>; }

function ProjectPicker({profiles,loading,onRefresh,onOpen}:{profiles:SavedScheduleProfile[];loading:boolean;onRefresh:()=>void;onOpen:(p:SavedScheduleProfile)=>void}) { return <main dir="rtl" className="min-h-screen bg-slate-100 p-3"><header className="mx-auto max-w-xl rounded-2xl bg-[#123E70] p-4 text-white"><div className="flex items-center justify-between"><div><p className="text-[10px] text-white/60">TimeTables</p><h1 className="text-xl font-black">اختر المشروع</h1></div><button onClick={onRefresh} className="rounded-xl bg-white/10 p-2"><RefreshCw/></button></div></header><div className="mx-auto mt-3 max-w-xl space-y-3">{loading?<div className="rounded-2xl bg-white p-8 text-center font-bold">جاري التحميل...</div>:profiles.length===0?<div className="rounded-2xl bg-white p-8 text-center font-bold text-slate-500">لا توجد مشاريع. أنشئ المشروع من نسخة الكمبيوتر.</div>:profiles.map(p=><button key={p.id} onClick={()=>onOpen(p)} className="w-full rounded-2xl bg-white p-4 text-right shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-[#20518D]"><School/></span><div className="min-w-0 flex-1"><b className="block truncate">{p.name}</b><small className="text-slate-500">{p.classes?.length||0} أقسام · {p.teachers?.length||0} أساتذة</small></div><ChevronLeft/></div></button>)}</div></main>; }

function Schedule({project,classes,classId,setClassId,days,day,setDay}:{project:SavedScheduleProfile;classes:SavedScheduleProfile['classes'];classId:string;setClassId:(v:string)=>void;days:string[];day:number;setDay:(v:number)=>void}) { const lessons=project.lessons||[]; const placements=project.placements||[]; const rows=placements.filter(p=>p.dayIndex===day).map(p=>({p,l:lessons.find(l=>l.id===p.lessonId)})).filter(x=>x.l?.classGroupId===classId).sort((a,b)=>a.p.periodIndex-b.p.periodIndex); return <section><div className="rounded-2xl bg-white p-3 shadow-sm"><label className="mb-2 block text-xs font-black">القسم</label><select value={classId} onChange={e=>setClassId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold">{classes.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}</select></div><div className="my-3 flex gap-2 overflow-x-auto pb-1">{days.map((d,i)=><button key={d} onClick={()=>setDay(i)} className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black ${i===day?'bg-[#20518D] text-white':'bg-white text-slate-600'}`}>{d}</button>)}</div><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">جدول الحصص</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-[#20518D]">{rows.length} حصص</span></div>{rows.length===0?<Empty text="لا توجد حصص مبرمجة لهذا اليوم."/>:<div className="space-y-2">{rows.map(({p,l})=>{const subject=project.subjects?.find(s=>s.id===l?.subjectId);const teacher=project.teachers?.find(t=>t.id===l?.teacherId);const period=project.config?.periods?.[p.periodIndex];return <article key={p.id} className="rounded-2xl bg-white p-3 shadow-sm"><div className="flex gap-3"><div className="w-16 shrink-0 rounded-xl bg-blue-50 p-2 text-center"><Clock3 className="mx-auto h-4 w-4 text-[#20518D]"/><b className="block text-[10px]">{period?.startTime||''}</b><small className="text-[9px] text-slate-400">{period?.endTime||''}</small></div><div><b>{subject?.name||'مادة'}</b><p className="mt-1 text-[10px] text-slate-500">{teacher?.name||'أستاذ'}</p></div></div></article>})}</div>}</section>; }

function Assignments({project}:{project:SavedScheduleProfile}) { const rows=(project.teachers||[]).flatMap(t=>(t.weeklyHoursAssignments||[]).map(a=>({t,a}))); return <section><h2 className="mb-3 text-xl font-black">إسناد الأقسام</h2><div className="space-y-2">{rows.length?rows.map(({t,a},i)=>{const c=project.classes?.find(c=>c.id===(a.classGroupId||a.classId));const s=project.subjects?.find(s=>s.id===a.subjectId);return <article key={i} className="rounded-2xl bg-white p-3 shadow-sm"><b>{c?.code||'قسم'}</b><p className="text-xs text-slate-500">{s?.name||'مادة'} · {t.name}</p><span className="text-[10px] font-black text-[#20518D]">{a.weeklyHours??a.hours??0} ساعات/أسبوع</span></article>}):<Empty text="لا توجد إسنادات."/>}</div></section>; }

function TeacherPlan({project,teachers,teacherId,setTeacherId}:{project:SavedScheduleProfile;teachers:SavedScheduleProfile['teachers'];teacherId:string;setTeacherId:(v:string)=>void}) { const teacher=teachers.find(t=>t.id===teacherId); const lessons=(project.lessons||[]).filter(l=>l.teacherId===teacherId); return <section><div className="rounded-2xl bg-white p-3 shadow-sm"><label className="mb-2 block text-xs font-black">الأستاذ</label><select value={teacherId} onChange={e=>setTeacherId(e.target.value)} className="w-full rounded-xl border p-3 font-bold">{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div><div className="my-3 rounded-2xl bg-white p-4"><h2 className="font-black">مخطط {teacher?.name||'الأستاذ'}</h2><p className="mt-1 text-xs text-slate-500">{lessons.length} حصص مسجلة في المشروع.</p></div>{lessons.map(l=>{const s=project.subjects?.find(s=>s.id===l.subjectId);const c=project.classes?.find(c=>c.id===l.classGroupId);return <article key={l.id} className="mb-2 rounded-2xl bg-white p-3 shadow-sm"><b>{s?.name||'مادة'}</b><p className="text-xs text-slate-500">{c?.code||'قسم'}</p></article>})}</section>; }

function Structure({project}:{project:SavedScheduleProfile}) { return <section><h2 className="mb-3 text-xl font-black">بنية الأقسام</h2><div className="grid grid-cols-2 gap-2">{(project.classes||[]).map(c=><article key={c.id} className="rounded-2xl bg-white p-4 shadow-sm"><School className="mb-2 h-5 w-5 text-[#20518D]"/><b>{c.code}</b><p className="mt-1 text-[10px] text-slate-500">{c.name}</p>{c.studentCount!==undefined&&<p className="mt-2 text-[10px] font-bold">{c.studentCount} تلميذ</p>}</article>)}</div></section>; }
function Empty({text}:{text:string}) { return <div className="rounded-2xl bg-white p-8 text-center font-bold text-slate-500">{text}</div>; }
