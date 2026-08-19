import React, { useState, useEffect } from 'react';
import { Teacher, Subject, ClassGroup, Lesson } from '../types';
import { X, Plus, Trash2, Users, Check, Layers, Clock, Sparkles } from 'lucide-react';

interface TeacherAssignModalProps {
  teacher?: Teacher | null;
  subjects: Subject[];
  classes: ClassGroup[];
  existingLessons: Lesson[];
  onClose: () => void;
  onSaveTeacherAndLessons: (teacher: Teacher, lessonsForTeacher: Lesson[]) => void;
}

interface ClassAssignmentRow {
  id: string; // temp ID for key
  classGroupId: string;
  weeklyPeriods: number;
  isDoublePeriod: boolean; // true = حصص مزدوجة (2س), false = منفردة (1س)
  groupType: 'full' | 'G1' | 'G2' | 'both_groups'; // قسم كامل / فوج 1 / فوج 2 / حصتان مفوجتان
}

export const TeacherAssignModal: React.FC<TeacherAssignModalProps> = ({
  teacher,
  subjects,
  classes,
  existingLessons,
  onClose,
  onSaveTeacherAndLessons,
}) => {
  const isEditing = !!teacher;

  // Basic Info State
  const [teacherCode, setTeacherCode] = useState(teacher?.code || '');
  const [teacherName, setTeacherName] = useState(teacher?.name || '');
  const [teacherColor, setTeacherColor] = useState(teacher?.color || '#FFFFFF');
  const [teacherTextColor, setTeacherTextColor] = useState(teacher?.textColor || '#FFFFFF');
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    teacher?.subjectIds?.[0] || (subjects[0]?.id ?? '')
  );

  // Class Assignments State
  const [assignments, setAssignments] = useState<ClassAssignmentRow[]>(() => {
    if (!teacher) return [];
    // Filter existing lessons for this teacher
    const teacherLessons = existingLessons.filter((l) => l.teacherId === teacher.id);
    if (teacherLessons.length === 0) return [];

    // Group lessons by classGroupId
    const map = new Map<string, ClassAssignmentRow>();
    teacherLessons.forEach((lsn) => {
      const rowId = `row-${lsn.classGroupId}-${Date.now()}-${Math.random()}`;
      let gType: ClassAssignmentRow['groupType'] = 'full';
      if (lsn.groupType === 'G1') gType = 'G1';
      else if (lsn.groupType === 'G2') gType = 'G2';

      map.set(rowId, {
        id: rowId,
        classGroupId: lsn.classGroupId,
        weeklyPeriods: lsn.weeklyPeriods || 4,
        isDoublePeriod: !!lsn.isDoublePeriod,
        groupType: gType,
      });
    });

    return Array.from(map.values());
  });

  // Handle adding new class row
  const handleAddClassRow = () => {
    // Find first class not yet assigned
    const assignedClassIds = new Set(assignments.map((a) => a.classGroupId));
    const unassignedClass = classes.find((c) => !assignedClassIds.has(c.id)) || classes[0];

    if (!unassignedClass) return;

    const newRow: ClassAssignmentRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      classGroupId: unassignedClass.id,
      weeklyPeriods: 4,
      isDoublePeriod: false, // Default: منفردة (1س)
      groupType: 'full', // Default: قسم كامل
    };
    setAssignments([...assignments, newRow]);
  };

  // Handle removing class row
  const handleRemoveRow = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id));
  };

  // Update specific row
  const handleUpdateRow = <K extends keyof ClassAssignmentRow>(
    id: string,
    key: K,
    value: ClassAssignmentRow[K]
  ) => {
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, [key]: value } : a))
    );
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherCode.trim() || !teacherName.trim()) return;

    const teacherId = teacher?.id || `t-${Date.now()}`;
    const updatedTeacher: Teacher = {
      id: teacherId,
      code: teacherCode.trim(),
      name: teacherName.trim(),
      color: teacherColor,
      textColor: teacherTextColor,
      subjectIds: selectedSubjectId ? [selectedSubjectId] : [],
      unavailableSlots: teacher?.unavailableSlots || [],
    };

    // Generate Lessons for this teacher based on assignments
    const newLessons: Lesson[] = [];

    assignments.forEach((assign) => {
      if (!assign.classGroupId) return;

      if (assign.groupType === 'both_groups') {
        // Create 2 lessons: Group 1 and Group 2
        newLessons.push({
          id: `lsn-${teacherId}-${assign.classGroupId}-g1-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          classGroupId: assign.classGroupId,
          subjectId: selectedSubjectId,
          teacherId: teacherId,
          weeklyPeriods: assign.weeklyPeriods,
          isDoublePeriod: assign.isDoublePeriod,
          groupType: 'G1',
          groupName: 'فوج 1',
        });
        newLessons.push({
          id: `lsn-${teacherId}-${assign.classGroupId}-g2-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          classGroupId: assign.classGroupId,
          subjectId: selectedSubjectId,
          teacherId: teacherId,
          weeklyPeriods: assign.weeklyPeriods,
          isDoublePeriod: assign.isDoublePeriod,
          groupType: 'G2',
          groupName: 'فوج 2',
        });
      } else {
        newLessons.push({
          id: `lsn-${teacherId}-${assign.classGroupId}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          classGroupId: assign.classGroupId,
          subjectId: selectedSubjectId,
          teacherId: teacherId,
          weeklyPeriods: assign.weeklyPeriods,
          isDoublePeriod: assign.isDoublePeriod,
          groupType: assign.groupType === 'full' ? 'full' : assign.groupType,
          groupName:
            assign.groupType === 'G1'
              ? 'فوج 1'
              : assign.groupType === 'G2'
              ? 'فوج 2'
              : undefined,
        });
      }
    });

    onSaveTeacherAndLessons(updatedTeacher, newLessons);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Users className="w-5 h-5 text-amber-300" />
            <span>{isEditing ? `تعديل بيانات الأستاذ وإسناد الحصص: ${teacher?.name}` : 'إضافة أستاذ جديد وتعيين الفصول والحصص'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-800">
          {/* Section 1: Basic Teacher Info */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-xs text-teal-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>المعلومات الأساسية للأستاذ والمادة المدرسة</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الرمز المختصر للأستاذ:</label>
                <input
                  type="text"
                  placeholder="مثال: أ.العلمي"
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded font-bold bg-white focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الأستاذ الكامل:</label>
                <input
                  type="text"
                  placeholder="مثال: أستاذ العلمي (رياضيات)"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded font-bold bg-white focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المادة المدرسة:</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded font-bold bg-white focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">اختر المادة...</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">لون الأستاذ:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={teacherColor}
                    onChange={(e) => setTeacherColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border border-slate-300 p-0.5"
                  />
                  <input
                    type="color"
                    value={teacherTextColor}
                    onChange={(e) => setTeacherTextColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border border-slate-300 p-0.5"
                    title="لون النص"
                  />
                  <span className="text-[10px] text-slate-500">الخلفية / النص</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Class Assignments, Hours, Double/Single, and Grouping (التفويج) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-teal-50/70 p-3 rounded-lg border border-teal-200">
              <div>
                <h4 className="font-extrabold text-xs text-teal-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-700" />
                  <span>الفصول المسندة مع عدد الساعات، نمط الحصص (منفردة/مزدوجة) والتفويج</span>
                </h4>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  حدد لكل فصل عدد الساعات الأسبوعية، نوع الحصص (1س منفردة أو 2س مزدوجة) وحالة التفويج (قسم كامل أو أفواج G1/G2).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddClassRow}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إسناد فصل جديد</span>
              </button>
            </div>

            {/* List of class assignments */}
            {assignments.length === 0 ? (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-500 bg-slate-50">
                <p className="font-bold text-xs">لم يتم إسناد أي فصول لهذا الأستاذ بعد</p>
                <p className="text-[11px] text-slate-400 mt-1">اضغط على زر "إسناد فصل جديد" لأعلى لإضافة الفصول المدرسية للأستاذ.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {assignments.map((assign, idx) => (
                  <div
                    key={assign.id}
                    className="p-3 bg-white rounded-lg border border-slate-300 shadow-2xs space-y-2.5 hover:border-teal-400 transition"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Class Selection */}
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          الفصل الدراسي:
                        </label>
                        <select
                          value={assign.classGroupId}
                          onChange={(e) => handleUpdateRow(assign.id, 'classGroupId', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded font-bold text-violet-900 bg-slate-50 focus:bg-white"
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} - {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Weekly Hours */}
                      <div className="w-28">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          عدد الساعات الأسبوعية:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={assign.weeklyPeriods}
                          onChange={(e) =>
                            handleUpdateRow(assign.id, 'weeklyPeriods', Number(e.target.value))
                          }
                          className="w-full text-xs p-1.5 border border-slate-300 rounded font-bold text-center bg-slate-50 focus:bg-white"
                        />
                      </div>

                      {/* Period Type: Single vs Double */}
                      <div className="min-w-[150px]">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          نوع ونمط الحصص:
                        </label>
                        <select
                          value={assign.isDoublePeriod ? 'double' : 'single'}
                          onChange={(e) =>
                            handleUpdateRow(assign.id, 'isDoublePeriod', e.target.value === 'double')
                          }
                          className="w-full text-xs p-1.5 border border-slate-300 rounded font-bold bg-slate-50 focus:bg-white"
                        >
                          <option value="single">حصة منفردة (1 ساعة)</option>
                          <option value="double">حصة مزدوجة (2 ساعتان متتاليتان)</option>
                        </select>
                      </div>

                      {/* Grouping / التفويج */}
                      <div className="flex-1 min-w-[170px]">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          التفويج (أفواج / قسم كامل):
                        </label>
                        <select
                          value={assign.groupType}
                          onChange={(e) =>
                            handleUpdateRow(
                              assign.id,
                              'groupType',
                              e.target.value as ClassAssignmentRow['groupType']
                            )
                          }
                          className="w-full text-xs p-1.5 border border-slate-300 rounded font-bold bg-slate-50 focus:bg-white text-emerald-900"
                        >
                          <option value="full">قسم كامل (دون تفويج)</option>
                          <option value="G1">مفوج - الفوج الأول فقط (Fouj 1)</option>
                          <option value="G2">مفوج - الفوج الثاني فقط (Fouj 2)</option>
                          <option value="both_groups">تفويج متوازي (إنشاء حصص للفوج 1 + الفوج 2)</option>
                        </select>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(assign.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition mt-4 cursor-pointer"
                        title="حذف هذا الإسناد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Badge Info Summary */}
                    <div className="flex items-center gap-2 text-[10.5px] font-semibold text-slate-600 pt-1 border-t border-slate-100">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {assign.weeklyPeriods} حصص/ساعات أسبوعياً
                      </span>
                      <span className={`px-2 py-0.5 rounded border ${assign.isDoublePeriod ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-blue-50 text-blue-900 border-blue-200'}`}>
                        {assign.isDoublePeriod ? 'حصة مزدوجة (2س)' : 'حصة منفردة (1س)'}
                      </span>
                      <span className={`px-2 py-0.5 rounded border ${assign.groupType !== 'full' ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-extrabold' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                        {assign.groupType === 'full' && 'قسم كامل'}
                        {assign.groupType === 'G1' && 'تفويج: الفوج 1'}
                        {assign.groupType === 'G2' && 'تفويج: الفوج 2'}
                        {assign.groupType === 'both_groups' && 'تفويج كامل (الفوج 1 + الفوج 2)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="bg-slate-100 px-4 py-3 rounded-lg border border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500 font-bold">
              إجمالي الساعات المسندة للأستاذ: {assignments.reduce((sum, a) => sum + (a.groupType === 'both_groups' ? a.weeklyPeriods * 2 : a.weeklyPeriods), 0)} ساعة/حصة أسبوعياً
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold px-4 py-2 rounded transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2 rounded flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ الأستاذ وتأكيد الحصص</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
