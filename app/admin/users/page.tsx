'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, KeyRound, Mail, Trash2, UserPlus, Users } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface TeacherAccount {
  id: string;
  code: string;
  name: string;
  accountId: string | null;
  userId: string | null;
  email: string;
}

export default function UserManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const currentTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === teacherId),
    [teachers, teacherId]
  );

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/timetable/profiles', { cache: 'no-store' });
        if (!response.ok) throw new Error('تعذر تحميل المشاريع.');
        const data = await response.json();
        const nextProjects = Array.isArray(data)
          ? data.map((project: { id: string; name: string }) => ({ id: project.id, name: project.name }))
          : [];
        setProjects(nextProjects);
        if (nextProjects.length) setProjectId(nextProjects[0].id);
      } catch (loadError) {
        console.error(loadError);
        setError('تعذر تحميل المشاريع.');
      } finally {
        setLoading(false);
      }
    };

    void loadProjects();
  }, []);

  const loadAccounts = async (selectedProjectId: string) => {
    if (!selectedProjectId) {
      setTeachers([]);
      return;
    }

    try {
      setError('');
      const response = await fetch(
        `/api/timetable/teacher-accounts?projectId=${encodeURIComponent(selectedProjectId)}`,
        { cache: 'no-store' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'تعذر تحميل الحسابات.');
      setTeachers(Array.isArray(data.teachers) ? data.teachers : []);
    } catch (loadError: unknown) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الحسابات.');
      setTeachers([]);
    }
  };

  useEffect(() => {
    void loadAccounts(projectId);
  }, [projectId]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!projectId || !teacherId || !email.trim() || !password) return;

    try {
      setSaving(true);
      setError('');
      const response = await fetch('/api/timetable/teacher-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          teacherId,
          email: email.trim(),
          password,
          name: currentTeacher?.name || '',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'تعذر إنشاء الحساب.');

      setEmail('');
      setPassword('');
      setTeacherId('');
      await loadAccounts(projectId);
    } catch (createError: unknown) {
      console.error(createError);
      setError(createError instanceof Error ? createError.message : 'تعذر إنشاء الحساب.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (teacher: TeacherAccount) => {
    if (!teacher.accountId) return;
    if (!window.confirm(`هل تريد حذف حساب ${teacher.name}؟`)) return;

    try {
      setError('');
      const response = await fetch('/api/timetable/teacher-accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, teacherId: teacher.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'تعذر حذف الحساب.');
      await loadAccounts(projectId);
    } catch (deleteError: unknown) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'تعذر حذف الحساب.');
    }
  };

  const handleBack = () => {
    window.location.assign('/');
  };

  const availableTeachers = teachers.filter((teacher) => !teacher.accountId);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#123E70] to-[#2B68B1] p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2">
              <Users className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg font-black">إدارة المستخدمين</h1>
              <p className="text-xs text-white/70">إنشاء حسابات دخول للأساتذة وربط كل حساب بأستاذه.</p>
            </div>
          </div>
          <button onClick={handleBack} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/20">
            <ArrowRight className="h-4 w-4" />
            الرجوع
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <h2 className="font-black text-slate-900">إنشاء حساب أستاذ</h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-black text-slate-700">استعمال الزمن</label>
                <select value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={loading} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500">
                  <option value="">اختر المشروع...</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-black text-slate-700">الأستاذ</label>
                <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500">
                  <option value="">اختر الأستاذ...</option>
                  {availableTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.code})</option>)}
                </select>
                {!availableTeachers.length && <p className="mt-1 text-[10px] font-bold text-amber-700">كل الأساتذة في هذا المشروع لديهم حسابات بالفعل.</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-black text-slate-700">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prof@example.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-sm outline-none focus:border-blue-500" required />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-black text-slate-700">كلمة المرور</label>
                <div className="relative">
                  <KeyRound className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 أحرف على الأقل" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-sm outline-none focus:border-blue-500" required />
                </div>
              </div>

              <button disabled={saving || !teacherId || !projectId} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#20518D] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#123E70] disabled:cursor-not-allowed disabled:bg-slate-300">
                <UserPlus className="h-4 w-4" />
                {saving ? 'جاري إنشاء الحساب...' : 'إنشاء المستخدم'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-black text-slate-900">حسابات الأساتذة</h2>
                <p className="mt-1 text-xs text-slate-500">الأستاذ يدخل بالبريد وكلمة المرور، ثم يرى جدول حصصه فقط.</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-800">{teachers.filter((teacher) => teacher.accountId).length} حساب</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[650px] text-right text-xs">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="p-3 font-black">الأستاذ</th>
                    <th className="p-3 font-black">الرمز</th>
                    <th className="p-3 font-black">البريد</th>
                    <th className="p-3 text-center font-black">الحالة</th>
                    <th className="p-3 text-center font-black">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="border-t border-slate-100">
                      <td className="p-3 font-black text-slate-900">{teacher.name}</td>
                      <td className="p-3 font-bold text-slate-500">{teacher.code}</td>
                      <td className="p-3 text-slate-600">{teacher.email || '—'}</td>
                      <td className="p-3 text-center">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${teacher.accountId ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {teacher.accountId ? 'حساب مفعّل' : 'بدون حساب'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {teacher.accountId ? (
                          <button onClick={() => handleDelete(teacher)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-black text-red-700 hover:bg-red-100">
                            <Trash2 className="h-3.5 w-3.5" />
                            حذف الحساب
                          </button>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                  {!teachers.length && (
                    <tr><td colSpan={5} className="p-8 text-center font-bold text-slate-400">لا توجد بيانات أساتذة في هذا المشروع.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
