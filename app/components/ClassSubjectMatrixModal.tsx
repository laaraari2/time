import React, { useState } from 'react';
import { Subject, ClassGroup, Lesson } from '../types';
import { Language, translations } from '../utils/i18n';
import { X, BookOpen, Grid, Printer, Search, Download } from 'lucide-react';

interface ClassSubjectMatrixModalProps {
  classes: ClassGroup[];
  subjects: Subject[];
  lessons: Lesson[];
  language?: Language;
  onClose: () => void;
}

const ClassSubjectMatrixModal: React.FC<ClassSubjectMatrixModalProps> = ({
  classes,
  subjects,
  lessons,
  language = 'ar',
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[language] || translations.ar;
  const isRtl = language === 'ar';

  // Calculate hours per class & subject
  // matrixData[classId][subjectId] = total WeeklyPeriods
  const matrixData: Record<string, Record<string, number>> = {};
  const classTotals: Record<string, number> = {};

  classes.forEach((c) => {
    matrixData[c.id] = {};
    classTotals[c.id] = 0;
    subjects.forEach((s) => {
      matrixData[c.id][s.id] = 0;
    });
  });

  lessons.forEach((l) => {
    if (matrixData[l.classGroupId] && matrixData[l.classGroupId][l.subjectId] !== undefined) {
      const hours = (l.weeklyPeriods || 0) * (l.isDoublePeriod ? 2 : 1);
      matrixData[l.classGroupId][l.subjectId] += hours;
      classTotals[l.classGroupId] += hours;
    }
  });

  // Filter classes
  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 select-none" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Grid className="w-5 h-5 text-amber-300" />
            <span>{isRtl ? 'مخطط بنية المواد والتوقيت الأسبوعي حسب الأقسام (Class × Subject Matrix)' : 'Matrice Classes × Matières'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t.print}</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5`} />
            <input
              type="text"
              placeholder={isRtl ? "تصفية بالأقسام (مثال: 1APIC, 2BAC...)" : "Filtrer par classe..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-semibold`}
            />
          </div>
          <div className="text-xs text-slate-600 font-bold">
            {isRtl ? 'عدد الأقسام المعروضة: ' : 'Classes: '}<span className="text-blue-700 font-extrabold">{filteredClasses.length}</span> | {isRtl ? 'عدد المواد: ' : 'Matières: '}<span className="text-blue-700 font-extrabold">{subjects.length}</span>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          <div className="overflow-x-auto border border-slate-400 rounded-lg shadow-sm bg-white">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr className="bg-[#D1D5DB] text-slate-900 font-extrabold border-b-2 border-slate-400 text-[11px]">
                  <th className={`p-2 border-r border-slate-400 bg-slate-300 min-w-[100px] ${isRtl ? 'text-right pr-3' : 'text-left pl-3'}`}>
                    {t.classGroup}
                  </th>
                  <th className="p-2 border-r border-slate-400 bg-amber-100 text-amber-900 min-w-[65px]" title={isRtl ? "مجموع ساعات القسم الأسبوعية" : "Total heures hebdomadaires"}>
                    {isRtl ? 'المجموع (*)' : 'Total'}
                  </th>
                  {subjects.map((s) => (
                    <th
                      key={s.id}
                      className="p-2 border-r border-slate-400 min-w-[55px] font-extrabold"
                      style={{
                        backgroundColor: s.color || '#F3F4F6',
                        color: s.textColor || '#111827',
                      }}
                      title={s.name}
                    >
                      {s.code || s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-bold">
                {filteredClasses.map((cls, idx) => {
                  const total = classTotals[cls.id] || 0;
                  return (
                    <tr
                      key={cls.id}
                      className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-slate-50/80 hover:bg-blue-50'}
                    >
                      {/* Class Name */}
                      <td className={`p-2 border-r border-slate-300 font-extrabold text-slate-800 ${isRtl ? 'text-right pr-3' : 'text-left pl-3'} bg-amber-50/50`}>
                        {cls.code || cls.name}
                      </td>

                      {/* Total Hours */}
                      <td className="p-2 border-r border-slate-300 font-black text-blue-900 bg-amber-100/70 text-sm">
                        {total > 0 ? total : '-'}
                      </td>

                      {/* Hours per Subject */}
                      {subjects.map((sub) => {
                        const hours = matrixData[cls.id]?.[sub.id] || 0;
                        return (
                          <td
                            key={sub.id}
                            className={`p-2 border-r border-slate-300 text-xs ${hours > 0 ? 'font-black text-slate-900 bg-slate-100/40' : 'text-slate-300 font-normal'
                              }`}
                          >
                            {hours > 0 ? hours : ''}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-600 font-bold">
            يعرض هذا المخطط توزيع الحصص الأسبوعية لكل قسم دراسي حسب المواد المختلفة بشكل تجميعي.
          </span>
          <button
            onClick={onClose}
            className="bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold px-5 py-1.5 rounded text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};


export { ClassSubjectMatrixModal };
export default ClassSubjectMatrixModal;