import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Loader2, X, CheckCircle } from 'lucide-react';
import { Subject, Teacher, ClassGroup } from '../types';

interface AIAssistantModalProps {
  onClose: () => void;
  onApplyAISuggestion?: (data: any) => void;
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassGroup[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  onClose,
  subjects,
  teachers,
  classes,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const samplePrompts = [
    'كيف يمكن تقليل الحصص الفارغة (الفراغات) لأساتذة الرياضيات؟',
    'اقترح توزيعاً متوازناً لمادة الفيزياء والكيمياء بين الصبيحة والعشية.',
    'أنشئ توصيات لتفادي تجميع المواد الصعبة في الحصص الأخيرة.',
  ];

  const handleSendPrompt = async (textToSend?: string) => {
    const inputPrompt = textToSend || prompt;
    if (!inputPrompt.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputPrompt,
          context: {
            subjectCount: subjects.length,
            teacherCount: teachers.length,
            classCount: classes.length,
            classList: classes.map((c) => c.code),
            subjectList: subjects.map((s) => s.name),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.reply || 'تم تحليل الجدول وتقديم التوصيات بنجاح.');
      } else {
        setResponse('خدمة الذكاء الاصطناعي غير مهيأة حالياً. يمكنك استعمال مولّد الجدول وفحص التعارضات مباشرة، ثم ربط مزود AI لاحقاً.');
      }
    } catch (err) {
      console.error('AI assistant request failed:', err);
      setResponse('تعذر الوصول إلى خدمة الذكاء الاصطناعي حالياً. تأكد من إعداد مسار /api/generate-schedule ومفتاح مزود AI قبل استعمال هذه الميزة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>مساعد aSc الذكي (Gemini AI Timetable Assistant)</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-slate-800">
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-purple-900 flex items-start gap-2.5">
            <Bot className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">مرحباً بك! أنا مساعد الذكاء الاصطناعي لبرنامج aSc TimeTables.</p>
              <p className="mt-1 text-[11px] text-purple-800">
                يمكنني مساعدتك في صياغة قيود الجدول المدرسي، حل تعارضات الأساتذة، وتوزيع المواد بمرونة.
              </p>
            </div>
          </div>

          {/* Prompt Buttons */}
          <div>
            <div className="font-bold text-slate-700 mb-2">أسئلة مقترحة سريعة:</div>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(sp);
                    handleSendPrompt(sp);
                  }}
                  className="bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 border border-slate-300 hover:border-purple-300 px-3 py-1.5 rounded-full text-[11px] font-medium transition cursor-pointer"
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Box */}
          {loading && (
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-purple-800 bg-purple-50/50 rounded-lg border border-purple-100">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="font-bold text-xs">جاري التفكير وتحليل قيود الجدول...</span>
            </div>
          )}

          {response && !loading && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-purple-900 font-bold border-b border-slate-100 pb-2">
                <Bot className="w-4 h-4 text-purple-600" />
                <span>إجابة وتوصيات المساعد الذكي:</span>
              </div>
              <div className="whitespace-pre-line text-slate-700 leading-relaxed font-sans text-xs">
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 flex gap-2">
          <input
            type="text"
            placeholder="اسأل الذكاء الاصطناعي عن كيفية تنظيم الجدول أو حل التعارضات..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
            className="flex-1 text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
          />
          <button
            onClick={() => handleSendPrompt()}
            disabled={loading || !prompt.trim()}
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>إرسال</span>
          </button>
        </div>
      </div>
    </div>
  );
};
