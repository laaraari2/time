import React from 'react';
import { Conflict, TimetableConfig } from '../types';
import { AlertTriangle, CheckCircle, X, ShieldAlert } from 'lucide-react';

interface ConflictDrawerProps {
  conflicts: Conflict[];
  config: TimetableConfig;
  onClose: () => void;
  onResolveConflict: (placementId: string) => void;
}

export const ConflictDrawer: React.FC<ConflictDrawerProps> = ({
  conflicts,
  config,
  onClose,
  onResolveConflict,
}) => {
  return (
    <div className="fixed inset-y-0 left-0 w-80 sm:w-96 bg-white shadow-2xl border-r border-slate-300 z-50 flex flex-col select-none">
      {/* Drawer Header */}
      <div className="bg-red-700 text-white px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-300 animate-bounce" />
          <span>قائمة التعارضات والأخطاء ({conflicts.length})</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Conflicts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conflicts.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-emerald-700 space-y-2">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
            <div className="font-extrabold text-sm">الجدول خالٍ تماماً من التعارضات!</div>
            <p className="text-xs text-slate-500 max-w-[200px]">
              جميع الحصص مسندة بدون أي تداخل في أوقات القاعات أو الأساتذة.
            </p>
          </div>
        ) : (
          conflicts.map((conf) => {
            const dayName = config.days[conf.dayIndex] || '---';
            const periodLabel = config.periods[conf.periodIndex]?.label || '---';

            return (
              <div
                key={conf.id}
                className="bg-red-50/80 border-r-4 border-red-600 border border-red-200 p-3 rounded-md shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-center gap-1.5 text-red-900 font-bold">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    {dayName} - الحصة: {periodLabel}
                  </span>
                </div>

                <p className="text-slate-700 font-medium leading-relaxed">
                  {conf.message}
                </p>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      if (conf.placementIds[0]) {
                        onResolveConflict(conf.placementIds[0]);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1 rounded transition shadow-2xs cursor-pointer"
                  >
                    تفريغ الخانة لحل التعارض
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer */}
      <div className="bg-slate-100 p-3 border-t border-slate-200 flex justify-end">
        <button
          onClick={onClose}
          className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded shadow-xs cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
