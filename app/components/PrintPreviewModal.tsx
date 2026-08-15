import React, { useState } from 'react';
import { 
  TimetableConfig, Subject, Teacher, ClassGroup, 
  Classroom, Lesson, Placement 
} from '../types';
import { getPlacementDetails, isSlotDisabled } from '../utils/timetableGenerator';
import { translations, Language } from '../utils/i18n';
import { Printer, X, Download, School } from 'lucide-react';

interface PrintPreviewModalProps {
  config: TimetableConfig;
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassGroup[];
  rooms: Classroom[];
  lessons: Lesson[];
  placements: Placement[];
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  config,
  subjects,
  teachers,
  classes,
  rooms,
  lessons,
  placements,
  onClose,
}) => {
  const lang: Language = config.language || 'ar';
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [printType, setPrintType] = useState<'single_class' | 'matrix' | 'single_teacher'>('single_class');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');

  /**
   * Browsers may start printing before external/data images finish decoding.
   * Wait for every logo/image in the print area before opening the dialog.
   * This is especially important for logos loaded from a URL.
   */
  const handleTriggerPrint = async () => {
    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>('.print-area img')
    );

    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete && image.naturalWidth > 0) {
              resolve();
              return;
            }

            const finish = () => {
              image.removeEventListener('load', finish);
              image.removeEventListener('error', finish);
              resolve();
            };

            image.addEventListener('load', finish, { once: true });
            image.addEventListener('error', finish, { once: true });
          })
      )
    );

    // Allow the browser to finish layout/image decoding before print.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 select-none">
      {/* Dynamic CSS for Print to ensure A4 Landscape */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area img {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print-area {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Header (Hidden when printing) */}
        <div className="bg-gradient-to-r from-[#20518D] via-[#2B68B1] to-[#1D4A82] text-white px-5 py-3 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Printer className="w-5 h-5 text-amber-300" />
            <span>{t.printPreview} (A4 Landscape - أفقي)</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar (Hidden when printing) */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 no-print">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-700">نوع التقرير للطباعة:</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 font-bold cursor-pointer text-slate-800">
                <input
                  type="radio"
                  name="ptype"
                  checked={printType === 'single_class'}
                  onChange={() => setPrintType('single_class')}
                />
                <span>جدول فصل محدد</span>
              </label>
              <label className="flex items-center gap-1 font-bold cursor-pointer text-slate-800">
                <input
                  type="radio"
                  name="ptype"
                  checked={printType === 'single_teacher'}
                  onChange={() => setPrintType('single_teacher')}
                />
                <span>جدول أستاذ محدد</span>
              </label>
              <label className="flex items-center gap-1 font-bold cursor-pointer text-slate-800">
                <input
                  type="radio"
                  name="ptype"
                  checked={printType === 'matrix'}
                  onChange={() => setPrintType('matrix')}
                />
                <span>المصفوفة الشاملة لكل المؤسسة</span>
              </label>
            </div>

            {printType === 'single_class' && (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 font-extrabold text-blue-900 focus:ring-2 focus:ring-blue-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            )}

            {printType === 'single_teacher' && (
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 font-extrabold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
              >
                {teachers.map((tch) => (
                  <option key={tch.id} value={tch.id}>{tch.code} - {tch.name}</option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={handleTriggerPrint}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-5 py-2 rounded flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الصفحة الحالية (A4 Landscape)</span>
          </button>
        </div>

        {/* Print Preview Canvas (This div gets printed) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="print-area bg-white p-6 rounded-lg shadow-lg max-w-5xl mx-auto border border-slate-300 text-slate-900">
            {/* Official Moroccan-style print header: school identity + ministry identity + academic year */}
            <div className="border-b-2 border-slate-800 pb-3 mb-4">
              <div className="grid grid-cols-3 items-start gap-4">
                {/* School identity */}
                <div className="flex items-center gap-3 text-left min-h-[76px]">
                  {config.schoolLogo ? (
                    <img
                      src={config.schoolLogo}
                      alt="School Logo"
                      className="max-h-20 max-w-[105px] object-contain shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400 shrink-0">
                      <School className="w-8 h-8" />
                    </div>
                  )}
                  <div className="font-black text-slate-950 leading-tight">
                    {config.schoolName || t.schoolNameDefault}
                  </div>
                </div>

                {/* Ministry identity */}
                <div className="flex flex-col items-center justify-start text-center min-h-[76px]">
                  {config.ministryLogo ? (
                    <img
                      src={config.ministryLogo}
                      alt="Ministry Logo"
                      className="max-h-20 max-w-[150px] object-contain mb-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-10 flex items-center justify-center text-[9px] text-slate-400">
                      {lang === 'ar' ? 'شعار الوزارة' : 'Logo du ministère'}
                    </div>
                  )}
                  <div className="text-[10px] sm:text-[11px] text-slate-800 font-extrabold leading-tight max-w-[280px]">
                    {config.ministryName || t.kingdomMinistry}
                  </div>
                </div>

                {/* Academic year */}
                <div className="text-right text-xs font-bold space-y-2 pt-1">
                  <div className="text-sm font-extrabold text-slate-900">
                    {t.academicYear}: <span className="font-black">{config.academicYear}</span>
                  </div>
                  {printType === 'single_class' && (
                    <div className="text-base font-black text-slate-950">
                      {isRtl ? 'القسم' : 'Classe'} : {selectedClass?.code}
                    </div>
                  )}
                  {printType === 'single_teacher' && (
                    <div className="text-[11px] text-slate-950 font-black">
                      {isRtl ? 'الأستاذ(ة)' : 'Enseignant(e)'}: {selectedTeacher?.name} ({selectedTeacher?.code})
                    </div>
                  )}
                </div>
              </div>

              {/* Timetable title */}
              <div className="text-center mt-2">
                <div className="text-2xl font-black text-slate-950 underline underline-offset-4">
                  {t.weeklyTimetableTitle}
                </div>
                {printType === 'single_class' && selectedClass && (
                  <div className="text-lg font-black text-slate-950 mt-1">
                    {isRtl ? `القسم : ${selectedClass.code}` : `Classe : ${selectedClass.code}`}
                  </div>
                )}
              </div>
            </div>

            {/* Single Class Timetable View */}
            {printType === 'single_class' && selectedClass && (
              <table className="w-full border-collapse border-2 border-slate-800 text-center text-xs">
                <thead>
                  <tr className="bg-slate-200 font-extrabold text-slate-950 border-b-2 border-slate-800 text-xs">
                    <th className="p-2 border border-slate-800 w-28 bg-slate-300">
                      {t.day} / {t.period}
                    </th>
                    {config.periods.map((p) => (
                      <th key={p.periodIndex} className="p-2 border border-slate-800 font-mono">
                        <div>{p.label}</div>
                        <div className="text-[9.5px] text-slate-600 font-normal">{p.startTime} - {p.endTime}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.days.map((dayName, dIdx) => (
                    <tr key={dIdx} className="border-b border-slate-800">
                      <td className="p-2 border-2 border-slate-800 font-black bg-slate-100 text-slate-900">
                        {dayName}
                      </td>
                      {config.periods.map((_, pIdx) => {
                        const disabled = isSlotDisabled(config, dIdx, pIdx);
                        if (disabled) {
                          return (
                            <td key={`${dIdx}-${pIdx}`} className="p-1 border border-slate-800 h-16 align-middle font-bold text-center bg-slate-200 text-slate-500 text-xs">
                              مغلق
                            </td>
                          );
                        }

                        const p = placements.find(
                          (plc) =>
                            plc.dayIndex === dIdx &&
                            plc.periodIndex === pIdx &&
                            lessons.find((l) => l.id === plc.lessonId)?.classGroupId === selectedClass.id
                        );
                        const det = p ? getPlacementDetails(p, lessons, subjects, teachers, classes, rooms) : null;

                        return (
                          <td key={`${dIdx}-${pIdx}`} className="p-1 border border-slate-800 h-16 align-middle font-bold text-center">
                            {det ? (
                              <div
                                className="p-1.5 rounded border border-slate-400 h-full flex flex-col justify-center items-center shadow-2xs"
                                style={{ backgroundColor: det.subject?.color || '#F3F4F6', color: det.subject?.textColor || '#000' }}
                              >
                                <div className="font-extrabold text-sm leading-tight">{det.subject?.name}</div>
                                <div className="text-[10px] text-slate-800 mt-1 flex items-center justify-center gap-1 font-bold">
                                  <span>ذ: {det.teacher?.name}</span>
                                  {det.room && <span className="bg-white/80 px-1 rounded text-[9px] border border-slate-300">ق: {det.room.code}</span>}
                                </div>
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Single Teacher Timetable View */}
            {printType === 'single_teacher' && selectedTeacher && (
              <table className="w-full border-collapse border-2 border-slate-800 text-center text-xs">
                <thead>
                  <tr className="bg-slate-200 font-extrabold text-slate-950 border-b-2 border-slate-800 text-xs">
                    <th className="p-2 border border-slate-800 w-28 bg-slate-300">
                      {t.day} / {t.period}
                    </th>
                    {config.periods.map((p) => (
                      <th key={p.periodIndex} className="p-2 border border-slate-800 font-mono">
                        <div>{p.label}</div>
                        <div className="text-[9.5px] text-slate-600 font-normal">{p.startTime} - {p.endTime}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.days.map((dayName, dIdx) => (
                    <tr key={dIdx} className="border-b border-slate-800">
                      <td className="p-2 border-2 border-slate-800 font-black bg-slate-100 text-slate-900">
                        {dayName}
                      </td>
                      {config.periods.map((_, pIdx) => {
                        const disabled = isSlotDisabled(config, dIdx, pIdx);
                        if (disabled) {
                          return (
                            <td key={`${dIdx}-${pIdx}`} className="p-1 border border-slate-800 h-16 align-middle font-bold text-center bg-slate-200 text-slate-500 text-xs">
                              مغلق
                            </td>
                          );
                        }

                        const p = placements.find(
                          (plc) =>
                            plc.dayIndex === dIdx &&
                            plc.periodIndex === pIdx &&
                            lessons.find((l) => l.id === plc.lessonId)?.teacherId === selectedTeacher.id
                        );
                        const det = p ? getPlacementDetails(p, lessons, subjects, teachers, classes, rooms) : null;

                        return (
                          <td key={`${dIdx}-${pIdx}`} className="p-1 border border-slate-800 h-16 align-middle font-bold text-center">
                            {det ? (
                              <div
                                className="p-1.5 rounded border border-slate-400 h-full flex flex-col justify-center items-center shadow-2xs"
                                style={{ backgroundColor: det.subject?.color || '#F3F4F6', color: det.subject?.textColor || '#000' }}
                              >
                                <div className="font-extrabold text-sm leading-tight">{det.classGroup?.name || det.classGroup?.code}</div>
                                <div className="text-[10px] text-slate-800 mt-1 font-bold">
                                  <span>{det.subject?.code || det.subject?.name}</span>
                                  {det.room && <span className="ml-1 bg-white/80 px-1 rounded text-[9px] border border-slate-300">({det.room.code})</span>}
                                </div>
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Matrix View */}
            {printType === 'matrix' && (
              <table className="w-full border-collapse border border-slate-800 text-center text-[9.5px]">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-800 font-extrabold">
                    <th className="p-1 border border-slate-800 w-16">الفصل</th>
                    {config.days.map((dayName, dIdx) => {
                      const activePeriodIndices = config.periods
                        .map((_, i) => i)
                        .filter((pIdx) => !isSlotDisabled(config, dIdx, pIdx));
                      const colSpan = Math.max(1, activePeriodIndices.length);

                      return (
                        <th key={dIdx} colSpan={colSpan} className="p-1 border border-slate-800 bg-slate-300">
                          {dayName} {activePeriodIndices.length === 0 && '(عطلة)'}
                        </th>
                      );
                    })}
                  </tr>
                  <tr className="bg-slate-100 border-b border-slate-800 text-[8.5px]">
                    <th className="p-0.5 border border-slate-800">التوقيت</th>
                    {config.days.map((_, dIdx) => {
                      const activePeriodIndices = config.periods
                        .map((_, i) => i)
                        .filter((pIdx) => !isSlotDisabled(config, dIdx, pIdx));

                      if (activePeriodIndices.length === 0) {
                        return (
                          <th key={`off-hdr-${dIdx}`} className="p-0.5 border border-slate-800 font-mono text-slate-400">
                            -
                          </th>
                        );
                      }

                      return activePeriodIndices.map((pIdx) => {
                        const p = config.periods[pIdx];
                        return (
                          <th key={`${dIdx}-${pIdx}`} className="p-0.5 border border-slate-800 font-mono">
                            {p ? p.label : `ح ${pIdx + 1}`}
                          </th>
                        );
                      });
                    })}
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id} className="border-b border-slate-800">
                      <td className="p-0.5 border border-slate-800 font-black bg-slate-100">{cls.code}</td>
                      {config.days.map((_, dIdx) => {
                        const activePeriodIndices = config.periods
                          .map((_, i) => i)
                          .filter((pIdx) => !isSlotDisabled(config, dIdx, pIdx));

                        if (activePeriodIndices.length === 0) {
                          return (
                            <td key={`off-cell-${cls.id}-${dIdx}`} className="p-0.5 border border-slate-800 bg-slate-200 text-slate-500 font-bold text-[8px]">
                              عطلة
                            </td>
                          );
                        }

                        return activePeriodIndices.map((pIdx) => {
                          const p = placements.find(
                            (plc) =>
                              plc.dayIndex === dIdx &&
                              plc.periodIndex === pIdx &&
                              lessons.find((l) => l.id === plc.lessonId)?.classGroupId === cls.id
                          );
                          const det = p ? getPlacementDetails(p, lessons, subjects, teachers, classes, rooms) : null;

                          return (
                            <td key={`${cls.id}-${dIdx}-${pIdx}`} className="p-0.5 border border-slate-800 h-8 font-bold align-middle">
                              {det ? (
                                <div className="leading-tight">
                                  <div className="font-extrabold text-[9px]">{det.subject?.code}</div>
                                  <div className="text-[8px] text-slate-700">{det.teacher?.code}</div>
                                </div>
                              ) : null}
                            </td>
                          );
                        });
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Footer Signature Box */}
            <div className="mt-8 pt-4 border-t-2 border-slate-800 flex justify-between text-xs font-extrabold text-slate-800">
              <div>{t.headmasterSignature} ........................</div>
              <div>{t.inspectorSignature} ........................</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden when printing) */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end shrink-0 no-print">
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};