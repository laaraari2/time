import React from 'react';
import { Teacher, TimetableConfig } from '../types';
import { X, Check, CalendarX, CheckCircle, AlertCircle } from 'lucide-react';

interface TeacherAvailabilityModalProps {
  teacher: Teacher;
  config: TimetableConfig;
  onClose: () => void;
  onSave: (updatedTeacher: Teacher) => void;
}

export const TeacherAvailabilityModal: React.FC<TeacherAvailabilityModalProps> = ({
  teacher,
  config,
  onClose,
  onSave,
}) => {
  const [unavailableSlots, setUnavailableSlots] = React.useState<
    { dayIndex: number; periodIndex: number }[]
  >(teacher.unavailableSlots || []);

  const isSlotUnavailable = (dayIndex: number, periodIndex: number) => {
    return unavailableSlots.some(
      (s) => s.dayIndex === dayIndex && s.periodIndex === periodIndex
    );
  };

  const toggleSlot = (dayIndex: number, periodIndex: number) => {
    if (isSlotUnavailable(dayIndex, periodIndex)) {
      setUnavailableSlots((prev) =>
        prev.filter((s) => !(s.dayIndex === dayIndex && s.periodIndex === periodIndex))
      );
    } else {
      setUnavailableSlots((prev) => [...prev, { dayIndex, periodIndex }]);
    }
  };

  const handleSave = () => {
    onSave({
      ...teacher,
      unavailableSlots,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CalendarX className="w-5 h-5 text-amber-300" />
            <span>جدول تفريغات وتفضيلات الأستاذ: {teacher.name} ({teacher.code})</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-slate-800 text-xs">
          <p className="text-slate-600 font-medium leading-relaxed">
            انقر على أي حصة في جدول الأسبوع لتبديل الحالة بين <span className="text-emerald-700 font-bold">متاح (علامة صح خضراء)</span> و <span className="text-red-700 font-bold font-mono">غير متاح / تفرغ (علامة X حمراء)</span>. لن يقوم المولد بوضع حصص للأستاذ في الأوقات المحددة كغير متاحة.
          </p>

          {/* Legend */}
          <div className="flex items-center gap-4 bg-slate-100 p-2.5 rounded-md border border-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <div className="w-5 h-5 rounded bg-emerald-100 border border-emerald-400 flex items-center justify-center text-emerald-700">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>متاح للتدريس</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-800 font-bold">
              <div className="w-5 h-5 rounded bg-red-100 border border-red-400 flex items-center justify-center text-red-700 font-extrabold">
                ✕
              </div>
              <span>غير متاح (تفرغ محدد)</span>
            </div>
          </div>

          {/* Grid */}
          <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="bg-slate-200 text-slate-800 font-bold text-xs border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 bg-slate-300 w-24">اليوم \ الحصة</th>
                  {config.periods.map((p) => (
                    <th key={p.periodIndex} className="p-1.5 border-r border-slate-300 text-[10px]">
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {config.days.map((dayName, dayIdx) => (
                  <tr key={dayIdx} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-300 font-bold text-slate-800 bg-slate-100 text-xs">
                      {dayName}
                    </td>
                    {config.periods.map((p, periodIdx) => {
                      const unavailable = isSlotUnavailable(dayIdx, periodIdx);
                      return (
                        <td
                          key={periodIdx}
                          onClick={() => toggleSlot(dayIdx, periodIdx)}
                          className={`p-2 border-r border-slate-200 cursor-pointer transition-colors ${
                            unavailable
                              ? 'bg-red-100/90 text-red-700 hover:bg-red-200'
                              : 'bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          <div className="flex items-center justify-center font-extrabold text-sm h-6">
                            {unavailable ? '✕' : <Check className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold text-xs px-4 py-2 rounded transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2 rounded shadow-xs flex items-center gap-1 transition cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>حفظ التفرغات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
