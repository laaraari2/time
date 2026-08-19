import React, { useState } from 'react';
import { Teacher, Subject, ClassGroup, Lesson, Placement } from '../types';
import { X, Users, Search, BookOpen, School, Clock, CheckCircle, AlertCircle, Edit3, BarChart2 } from 'lucide-react';

interface TeacherWorkloadModalProps {
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassGroup[];
  lessons: Lesson[];
  placements: Placement[];
  onClose: () => void;
  onEditTeacher: (teacher: Teacher) => void;
}

export const TeacherWorkloadModal: React.FC<TeacherWorkloadModalProps> = ({
  teachers,
  subjects,
  classes,
  lessons,
  placements,
  onClose,
  onEditTeacher,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate detailed stats per teacher
  const teacherStats = teachers.map((teacher) => {
    const teacherLessons = lessons.filter((l) => l.teacherId === teacher.id);
    
    // weeklyPeriods = عدد occurrences الأسبوعية.
    // كل occurrence مزدوجة تشغل ساعتين فعليتين.
    const totalWeeklyHours = teacherLessons.reduce(
      (sum, l) => sum + (l.weeklyPeriods || 0) * (l.isDoublePeriod ? 2 : 1),
      0
    );

    // كل Placement تمثل ساعة واحدة في الجدول، لذلك length هنا هو عدد الساعات المسكنة.
    const teacherLessonIds = new Set(teacherLessons.map((l) => l.id));
    const placedPlacements = placements.filter((p) => teacherLessonIds.has(p.lessonId));
    const placedHours = placedPlacements.length;
    const unplacedHours = Math.max(0, totalWeeklyHours - placedHours);

    // Class details list
    const classBreakdown = teacherLessons.map((lsn) => {
      const cls = classes.find((c) => c.id === lsn.classGroupId);
      const sub = subjects.find((s) => s.id === lsn.subjectId);
      return {
        lessonId: lsn.id,
        className: cls?.name || cls?.code || '---',
        classCode: cls?.code || '---',
        subjectName: sub?.name || sub?.code || '---',
        weeklyPeriods: lsn.weeklyPeriods,
        isDoublePeriod: lsn.isDoublePeriod,
        groupName: lsn.groupName,
      };
    });

    const primarySubject = subjects.find((s) => teacher.subjectIds?.includes(s.id));

    return {
      teacher,
      primarySubject,
      totalWeeklyHours,
      placedHours,
      unplacedHours,
      completionRate: totalWeeklyHours > 0 ? Math.round((placedHours / totalWeeklyHours) * 100) : 100,
      classBreakdown,
      uniqueClassesCount: new Set(teacherLessons.map((l) => l.classGroupId)).size,
    };
  });

  // Filter teachers by search term
  const filteredStats = teacherStats.filter(({ teacher, primarySubject, classBreakdown }) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = teacher.name.toLowerCase().includes(term);
    const codeMatch = teacher.code.toLowerCase().includes(term);
    const subjectMatch = primarySubject?.name.toLowerCase().includes(term) || primarySubject?.code.toLowerCase().includes(term);
    const classMatch = classBreakdown.some((c) => c.className.toLowerCase().includes(term) || c.classCode.toLowerCase().includes(term));
    return nameMatch || codeMatch || subjectMatch || classMatch;
  });

  // Overall metrics
  const totalTeachers = teachers.length;
  const grandTotalHours = teacherStats.reduce((sum, t) => sum + t.totalWeeklyHours, 0);
  const avgHours = totalTeachers > 0 ? (grandTotalHours / totalTeachers).toFixed(1) : '0';
  const fullyPlacedCount = teacherStats.filter((t) => t.unplacedHours === 0 && t.totalWeeklyHours > 0).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#20518D] via-[#2B68B1] to-[#1D4A82] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <BarChart2 className="w-5 h-5 text-amber-300" />
            <span>تقرير نصاب وساعات الفصول للأساتذة (توزيع حصص هيئة التدريس)</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Ribbon */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="bg-blue-100 text-blue-700 p-2.5 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-500 font-semibold">إجمالي الأساتذة</div>
              <div className="text-base font-extrabold text-slate-800">{totalTeachers} أستاذ</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-500 font-semibold">مجموع الحصص الأسبوعية</div>
              <div className="text-base font-extrabold text-slate-800">{grandTotalHours} ساعة/حصة</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="bg-amber-100 text-amber-700 p-2.5 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-500 font-semibold">متوسط ساعات الأستاذ</div>
              <div className="text-base font-extrabold text-slate-800">{avgHours} ساعة/أسبوع</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-500 font-semibold">أساتذة مكتمل جدولهم</div>
              <div className="text-base font-extrabold text-emerald-700">{fullyPlacedCount} / {totalTeachers}</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="ابحث برمز الأستاذ، اسمه، المادة، أو الفصول المدرسية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredStats.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-bold">
              لا توجد نتائج مطابقة لجهد البحث
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#1E40AF] text-white font-extrabold text-[11px]">
                  <tr>
                    <th className="p-2.5 border-b border-blue-900">الأستاذ</th>
                    <th className="p-2.5 border-b border-blue-900">المادة الرئيسية</th>
                    <th className="p-2.5 border-b border-blue-900">عدد الفصول</th>
                    <th className="p-2.5 border-b border-blue-900">الفصول المسندة والتفاصيل</th>
                    <th className="p-2.5 border-b border-blue-900 text-center">مجموع الساعات</th>
                    <th className="p-2.5 border-b border-blue-900 text-center">المسكن في الجدول</th>
                    <th className="p-2.5 border-b border-blue-900 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredStats.map(({ teacher, primarySubject, totalWeeklyHours, placedHours, unplacedHours, completionRate, classBreakdown, uniqueClassesCount }) => (
                    <tr key={teacher.id} className="hover:bg-blue-50/50 transition">
                      <td className="p-2.5 font-bold">
                        <div className="text-blue-950 font-extrabold">{teacher.name}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">رمز: {teacher.code}</div>
                      </td>

                      <td className="p-2.5">
                        {primarySubject ? (
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border"
                            style={{
                              backgroundColor: teacher?.color || primarySubject.color || '#E2E8F0',
                              color: teacher?.textColor || primarySubject.textColor || '#000',
                            }}
                          >
                            {primarySubject.name} ({primarySubject.code})
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">غير محدد</span>
                        )}
                      </td>

                      <td className="p-2.5 text-center font-extrabold text-slate-700">
                        <div className="flex items-center justify-center gap-1">
                          <School className="w-3.5 h-3.5 text-violet-600" />
                          <span>{uniqueClassesCount} فصول</span>
                        </div>
                      </td>

                      <td className="p-2.5">
                        {classBreakdown.length === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-red-700 border border-red-200 font-extrabold text-[10px]">
                              <AlertCircle className="w-3 h-3" />
                              لم تُسند له أي حصة
                            </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {classBreakdown.map((c, i) => (
                              <span
                                key={i}
                                className="bg-slate-100 text-slate-800 border border-slate-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                              >
                                <span>{c.classCode}</span>
                                {c.groupName && <span className="text-emerald-700 font-extrabold">({c.groupName})</span>}
                                <span className="text-blue-700 bg-blue-100 px-1 rounded text-[9px]">{c.weeklyPeriods}ح</span>
                                <span className="text-amber-700 bg-amber-100 px-1 rounded text-[8px]">{c.weeklyPeriods * (c.isDoublePeriod ? 2 : 1)}س</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="p-2.5 text-center font-extrabold text-slate-900 text-sm">
                        {totalWeeklyHours} س
                      </td>

                      <td className="p-2.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1 text-[11px] font-extrabold">
                            <span className={unplacedHours === 0 ? 'text-emerald-700' : 'text-amber-700'}>
                              {placedHours} / {totalWeeklyHours} س
                            </span>
                            {unplacedHours > 0 && (
                              <span className="text-[9.5px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                                ({unplacedHours} متبقي)
                              </span>
                            )}
                          </div>
                          {/* Progress bar */}
                          <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden border border-slate-300">
                            <div
                              className={`h-full ${completionRate === 100 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => {
                            onClose();
                            onEditTeacher(teacher);
                          }}
                          className="bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 mx-auto transition shadow-2xs cursor-pointer"
                          title="تعديل الفصول المسندة والحصص لهذا الأستاذ"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل الإسناد</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-600 font-bold">
            يمكنك الضغط على زر "تعديل الإسناد" أمام أي أستاذ لتعديل الفصول والحصص المسندة له فوراً.
          </span>
          <button
            onClick={onClose}
            className="bg-[#20518D] hover:bg-[#1D4A82] text-white font-bold px-5 py-1.5 rounded text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
