import React, { useState } from 'react';
import { Play, CheckCircle2, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface AutoGenerateModalProps {
  onClose: () => void;
  onStartGeneration: () => void;
}

export const AutoGenerateModal: React.FC<AutoGenerateModalProps> = ({
  onClose,
  onStartGeneration,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleStart = () => {
    setIsGenerating(true);
    setIsDone(false);

    // Let React render the loading state before running the solver.
    window.setTimeout(() => {
      onStartGeneration();
      setIsGenerating(false);
      setIsDone(true);
    }, 50);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#20518D] to-[#1D4A82] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <RefreshCw className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>المولد التلقائي لاستعمال الزمن</span>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-slate-800 text-xs">
          {!isGenerating && !isDone && (
            <>
              <p className="text-slate-600 leading-relaxed font-medium">
                يقوم محرك الجدولة بتحليل القيود الأساسية للمؤسسة، توفر الأساتذة، القاعات، طاقة الاستيعاب، والساعات اليومية قبل اختيار أفضل التوزيعات الممكنة.
              </p>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
                  <div className="bg-white rounded border p-2">✓ منع تعارض الأستاذ والقسم</div>
                  <div className="bg-white rounded border p-2">✓ احترام عدم توفر الأستاذ</div>
                  <div className="bg-white rounded border p-2">✓ احترام طاقة القاعات</div>
                  <div className="bg-white rounded border p-2">✓ احترام الساعات اليومية</div>
                  <div className="bg-white rounded border p-2">✓ توزيع الحصص على الأسبوع</div>
                  <div className="bg-white rounded border p-2">✓ دعم الحصص المزدوجة</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                <span>ملاحظة: سيتم إعادة توزيع الحصص غير المعينة وإلغاء أي تعارضات سابقة.</span>
              </div>
            </>
          )}

          {isGenerating && (
            <div className="py-8 text-center space-y-4">
              <RefreshCw className="w-10 h-10 mx-auto text-blue-700 animate-spin" />
              <div className="text-sm font-extrabold text-blue-900">
                جاري حساب التوزيع الأفضل للحصص...
              </div>
              <p className="text-slate-500 text-xs">
                يتم احترام القيود الصارمة أولاً ثم تحسين توزيع الحصص قدر الإمكان.
              </p>
            </div>
          )}

          {isDone && (
            <div className="py-4 text-center space-y-3">
              <div className="inline-flex p-3 bg-emerald-100 rounded-full text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="text-base font-extrabold text-emerald-800">
                تم إنشاء الجدول المدرسي بنجاح!
              </div>
              <p className="text-slate-600">
                تم إنشاء توزيع جديد. إذا بقيت حصص غير مسكنة فسيظهر لك تنبيه يوضح ما يجب مراجعته.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          {!isGenerating && !isDone && (
            <button
              onClick={handleStart}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-5 py-2.5 rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>بدء التوليد التلقائي</span>
            </button>
          )}
          {isDone && (
            <button
              onClick={onClose}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-6 py-2 rounded shadow-xs cursor-pointer"
            >
              عرض الجدول الناتج
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
