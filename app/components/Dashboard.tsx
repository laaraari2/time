'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock3,
  Copy,
  FolderOpen,
  Loader2,
  Plus,
  School,
  Trash2,
  Users,
  BookOpen,
} from 'lucide-react';

import { SavedScheduleProfile } from '../types';

interface DashboardProps {
  onOpenProfile: (profile: SavedScheduleProfile) => void;
  onCreateSchedule: () => void;
}

export function Dashboard({ onOpenProfile, onCreateSchedule }: DashboardProps) {
  const [profiles, setProfiles] = useState<SavedScheduleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/timetable/profiles', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Failed to load profiles: ${response.status}`);
      const data = await response.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load dashboard profiles:', err);
      setError('تعذر تحميل المشاريع حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  const handleDuplicate = async (profile: SavedScheduleProfile) => {
    try {
      const response = await fetch('/api/timetable/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${profile.name} (نسخة)`,
          config: profile.config,
          subjects: profile.subjects,
          teachers: profile.teachers,
          classes: profile.classes,
          rooms: profile.rooms,
          lessons: profile.lessons,
          placements: profile.placements,
        }),
      });
      if (!response.ok) throw new Error(`Failed to duplicate profile: ${response.status}`);
      await loadProfiles();
    } catch (err) {
      console.error('Failed to duplicate profile:', err);
      alert('حدث خطأ أثناء نسخ المشروع.');
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذه العملية.')) return;

    try {
      const response = await fetch(`/api/timetable/profiles/${profileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Failed to delete profile: ${response.status}`);
      setProfiles((prev) => prev.filter((profile) => profile.id !== profileId));
    } catch (err) {
      console.error('Failed to delete profile:', err);
      alert('حدث خطأ أثناء حذف المشروع.');
    }
  };

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat('ar-MA', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Compact dashboard hero */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#123E70] via-[#20518D] to-[#2B68B1] px-5 py-3.5 text-white shadow-lg sm:px-6 sm:py-4">
          <div className="absolute -left-20 -top-24 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-16 h-64 w-64 rounded-full bg-amber-300/10" />

          <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur">
                <School className="h-3.5 w-3.5 text-amber-300" />
                <span>لوحة التحكم</span>
              </div>

              <h1 className="text-xl font-black leading-tight sm:text-2xl">
                مرحباً بك في <span className="text-amber-300">TimeTables</span>
              </h1>

            </div>

            <button
              onClick={onCreateSchedule}
              className="group flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-300"
            >
              <Plus className="h-5 w-5 transition group-hover:rotate-90" />
              إنشاء استعمال زمن
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Projects */}
        <section className="mt-4">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">مشاريعك</h2>
            </div>

            {!loading && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#20518D]">
                {profiles.length} مشروع
              </span>
            )}
          </div>

          {loading && (
            <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#20518D]" />
                جاري تحميل المشاريع...
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm font-bold text-red-700">{error}</p>
              <button
                onClick={() => void loadProfiles()}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {!loading && !error && profiles.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#20518D]">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-lg font-black text-slate-900">لا توجد مشاريع بعد</h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-6 text-slate-500">
                أنشئ أول استعمال زمن خاص بك، وسيظهر هنا لتتمكن من فتحه وتعديله في أي وقت.
              </p>
              <button
                onClick={onCreateSchedule}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#20518D] px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#174372]"
              >
                <Plus className="h-4 w-4" />
                إنشاء أول مشروع
              </button>
            </div>
          )}

          {!loading && !error && profiles.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => {
                const totalClasses = Array.isArray(profile.classes) ? profile.classes.length : 0;
                const totalTeachers = Array.isArray(profile.teachers) ? profile.teachers.length : 0;
                const totalLessons = Array.isArray(profile.lessons) ? profile.lessons.length : 0;
                const totalPlaced = Array.isArray(profile.placements) ? profile.placements.length : 0;

                return (
                  <article
                    key={profile.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="h-1 bg-gradient-to-l from-[#123E70] to-[#2B68B1]" />

                    <div className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-[#20518D]">
                          {profile.config?.schoolLogo ? (
                            <img src={profile.config.schoolLogo} alt="شعار المؤسسة" className="h-full w-full object-contain p-0.5" />
                          ) : (
                            <School className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-slate-900">
                            {profile.name}
                          </h3>
                          <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                            {profile.config?.schoolName || 'مؤسسة تعليمية'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-1.5">
                        <div className="rounded-lg bg-slate-50 p-2 text-center">
                          <Users className="mx-auto h-3.5 w-3.5 text-[#20518D]" />
                          <div className="mt-0.5 text-sm font-black text-slate-800">{totalTeachers}</div>
                          <div className="text-[9px] font-bold text-slate-400">أساتذة</div>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-2 text-center">
                          <School className="mx-auto h-3.5 w-3.5 text-[#20518D]" />
                          <div className="mt-0.5 text-sm font-black text-slate-800">{totalClasses}</div>
                          <div className="text-[9px] font-bold text-slate-400">أقسام</div>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-2 text-center">
                          <BookOpen className="mx-auto h-3.5 w-3.5 text-[#20518D]" />
                          <div className="mt-0.5 text-sm font-black text-slate-800">
                            {totalPlaced}/{totalLessons}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400">حصص</div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>آخر تعديل: {formatDate(profile.updatedAt)}</span>
                      </div>

                      <div className="mt-3 flex gap-1.5">
                        <button
                          onClick={() => onOpenProfile(profile)}
                          className="flex-1 rounded-lg bg-[#20518D] px-3 py-2 text-xs font-black text-white transition hover:bg-[#174372]"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <FolderOpen className="h-3.5 w-3.5" />
                            فتح المشروع
                          </span>
                        </button>

                        <button
                          onClick={() => void handleDuplicate(profile)}
                          title="نسخ المشروع"
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-[#20518D]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => void handleDelete(profile.id)}
                          title="حذف المشروع"
                          className="rounded-lg border border-red-100 bg-red-50 px-2.5 text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Developer credit */}
        <footer className="py-3 text-center">
          <span className="text-[10px] font-bold text-slate-400">
            TimeTables · Developed by{' '}
            <span className="font-black text-slate-500">MUSTAPHA LAARAARI</span>
          </span>
        </footer>
      </div>
    </main>
  );
}