'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, KeyRound, Mail, Trash2, UserPlus, Users } from 'lucide-react';

interface ProjectTeacher { id: string; code?: string; name?: string; }
interface Project { id: string; name: string; teachers?: ProjectTeacher[]; }
interface TeacherAccount { id: string; code: string; name: string; accountId: string | null; userId: string | null; email: string; }

export default function UserManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [projectTeachers, setProjectTeachers] = useState<ProjectTeacher[]>([]);
  const [accounts, setAccounts] = useState<TeacherAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const currentTeacher = useMemo(() => projectTeachers.find((teacher) => teacher.id === teacherId), [projectTeachers, teacherId]);

  const loadAccounts = async (selectedProjectId: string) => {
    if (!selectedProjectId) { setAccounts([]); return; }
    try {
      const response = await fetch(`/api/timetable/teacher-accounts?projectId=${encodeURIComponent(selectedProjectId)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'تعذر تحميل حسابات الأساتذة.');
      setAccounts(Array.isArray(data.teachers) ? (data.teachers as TeacherAccount[]).filter((teacher) => Boolean(teacher.accountId)) : []);
    } catch (loadError: unknown) {
      console.error(loadError); setAccounts([]);
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل حسابات الأساتذة.');
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setError('');
        const response = await fetch('/api/timetable/profiles', { cache: 'no-store' });
        if (!response.ok) throw new Error('تعذر تحميل المشاريع.');
        const data = await response.json();
        const nextProjects: Project[] = Array.isArray(data) ? data.map((project: Project) => ({ id: project.id, name: project.name, teachers: Array.isArray(project.teachers) ? project.teachers : [] })) : [];
        setProjects(nextProjects);
        if (nextProjects.length) setProjectId(nextProjects[0].id);
      } catch (loadError) { console.error(loadError); setError('تعذر تحميل المشاريع.'); }
      finally { setLoading(false); }
    };
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!projectId) { setProjectTeachers([]); setAccounts([]); setTeacherId(''); return; }
    const project = projects.find((item) => item.id === projectId);
    setProjectTeachers(project?.teachers ?? []);
    setTeacherId(''); setEmail(''); setPassword('');
    void loadAccounts(projectId);
  }, [projectId, projects]);

  const availableTeachers = useMemo(() => {
    const accountTeacherIds = new Set(accounts.map((account) => account.id));
    return projectTeachers.filter((teacher) => !accountTeacherIds.has(teacher.id));
  }, [projectTeachers, accounts]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!projectId || !teacherId || !email.trim() || !password) return;
    try {
      setSaving(true); setError('');
      const response = await fetch('/api/timetable/teacher-accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, teacherId, email: email.trim(), password, name: currentTeacher?.name || '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'تعذر إنشاء الحساب.');
      await loadAccounts(projectId);
      setTeacherId(''); setEmail(''); setPassword('');
    } catch (createError: unknown) {
      console.error(createError); setError(createError instanceof Error ? createError.message : 'تعذر إنشاء الحساب.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (teacher: TeacherAccount) => {
    if (!teacher.accountId || !window.confirm(`هل تريد حذف حساب ${teacher.name}؟`)) return;
    try {
      setError('');
      const response = await fetch('/api/timetable/teacher-accounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, teacherId: teacher.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'تعذر حذف الحساب.');
      await loadAccounts(projectId);
    } catch (deleteError: unknown) { console.error(deleteError); setError(deleteError instanceof Error ? deleteError.message : 'تعذر حذف الحساب.'); }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#123E70] to-[#2B68B1] p-4 text-white shadow-lg">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-white/10 p-2"><Users className="h-6 w-6 text-amber-300" /></div><div><h1 className="text-lg font-black">إدارة المستخدمين</h1><p className="text-xs text-white/70">إنشاء حسابات دخول للأساتذة وربط كل حساب بأستاذه.</p></div></div>
          <button onClick={() => window.location.assign('/')} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/20"><ArrowRight className="h-4 w-4" />الرجوع</button>
        </div>
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</div>}

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><UserPlus className="h-5 w-5 text-blue-600" /><h2 className="font-black text-slate-900">إنشاء حساب أستاذ</h2></div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><label className="mb-1 block text-xs font-black text-slate-700">استعمال الزمن</label><select value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={loading} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><option value="">اختر المشروع...</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-black text-slate-700">الأستاذ</label><select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} disabled={!projectId || !availableTeachers.length} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><option value="">اختر الأستاذ...</option>{availableTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.code})</option>)}</select>{!projectTeachers.length && <p className="mt-1 text-[10px] font-bold text-amber-700">لا يوجد أستاذ مسجل في هذا المشروع.</p>}{projectTeachers.length > 0 && !availableTeachers.length && <p className="mt-1 text-[10px] font-bold text-emerald-700">جميع أساتذة المشروع لديهم حسابات.</p>}</div>
              <div><label className="mb-1 block text-xs font-black text-slate-700">البريد الإلكتروني</label><div className="relative"><Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prof@example.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-sm" required /></div></div>
              <div><label className="mb-1 block text-xs font-black text-slate-700">كلمة المرور</label><div className="relative"><KeyRound className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 أحرف على الأقل" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-sm" required /></div></div>
              <button disabled={saving || !teacherId || !projectId} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#20518D] px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"><UserPlus className="h-4 w-4" />{saving ? 'جاري الحفظ...' : 'حفظ وإنشاء المستخدم'}</button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-black text-slate-900">حسابات الأساتذة</h2><p className="mt-1 text-xs text-slate-500">الجدول يبقى فارغاً حتى يتم حفظ حساب أستاذ.</p></div><span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-800">{accounts.length} حساب</span></div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[650px] text-right text-xs"><thead className="bg-slate-50 text-slate-700"><tr><th className="p-3 font-black">الأستاذ</th><th className="p-3 font-black">الرمز</th><th className="p-3 font-black">البريد</th><th className="p-3 text-center font-black">الحالة</th><th className="p-3 text-center font-black">إجراء</th></tr></thead>
                <tbody>{accounts.map((account) => <tr key={account.id} className="border-t border-slate-100"><td className="p-3 font-black text-slate-900">{account.name}</td><td className="p-3 font-bold text-slate-500">{account.code}</td><td className="p-3 text-slate-600">{account.email || '—'}</td><td className="p-3 text-center"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">حساب مفعّل</span></td><td className="p-3 text-center"><button onClick={() => handleDelete(account)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-black text-red-700 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" />حذف الحساب</button></td></tr>)}{!accounts.length && <tr><td colSpan={5} className="p-10 text-center"><div className="font-black text-slate-400">لا توجد حسابات محفوظة بعد</div><div className="mt-1 text-[11px] text-slate-400">اختر الأستاذ، أدخل البريد وكلمة المرور، ثم اضغط حفظ.</div></td></tr>}</tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
