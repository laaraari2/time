import React, { useMemo, useState } from 'react';
import { X, Clock3, Search, Save, Users, BookOpen } from 'lucide-react';
import { Teacher, Subject, ClassGroup } from '../types';

export interface WeeklyHoursAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classGroupId: string;
  weeklyHours: number;
}

interface WeeklyHoursAssignmentModalProps {
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassGroup[];
  assignments?: WeeklyHoursAssignment[];
  onClose: () => void;
  onSave: (assignments: WeeklyHoursAssignment[]) => void;
  language?: 'ar' | 'fr';
}

export const WeeklyHoursAssignmentModal: React.FC<
  WeeklyHoursAssignmentModalProps
> = ({
  teachers,
  subjects,
  classes,
  assignments = [],
  onClose,
  onSave,
  language = 'ar',
}) => {
  const isRtl = language === 'ar';
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    teachers[0]?.id ?? ''
  );
  const [searchTeacher, setSearchTeacher] = useState('');
  const [localAssignments, setLocalAssignments] =
    useState<WeeklyHoursAssignment[]>(assignments);

  const selectedTeacher = teachers.find(
    (teacher) => teacher.id === selectedTeacherId
  );

  const teacherSubjects = useMemo(() => {
    if (!selectedTeacher) return [];
    return subjects.filter((subject) =>
      selectedTeacher.subjectIds?.includes(subject.id)
    );
  }, [selectedTeacher, subjects]);

  const teacherClasses = useMemo(() => {
    const ids = new Set(
      ((selectedTeacher as Teacher & { classGroupIds?: string[] })
        ?.classGroupIds ?? [])
    );
    return classes.filter((classGroup) => ids.has(classGroup.id));
  }, [selectedTeacher, classes]);

  const filteredTeachers = useMemo(() => {
    const term = searchTeacher.trim().toLowerCase();
    if (!term) return teachers;

    return teachers.filter((teacher) =>
      [teacher.name, teacher.code]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [teachers, searchTeacher]);

  const getHours = (teacherId: string, subjectId: string, classGroupId: string) =>
    localAssignments.find(
      (item) =>
        item.teacherId === teacherId &&
        item.subjectId === subjectId &&
        item.classGroupId === classGroupId
    )?.weeklyHours ?? 0;

  const setHours = (
    teacherId: string,
    subjectId: string,
    classGroupId: string,
    value: number
  ) => {
    const weeklyHours = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));

    setLocalAssignments((previous) => {
      const index = previous.findIndex(
        (item) =>
          item.teacherId === teacherId &&
          item.subjectId === subjectId &&
          item.classGroupId === classGroupId
      );

      if (weeklyHours === 0) {
        return index === -1
          ? previous
          : previous.filter((_, itemIndex) => itemIndex !== index);
      }

      const nextItem: WeeklyHoursAssignment = {
        id:
          index === -1
            ? `weekly-${teacherId}-${subjectId}-${classGroupId}`
            : previous[index].id,
        teacherId,
        subjectId,
        classGroupId,
        weeklyHours,
      };

      if (index === -1) return [...previous, nextItem];

      return previous.map((item, itemIndex) =>
        itemIndex === index ? nextItem : item
      );
    });
  };

  const handleSave = () => {
    onSave(localAssignments);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#065F46] to-[#0F766E] px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-amber-300" />
            <div>
              <h2 className="text-sm font-black">
                {isRtl
                  ? 'تحديد الحصص الأسبوعية'
                  : 'Volume horaire hebdomadaire'}
              </h2>
              <p className="mt-0.5 text-[10px] text-white/75">
                {isRtl
                  ? 'حدد عدد الحصص المطلوبة لكل أستاذ وقسم. لا يتم إنشاء أي حصة من هنا.'
                  : 'Définissez le volume par enseignant et classe. Aucune séance n’est créée ici.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label={isRtl ? 'إغلاق' : 'Fermer'}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[270px_1fr]">
          <aside className="min-h-0 overflow-y-auto border-b border-slate-200 bg-slate-50 p-3 md:border-b-0 md:border-e">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-slate-800">
              <Users className="h-4 w-4 text-emerald-700" />
              {isRtl ? 'الأساتذة' : 'Enseignants'}
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={searchTeacher}
                onChange={(event) => setSearchTeacher(event.target.value)}
                placeholder={isRtl ? 'بحث عن أستاذ...' : 'Rechercher...'}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 ps-8 pe-2 text-xs font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-1.5">
              {filteredTeachers.map((teacher) => (
                <button
                  key={teacher.id}
                  type="button"
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  className={`w-full rounded-xl border p-3 text-start transition ${
                    teacher.id === selectedTeacherId
                      ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-black text-slate-900">
                      {teacher.name}
                    </span>
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-500">
                      {teacher.code}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-4">
            {!selectedTeacher ? (
              <div className="flex h-full items-center justify-center text-xs font-bold text-slate-500">
                {isRtl ? 'اختر أستاذاً' : 'Sélectionnez un enseignant'}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-700" />
                    <div>
                      <div className="text-sm font-black text-emerald-950">
                        {selectedTeacher.name}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-800">
                        {teacherSubjects.length > 0
                          ? teacherSubjects
                              .map((subject) => `${subject.code} — ${subject.name}`)
                              .join(' · ')
                          : isRtl
                            ? 'لا توجد مادة مرتبطة بهذا الأستاذ'
                            : 'Aucune matière liée à cet enseignant'}
                      </div>
                    </div>
                  </div>
                </div>

                {teacherClasses.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-xs font-bold text-amber-900">
                    {isRtl
                      ? 'لا توجد أقسام مسندة لهذا الأستاذ. ارجع إلى «إسناد الأقسام» أولاً.'
                      : 'Aucune classe affectée. Utilisez d’abord « Affecter les classes ».'}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-[1fr_1.4fr_120px] border-b border-slate-200 bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-700">
                      <span>{isRtl ? 'القسم' : 'Classe'}</span>
                      <span>{isRtl ? 'المادة' : 'Matière'}</span>
                      <span className="text-center">
                        {isRtl ? 'الحصص / أسبوع' : 'Séances / semaine'}
                      </span>
                    </div>

                    {teacherClasses.map((classGroup) =>
                      teacherSubjects.map((subject) => (
                        <div
                          key={`${classGroup.id}-${subject.id}`}
                          className="grid grid-cols-[1fr_1.4fr_120px] items-center border-b border-slate-100 px-3 py-2 last:border-b-0"
                        >
                          <div className="truncate text-xs font-black text-slate-900">
                            {classGroup.code}
                          </div>
                          <div className="truncate text-[11px] font-semibold text-slate-600">
                            {subject.code} — {subject.name}
                          </div>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={getHours(
                              selectedTeacher.id,
                              subject.id,
                              classGroup.id
                            ) || ''}
                            onChange={(event) =>
                              setHours(
                                selectedTeacher.id,
                                subject.id,
                                classGroup.id,
                                Number(event.target.value)
                              )
                            }
                            className="mx-auto w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-black outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-[10px] font-semibold text-slate-500">
            {isRtl
              ? 'القيمة هنا هي عدد الحصص الأسبوعية المطلوبة.'
              : 'La valeur représente le nombre de séances hebdomadaires demandées.'}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              {isRtl ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-800"
            >
              <Save className="h-4 w-4" />
              {isRtl ? 'حفظ' : 'Enregistrer'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default WeeklyHoursAssignmentModal;