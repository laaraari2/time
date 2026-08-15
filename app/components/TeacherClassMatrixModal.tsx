import React, { useState } from 'react';
import { Teacher, Subject, ClassGroup, Lesson } from '../types';
import { Language, translations } from '../utils/i18n';
import { X, Printer, Search, Table } from 'lucide-react';

interface TeacherClassMatrixModalProps {
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassGroup[];
  lessons: Lesson[];
  language?: Language;
  onClose: () => void;
}

export const TeacherClassMatrixModal: React.FC<TeacherClassMatrixModalProps> = ({
  teachers, subjects, classes, lessons, language = 'ar', onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[language] || translations.ar;
  const isRtl = language === 'ar';

  // القاعدة الموحدة: المنفردة = 1 ساعة، المزدوجة = 2 ساعات.
  // مثال: weeklyPeriods=2 + isDoublePeriod=true => 4 ساعات.
  const getLessonHours = (lesson: Lesson) => {
    const weeklyPeriods = Math.max(0, Number(lesson.weeklyPeriods) || 0);
    return weeklyPeriods * (lesson.isDoublePeriod ? 2 : 1);
  };

  const teacherClassMatrix: Record<string, Record<string, number>> = {};
  const teacherTotals: Record<string, number> = {};

  teachers.forEach((teacher) => {
    teacherClassMatrix[teacher.id] = {};
    teacherTotals[teacher.id] = 0;
    classes.forEach((classGroup) => {
      teacherClassMatrix[teacher.id][classGroup.id] = 0;
    });
  });

  lessons.forEach((lesson) => {
    const teacherId = lesson.teacherId;
    const classId = lesson.classGroupId;
    if (
      teacherId &&
      teacherClassMatrix[teacherId] &&
      teacherClassMatrix[teacherId][classId] !== undefined
    ) {
      const hours = getLessonHours(lesson);
      teacherClassMatrix[teacherId][classId] += hours;
      teacherTotals[teacherId] += hours;
    }
  });

  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const subjectMatch = subjects.some(
      (subject) =>
        teacher.subjectIds?.includes(subject.id) &&
        (subject.name.toLowerCase().includes(term) ||
          subject.code.toLowerCase().includes(term))
    );
    return (
      teacher.name.toLowerCase().includes(term) ||
      teacher.code.toLowerCase().includes(term) ||
      subjectMatch
    );
  });

  const totalAssignedHours = Object.values(teacherTotals).reduce(
    (sum, value) => sum + value, 0
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 select-none"
      dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        <div className="bg-gradient-to-r from-[#065F46] via-[#059669] to-[#047857] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Table className="w-5 h-5 text-amber-300" />
            <span>{isRtl ? 'مخطط إسناد الأساتذة للفصول' : 'Matrice Enseignants × Classes'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => window.print()}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1">
              <Printer className="w-4 h-4" /><span>{t.print}</span>
            </button>
            <button type="button" onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/60 border-b border-emerald-200 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className={`w-4 h-4 text-emerald-600 absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5`} />
            <input
              type="text"
              placeholder={isRtl ? 'تصفية بالأستاذ أو المادة...' : 'Filtrer par enseignant ou matière...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 text-xs border border-emerald-300 rounded-lg bg-white`}
            />
          </div>
          <div className="text-xs text-slate-700 font-bold">
            {isRtl ? 'عدد الأساتذة: ' : 'Enseignants: '}
            <b>{filteredTeachers.length}</b>
            {' | '}
            {isRtl ? 'مجموع الساعات: ' : 'Total heures: '}
            <b>{totalAssignedHours}</b>{isRtl ? ' ساعة' : ' h'}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          <div className="overflow-x-auto border border-slate-400 rounded-lg shadow-sm bg-white">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr className="bg-[#E2E8F0] text-slate-900 font-extrabold border-b-2 border-slate-400">
                  <th className={`p-2 border-r border-slate-400 bg-slate-300 min-w-[120px] ${isRtl ? 'text-right' : 'text-left'}`}>{t.teacher}</th>
                  <th className="p-2 border-r border-slate-400 bg-slate-200 min-w-[80px]">{t.subject}</th>
                  {classes.map((classGroup) => (
                    <th key={classGroup.id} className="p-2 border-r border-slate-400 min-w-[60px] bg-emerald-100/80 text-emerald-950">
                      {classGroup.code || classGroup.name}
                    </th>
                  ))}
                  <th className="p-2 bg-amber-200 text-amber-950 min-w-[65px]">{isRtl ? 'المجموع' : 'Total'}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-300 font-bold">
                {filteredTeachers.map((teacher, idx) => {
                  const teacherSubjects = subjects.filter((subject) =>
                    teacher.subjectIds?.includes(subject.id)
                  );
                  return (
                    <tr key={teacher.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className={`p-2 border-r border-slate-300 font-extrabold ${isRtl ? 'text-right' : 'text-left'}`}>
                        <div>{teacher.name}</div>
                        <div className="text-[9px] text-slate-500">{teacher.code}</div>
                      </td>
                      <td className="p-2 border-r border-slate-300">
                        {teacherSubjects.map((subject) => (
                          <span key={subject.id} className="mx-0.5 px-1.5 py-0.5 rounded border text-[10px] font-black"
                            style={{ backgroundColor: subject.color || '#F3F4F6', color: subject.textColor || '#111827' }}>
                            {subject.code || subject.name}
                          </span>
                        ))}
                      </td>
                      {classes.map((classGroup) => {
                        const hours = teacherClassMatrix[teacher.id]?.[classGroup.id] || 0;
                        return (
                          <td key={classGroup.id}
                            className={`p-2 border-r border-slate-300 ${hours > 0 ? 'font-black bg-emerald-50/60' : 'text-slate-300'}`}>
                            {hours > 0 ? hours : ''}
                          </td>
                        );
                      })}
                      <td className="p-2 font-black text-amber-950 bg-amber-100 text-sm">
                        {teacherTotals[teacher.id] || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-bold">
            {isRtl
              ? 'الحساب موحّد: الحصة المزدوجة = ساعتان. 2 حصص مزدوجة = 4 ساعات.'
              : 'Calcul unifié : une séance double = 2 heures. 2 séances doubles = 4 heures.'}
          </span>
          <button type="button" onClick={onClose}
            className="bg-[#065F46] hover:bg-emerald-800 text-white font-bold px-5 py-1.5 rounded text-xs">
            {isRtl ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};