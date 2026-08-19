import React, { useState } from 'react';
import { Placement, Lesson, Subject, Teacher, ClassGroup, Classroom, Conflict } from '../types';
import { X, DoorOpen, Trash2, Check, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';

interface LessonCardModalProps {
  placement: Placement;
  lesson: Lesson;
  subject?: Subject;
  teacher?: Teacher;
  classGroup?: ClassGroup;
  currentRoom?: Classroom;
  allRooms: Classroom[];
  allTeachers: Teacher[];
  conflicts: Conflict[];
  onClose: () => void;
  onUpdatePlacement: (placementId: string, newRoomId?: string, newTeacherId?: string) => void;
  onRemovePlacement: (placementId: string) => void;
}

export const LessonCardModal: React.FC<LessonCardModalProps> = ({
  placement,
  lesson,
  subject,
  teacher,
  classGroup,
  currentRoom,
  allRooms,
  allTeachers,
  conflicts,
  onClose,
  onUpdatePlacement,
  onRemovePlacement,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    placement.roomId || lesson.preferredRoomId || ''
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teacher?.id || lesson.teacherId
  );

  const cardConflicts = conflicts.filter((c) => c.placementIds.includes(placement.id));
  const hasConflict = cardConflicts.length > 0;

  const handleSave = () => {
    onUpdatePlacement(placement.id, selectedRoomId, selectedTeacherId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-300">
        {/* Header */}
        <div
          className="px-5 py-3.5 flex items-center justify-between text-white"
          style={{
            backgroundColor: teacher?.color || '#20518D',
            color: teacher?.textColor || '#FFFFFF',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-wide">
              بطاقة الحصة: {subject?.name || 'مادة'} ({subject?.code})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-slate-800 text-xs">
          {/* Conflict Banner if present */}
          {hasConflict ? (
            <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-900 block mb-0.5">تعارض Detected!</span>
                {cardConflicts.map((c) => (
                  <p key={c.id} className="text-[11px] leading-tight text-red-700">
                    • {c.message}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>الحصة مسكنة بدون أي تعارض زمني أو مكاني.</span>
            </div>
          )}

          {/* Details Overview Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 text-[10px] block font-bold">الفصل الدراسي:</span>
              <span className="font-bold text-violet-900 text-sm">{classGroup?.code} - {classGroup?.name}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-bold">المادة الدراسية:</span>
              <span className="font-bold text-slate-900 text-sm">{subject?.name}</span>
            </div>
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="font-bold text-slate-700 mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>الأستاذ المسند للحصة:</span>
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {allTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* Room Selection */}
          <div>
            <label className="font-bold text-slate-700 mb-1 flex items-center gap-1">
              <DoorOpen className="w-3.5 h-3.5 text-orange-600" />
              <span>قاعة التدريس المخصصة:</span>
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- بدون تحديد (قاعة عادية) --</option>
              {allRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onRemovePlacement(placement.id);
              onClose();
            }}
            className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-2 rounded border border-red-300 flex items-center gap-1 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>إلغاء التسكين</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2 rounded shadow-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
