'use client';

import React, { useMemo, useState } from 'react';
import { Printer, Search, Table, X } from 'lucide-react';
import type { ClassGroup, Lesson, Subject, Teacher, TimetableConfig } from '../types';

type StoredTeacher = Teacher & {
  weeklyHoursAssignments?: Array<{
    id?: string;
    teacherId?: string;
    subjectId?: string;
    classId?: string;
    classGroupId?: string;
    hours?: number;
    weeklyHours?: number;
  }>;
};

interface TeacherClassAssignmentModalProps {
  teachers: Teacher[];
  classes: ClassGroup[];
  subjects?: Subject[];
  lessons?: Lesson[];
  language?: string;
  config?: TimetableConfig;
  directorName?: string;
  directorNote?: string;
  onClose: () => void;
  onSave: (updatedTeachers: Teacher[]) => Promise<boolean>;
}

type MatrixHours = Record<string, Record<string, number>>;

const getStoredAssignments = (teacher: StoredTeacher) => {
  const raw = teacher.weeklyHoursAssignments;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const classGroupId =
        typeof item.classGroupId === 'string'
          ? item.classGroupId
          : typeof item.classId === 'string'
            ? item.classId
            : '';

      const subjectId =
        typeof item.subjectId === 'string' ? item.subjectId : '';

      const weeklyHours = Math.max(
        0,
        Math.floor(Number(item.weeklyHours ?? item.hours ?? 0) || 0)
      );

      return {
        id: typeof item.id === 'string' ? item.id : undefined,
        teacherId:
          typeof item.teacherId === 'string'
            ? item.teacherId
            : teacher.id,
        subjectId,
        classGroupId,
        weeklyHours,
      };
    })
    .filter(
      (item) =>
        Boolean(item.classGroupId) &&
        Boolean(item.subjectId) &&
        item.weeklyHours > 0
    );
};

export const TeacherClassAssignmentModal: React.FC<
  TeacherClassAssignmentModalProps
> = ({
  teachers,
  classes,
  subjects = [],
  language = 'ar',
  config,
  directorName = 'مدير المؤسسة',
  directorNote = '',
  onClose,
  onSave,
}) => {
  const isRtl = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const initialMatrix = useMemo<MatrixHours>(() => {
    const matrix: MatrixHours = {};

    teachers.forEach((teacher) => {
      matrix[teacher.id] = {};

      classes.forEach((classGroup) => {
        matrix[teacher.id][classGroup.id] = 0;
      });

      getStoredAssignments(teacher as StoredTeacher).forEach((assignment) => {
        if (matrix[teacher.id]?.[assignment.classGroupId] !== undefined) {
          matrix[teacher.id][assignment.classGroupId] += assignment.weeklyHours;
        }
      });
    });

    return matrix;
  }, [teachers, classes]);

  const [hoursMatrix, setHoursMatrix] = useState<MatrixHours>(initialMatrix);

  const filteredTeachers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return teachers;

    return teachers.filter((teacher) => {
      const subject = subjects.find((item) =>
        teacher.subjectIds?.includes(item.id)
      );

      return [teacher.name, teacher.code, subject?.name, subject?.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [teachers, subjects, searchTerm]);

  const teacherTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    teachers.forEach((teacher) => {
      totals[teacher.id] = classes.reduce(
        (sum, classGroup) =>
          sum + (hoursMatrix[teacher.id]?.[classGroup.id] || 0),
        0
      );
    });

    return totals;
  }, [teachers, classes, hoursMatrix]);

  const totalAssignedHours = Object.values(teacherTotals).reduce(
    (sum, value) => sum + value,
    0
  );

  const updateCell = (
    teacherId: string,
    classId: string,
    value: string
  ) => {
    const numericValue = Math.max(0, Math.floor(Number(value) || 0));

    setHoursMatrix((previous) => ({
      ...previous,
      [teacherId]: {
        ...(previous[teacherId] || {}),
        [classId]: numericValue,
      },
    }));

    setSaveMessage('');
    setSaveError('');
  };

  const saveAssignments = async () => {
    setSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const updatedTeachers = teachers.map((teacher) => {
        const storedTeacher = teacher as StoredTeacher;
        const teacherSubjectId =
          teacher.subjectIds?.[0] ||
          getStoredAssignments(storedTeacher)[0]?.subjectId ||
          '';

        const assignments = classes
          .map((classGroup) => ({
            id: `weekly-${teacher.id}-${teacherSubjectId}-${classGroup.id}`,
            teacherId: teacher.id,
            subjectId: teacherSubjectId,
            classGroupId: classGroup.id,
            weeklyHours: hoursMatrix[teacher.id]?.[classGroup.id] || 0,
          }))
          .filter((item) => item.weeklyHours > 0);

        return {
          ...teacher,
          classGroupIds: assignments.map((item) => item.classGroupId),
          weeklyHoursAssignments: assignments,
        } as Teacher;
      });

      const saved = await onSave(updatedTeachers);
      if (!saved) {
        throw new Error('Failed to save teacher class assignments');
      }

      setSaveMessage(
        isRtl
          ? 'تم حفظ إسناد الأقسام والساعات بنجاح.'
          : 'Les affectations et les volumes horaires ont été enregistrés.'
      );
    } catch (error) {
      console.error('Teacher class assignment save error:', error);
      setSaveError(
        isRtl
          ? 'تعذر حفظ الإسناد. حاول مرة أخرى.'
          : 'Impossible d’enregistrer les affectations. Réessayez.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-2 backdrop-blur-[1px]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex max-h-[94vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl">
        <div className="print:hidden sticky top-0 z-50 flex h-[68px] shrink-0 items-center justify-between bg-gradient-to-r from-[#065F46] via-[#059669] to-[#047857] px-4 sm:px-5 text-white shadow-md">
          <div className="flex min-w-0 items-center gap-2.5 font-bold">
            <Table className="h-6 w-6 shrink-0 text-amber-300" />
            <div className="truncate text-base font-black sm:text-lg">
              {isRtl
                ? 'مخطط إسناد الأقسام للأساتذة'
                : 'Matrice d’affectation des classes aux enseignants'}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-white/30"
            >
              <Printer className="h-4 w-4" />
              {isRtl ? 'طباعة' : 'Imprimer'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/85 transition hover:bg-white/10 hover:text-white"
              aria-label={isRtl ? 'إغلاق' : 'Fermer'}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="print-report-header hidden pb-4 pt-0" dir="rtl">
          <div className="print-header-top grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="text-right">
              <div className="print-school-name text-[15px] font-bold leading-snug text-black">
                {config?.schoolName || 'اسم المؤسسة'}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              {config?.schoolLogo ? (
                <img
                  src={config.schoolLogo}
                  alt="شعار المؤسسة"
                  className="print-school-logo h-[58px] w-[58px] object-contain"
                />
              ) : null}
            </div>

            <div className="text-left" dir="rtl">
              <div className="print-meta-line text-[10px] font-semibold text-black">
                السنة الدراسية :{' '}
                <span className="font-bold">
                  {config?.academicYear || '................'}
                </span>
              </div>
            </div>
          </div>

          <div className="print-title-block mt-4 text-center">
            <div className="print-title text-[16px] font-bold tracking-wide text-[#1B5E20]">
              إسناد الحصص للأساتذة
            </div>
            <div className="mx-auto mt-1.5 flex items-center justify-center gap-1.5">
              <span className="h-px w-24 bg-[#1B5E20]" />
              <span className="text-[7px] text-[#1B5E20]">◆</span>
              <span className="text-[7px] text-[#1B5E20]">◆</span>
              <span className="text-[7px] text-[#1B5E20]">◆</span>
              <span className="h-px w-24 bg-[#1B5E20]" />
            </div>
          </div>

          <div className="print-stats-row mt-3 flex items-center justify-between border-b border-black/20 pb-2 text-[9.5px] font-semibold text-black">
            <div>عدد الأساتذة : {filteredTeachers.length}</div>
            <div>مجموع الساعات : {totalAssignedHours} ساعة</div>
          </div>
        </div>

        <div className="print:hidden flex shrink-0 items-center justify-between gap-3 border-b border-emerald-200 bg-emerald-50/60 p-3">
          <div className="relative w-full max-w-md">
            <Search
              className={`pointer-events-none absolute top-2.5 h-4 w-4 text-emerald-600 ${
                isRtl ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={
                isRtl
                  ? 'تصفية بالأستاذ أو المادة...'
                  : 'Filtrer par enseignant ou matière...'
              }
              className={`w-full rounded-lg border border-emerald-300 bg-white py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 ${
                isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          <div className="shrink-0 text-xs font-bold text-slate-700">
            {isRtl ? 'عدد الأساتذة: ' : 'Enseignants: '}
            <span className="font-extrabold text-emerald-800">
              {filteredTeachers.length}
            </span>
            {' | '}
            {isRtl ? 'مجموع الساعات: ' : 'Total heures: '}
            <span className="font-extrabold text-emerald-800">
              {totalAssignedHours} {isRtl ? 'ساعة' : 'h'}
            </span>
          </div>
        </div>

        <div className="print-table-wrap min-h-0 flex-1 overflow-auto bg-slate-50 p-2">
          <div className="w-full rounded-lg border border-slate-400 bg-white shadow-sm">
            <table className="print-assignment-table w-full table-fixed border-collapse text-center text-[10px]">
              <thead className="sticky top-0 z-40">
                <tr className="border-b-2 border-slate-400 bg-[#E2E8F0] text-[11.5px] font-extrabold text-slate-900">
                  <th
                    className={`assignment-col-teacher sticky top-0 start-0 z-[70] w-[122px] border-e border-slate-400 bg-slate-300 px-1 py-1.5 ${
                      isRtl ? 'text-right pr-3' : 'text-left pl-3'
                    }`}
                  >
                    {isRtl ? 'الأستاذ(ة)' : 'Enseignant(e)'}
                  </th>

                  <th className="assignment-col-subject sticky top-0 start-[122px] z-[70] w-[52px] border-e border-slate-400 bg-slate-200 px-1 py-1.5">
                    {isRtl ? 'المادة' : 'Matière'}
                  </th>

                  {classes.map((classGroup) => (
                    <th
                      key={classGroup.id}
                      className="assignment-col-class sticky top-0 z-[60] w-[34px] border-e border-slate-400 bg-emerald-100/95 px-0.5 py-1 font-extrabold text-emerald-950"
                    >
                      <span className="block truncate text-[8.5px] leading-tight">{classGroup.code || classGroup.name}</span>
                    </th>
                  ))}

                  <th className="assignment-col-total sticky top-0 z-[60] w-[48px] border-e border-slate-400 bg-amber-200 px-1 py-1 font-black text-amber-950">
                    {isRtl ? 'المجموع' : 'Total'}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-300 font-bold">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={classes.length + 3}
                      className="px-4 py-12 text-center text-sm font-semibold text-slate-500"
                    >
                      {isRtl
                        ? 'لا يوجد أستاذ مطابق للبحث.'
                        : 'Aucun enseignant correspondant.'}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher, index) => {
                    const primarySubject = subjects.find((subject) =>
                      teacher.subjectIds?.includes(subject.id)
                    );

                    const totalHours = teacherTotals[teacher.id] || 0;

                    return (
                      <tr
                        key={teacher.id}
                        className={
                          index % 2 === 0
                            ? 'bg-white hover:bg-emerald-50/50'
                            : 'bg-slate-50 hover:bg-emerald-50/50'
                        }
                      >
                        <td
                          className={`assignment-col-teacher sticky start-0 z-10 w-[122px] border-e border-slate-300 bg-slate-100/95 px-1 py-1 font-extrabold text-slate-900 ${
                            isRtl ? 'text-right pr-3' : 'text-left pl-3'
                          }`}
                        >
                          <span className="screen-teacher-label block truncate">
                            {teacher.name || teacher.code || teacher.id}
                          </span>
                          <span className="print-teacher-label hidden truncate">
                            {teacher.name || '—'}
                          </span>
                          {teacher.code ? (
                            <div className="screen-teacher-code mt-0.5 text-[9px] font-bold text-slate-500">
                              {teacher.code}
                            </div>
                          ) : null}
                        </td>

                        <td className="sticky start-[122px] z-10 w-[52px] border-e border-slate-300 bg-slate-100/95 px-1 py-1 font-bold">
                          {primarySubject ? (
                            <>
                              <span
                                className="screen-subject-badge inline-flex rounded px-1.5 py-0.5 text-[10.5px] font-black"
                                style={{
                                  backgroundColor:
                                    primarySubject.color || '#F3F4F6',
                                  color:
                                    primarySubject.textColor || '#111827',
                                }}
                              >
                                <span className="block truncate text-[9px] leading-tight">
                                  {primarySubject.code || primarySubject.name}
                                </span>
                              </span>
                              <span className="print-subject-text hidden text-[9px] font-black text-slate-900">
                                {primarySubject.code || primarySubject.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {classes.map((classGroup) => {
                          const hours =
                            hoursMatrix[teacher.id]?.[classGroup.id] || 0;

                          return (
                            <td
                              key={classGroup.id}
                              className={`assignment-cell w-[34px] border-e border-slate-300 px-0.5 py-0.5 ${
                                hours > 0 ? 'bg-emerald-50/70' : ''
                              }`}
                            >
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={hours || ''}
                                onChange={(event) =>
                                  updateCell(
                                    teacher.id,
                                    classGroup.id,
                                    event.target.value
                                  )
                                }
                                className={`screen-assignment-input h-7 w-full rounded border px-0 text-center text-[9px] font-black outline-none transition ${
                                  hours > 0
                                    ? 'border-emerald-200 bg-emerald-50 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                                    : 'border-transparent bg-transparent text-slate-400 hover:border-slate-200 hover:bg-white focus:border-emerald-400 focus:bg-white'
                                }`}
                                aria-label={`${teacher.name} - ${classGroup.code}`}
                              />
                              <span className="print-cell-value hidden text-[9px] font-black text-slate-900">
                                {hours > 0 ? hours : ''}
                              </span>
                            </td>
                          );
                        })}

                        <td className="w-[48px] border-e border-slate-300 bg-amber-100 px-1 py-1 text-[10px] font-black text-amber-950">
                          {totalHours}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              <tfoot>
                <tr className="assignment-total-row border-t-2 border-amber-300 bg-amber-50 text-amber-950">
                  <td
                    colSpan={2}
                    className="p-2 text-start text-xs font-black"
                  >
                    {isRtl ? 'المجموع' : 'Total'}
                  </td>

                  {classes.map((classGroup) => {
                    const classTotal = teachers.reduce(
                      (sum, teacher) =>
                        sum +
                        (hoursMatrix[teacher.id]?.[classGroup.id] || 0),
                      0
                    );

                    return (
                      <td
                        key={classGroup.id}
                        className="w-[34px] border-e border-amber-200 px-0.5 py-1 text-[9px] font-black"
                      >
                        {classTotal || ''}
                      </td>
                    );
                  })}

                  <td className="w-[48px] border-e border-amber-200 px-1 py-1 text-[10px] font-black">
                    {totalAssignedHours}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="print-report-footer hidden pt-6" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="grid grid-cols-2 gap-16">
            <div>
              <div className="print-footer-label text-[10px] font-bold text-black">
                {isRtl ? 'ملاحظات المدير' : 'Observations du directeur'}
              </div>
              <div className="print-footer-line mt-3 min-h-[18px] border-b border-dotted border-black text-[9px] text-black">
                {directorNote}
              </div>
              <div className="print-footer-line mt-6 min-h-[18px] border-b border-dotted border-black" />
            </div>
            <div>
              <div className="print-footer-label text-[10px] font-bold text-black">
                {isRtl ? 'توقيع المدير' : 'Signature du directeur'}
              </div>
              <div className="print-footer-line mt-3 min-h-[18px] border-b border-dotted border-black" />
              <div className="print-stamp-box mt-4 h-[52px] w-[104px] border border-black" />
            </div>
          </div>
        </div>

        <div className="print:hidden flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-100 px-5 py-3">
          <div className="min-w-0">
            {saveMessage ? (
              <div className="text-xs font-black text-emerald-700">
                {saveMessage}
              </div>
            ) : saveError ? (
              <div className="text-xs font-black text-red-700">
                {saveError}
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-600">
                {isRtl
                  ? 'أدخل عدد الساعات في الخانة المقابلة لكل أستاذ وقسم. لا يوجد هنا نوع حصة.'
                  : 'Saisissez le volume horaire dans chaque cellule. Le type de séance n’est pas défini ici.'}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {isRtl ? 'إغلاق' : 'Fermer'}
            </button>

            <button
              type="button"
              onClick={() => void saveAssignments()}
              disabled={saving || teachers.length === 0}
              className="rounded-lg bg-[#065F46] px-5 py-1.5 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50"
            >
              {saving
                ? isRtl
                  ? 'جاري الحفظ...'
                  : 'Enregistrement...'
                : isRtl
                  ? 'حفظ الإسناد'
                  : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          html,
          body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .fixed.inset-0.z-\[1000\],
          .fixed.inset-0.z-\[1000\] * {
            visibility: visible !important;
          }

          .fixed.inset-0.z-\[1000\] {
            position: absolute !important;
            inset: 0 !important;
            background: white !important;
            padding: 0 !important;
          }

          .fixed.inset-0.z-\[1000\] > div {
            max-height: none !important;
            width: 100% !important;
            max-width: none !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 10mm 12mm 8mm !important;
            font-family: 'Arial', 'Traditional Arabic', 'Segoe UI', sans-serif !important;
            color: #000 !important;
          }

          .fixed.inset-0.z-\[1000\] button {
            display: none !important;
          }

          .print-report-header {
            display: block !important;
            margin-bottom: 4mm !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-report-footer {
            display: block !important;
            margin-top: 8mm !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-school-name {
            font-size: 14pt !important;
            font-weight: 700 !important;
          }

          .print-meta-line {
            font-size: 10pt !important;
          }

          .print-title {
            font-size: 15pt !important;
            font-weight: 700 !important;
            color: #1b5e20 !important;
            letter-spacing: 0.02em !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-stats-row {
            font-size: 9.5pt !important;
            border-bottom-color: #bfbfbf !important;
          }

          .print-table-wrap {
            overflow: visible !important;
            background: white !important;
            padding: 0 !important;
            margin-top: 2mm !important;
          }

          .print-table-wrap > div {
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .print-assignment-table {
            width: 100% !important;
            table-layout: fixed !important;
            border: 1px solid #000 !important;
            border-collapse: collapse !important;
            font-size: 9pt !important;
          }

          .print-assignment-table thead {
            display: table-header-group !important;
          }

          .print-assignment-table tfoot {
            display: table-footer-group !important;
          }

          .print-assignment-table tbody tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-assignment-table th,
          .print-assignment-table td {
            position: static !important;
            border: 1px solid #000 !important;
            background: #fff !important;
            color: #000 !important;
            padding: 4px 3px !important;
            vertical-align: middle !important;
            text-align: center !important;
            line-height: 1.35 !important;
          }

          .print-assignment-table thead th {
            background: #d9d9d9 !important;
            font-size: 8.5pt !important;
            font-weight: 700 !important;
            padding: 5px 3px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-assignment-table tbody td {
            font-size: 9pt !important;
            font-weight: 400 !important;
            height: 24px !important;
          }

          .print-assignment-table .assignment-col-teacher {
            width: 18% !important;
            text-align: center !important;
            font-weight: 600 !important;
          }

          .print-assignment-table .assignment-col-subject {
            width: 6% !important;
            font-weight: 600 !important;
          }

          .print-assignment-table .assignment-col-class {
            width: auto !important;
            font-size: 8pt !important;
            font-weight: 700 !important;
            padding: 4px 2px !important;
          }

          .print-assignment-table .assignment-col-total {
            width: 6% !important;
            font-weight: 700 !important;
            background: #f2f2f2 !important;
          }

          .print-assignment-table .assignment-total-row td {
            background: #d9d9d9 !important;
            font-weight: 700 !important;
            font-size: 9pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-assignment-table tbody tr:nth-child(even) td {
            background: #fff !important;
          }

          .screen-teacher-label {
            display: none !important;
          }

          .print-teacher-label {
            display: inline !important;
          }

          .screen-teacher-code {
            display: none !important;
          }

          .screen-assignment-input {
            display: none !important;
          }

          .print-cell-value {
            display: inline !important;
            font-size: 9pt !important;
            font-weight: 400 !important;
          }

          .screen-subject-badge {
            display: none !important;
          }

          .print-subject-text {
            display: inline !important;
            font-weight: 600 !important;
          }

          .print-stamp-box {
            display: block !important;
          }

          .print-footer-label {
            font-size: 10pt !important;
          }

          .print-footer-line {
            border-bottom-color: #666 !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherClassAssignmentModal;