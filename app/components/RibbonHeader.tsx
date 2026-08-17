import React from 'react';
import {
  FileText, FolderOpen, Save, Play, AlertTriangle,
  Printer, Sparkles, BookOpen, Users, School, DoorOpen,
  Calendar, RefreshCw, Eye, Maximize, Minimize, LogOut,
  Plus, Settings,
} from 'lucide-react';
import { DisplayMode } from '../types';
import { translations, Language } from '../utils/i18n';

interface RibbonHeaderProps {
  schoolName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  conflictCount: number;
  placedPercentage: number;
  isFullscreen?: boolean;
  language?: Language;
  onToggleFullscreen?: () => void;
  onToggleLanguage?: () => void;
  onNew: () => void;
  onOpenSavedProfiles: () => void;
  onOpenModal: (modalName: string) => void;
  onOpenTeacherClassAssignment: () => void;
  onAutoGenerate: () => void;
  onCheckConflicts: () => void;
  onPrintPreview: () => void;
  onExportJSON: () => void;
  onResetSample: () => void;
  isSaved: boolean;
  saving?: boolean;
  onSaveProject: () => void;
  onLogout: () => void;
}

export const RibbonHeader: React.FC<RibbonHeaderProps> = ({
  schoolName,
  displayMode,
  setDisplayMode,
  conflictCount,
  placedPercentage,
  isFullscreen,
  language = 'ar',
  onToggleFullscreen,
  onToggleLanguage,
  onNew,
  onOpenSavedProfiles,
  onOpenModal,
  onOpenTeacherClassAssignment,
  onAutoGenerate,
  onCheckConflicts,
  onPrintPreview,
  onResetSample,
  isSaved,
  saving = false,
  onSaveProject,
  onLogout,
}) => {
  const t = translations[language] || translations.ar;

  const openUserManagement = () => {
    window.location.assign('/admin/users');
  };

  return (
    <div className="bg-[#EBF2FA] border-b border-[#B1C3D9] shadow-sm select-none text-slate-800">
      <div className="bg-gradient-to-r from-[#20518D] via-[#2B68B1] to-[#20518D] text-white px-4 py-1.5 flex justify-between items-center text-xs">
        <div className="flex items-center gap-3 font-semibold">
          <div className="bg-white/20 p-1 rounded backdrop-blur-xs flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-300" />
            <span className="font-bold tracking-wide">TimeTables</span>
          </div>
          <span className="text-white/70">|</span>
          <span className="text-amber-200 font-bold">{schoolName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openUserManagement}
            className="flex items-center gap-1.5 rounded border border-amber-300/80 bg-[#123E70] px-3 py-1 font-extrabold text-[11px] text-amber-100 shadow-sm transition hover:bg-[#0F315A]"
            title="إدارة المستخدمين"
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>{language === 'ar' ? 'إدارة المستخدمين' : 'Gestion utilisateurs'}</span>
          </button>

          <button
            type="button"
            onClick={onSaveProject}
            disabled={saving}
            className={`flex items-center gap-1.5 rounded px-3 py-1 font-extrabold text-[11px] shadow-sm transition ${
              saving
                ? 'bg-emerald-300/60 text-white cursor-wait'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer'
            }`}
            title="حفظ المشروع"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-pulse' : ''}`} />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ'}</span>
          </button>

          <div
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-extrabold text-[11px] ${
              isSaved ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'
            }`}
            title={isSaved ? 'تم حفظ المشروع' : 'توجد تغييرات غير محفوظة'}
          >
            <span className="h-2 w-2 rounded-full bg-white" />
            <span>{isSaved ? 'محفوظ' : 'غير محفوظ'}</span>
          </div>

          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 bg-amber-400 hover:bg-amber-500 text-slate-900 px-2.5 py-1 rounded font-extrabold cursor-pointer transition text-[11px] shadow-2xs"
              title={language === 'ar' ? 'Passer au Français' : 'التحويل للعربية'}
            >
              <span>🌐</span>
              <span>{language === 'ar' ? 'العربية (AR)' : 'Français (FR)'}</span>
            </button>
          )}

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded font-bold cursor-pointer transition"
              title={isFullscreen ? t.exitFullscreen : t.fullscreen}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-amber-300" /> : <Maximize className="w-3.5 h-3.5 text-amber-300" />}
              <span>{isFullscreen ? t.exitFullscreen : t.fullscreen}</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-black/20 px-2.5 py-1 rounded">
            <span>{language === 'ar' ? 'نسبة الإنجاز:' : 'Progression:'}</span>
            <div className="w-20 bg-slate-700 rounded-full h-2 overflow-hidden border border-white/20">
              <div
                className={`h-full transition-all duration-300 ${placedPercentage === 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${placedPercentage}%` }}
              />
            </div>
            <span className="font-bold">{placedPercentage}%</span>
          </div>

          <button
            onClick={onCheckConflicts}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
              conflictCount > 0
                ? 'bg-red-600 text-white animate-pulse shadow-sm hover:bg-red-700'
                : 'bg-emerald-600/80 text-white hover:bg-emerald-600'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? `التعارضات: ${conflictCount}` : `Conflits: ${conflictCount}`}</span>
          </button>
        </div>
      </div>

      <div className="px-2 py-1 flex items-center justify-between gap-2 bg-[#EBF2FA] border-b border-[#C8D6E5] overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-[#C1D2E7] shadow-2xs">
            <button onClick={onNew} title={t.newSchedule} className="flex flex-col items-center justify-center p-1 min-w-[42px] rounded hover:bg-[#D9E6F5] text-slate-700 transition cursor-pointer">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] mt-0.5 font-medium">{t.newSchedule}</span>
            </button>
            <button onClick={onOpenSavedProfiles} title={t.savedProfiles} className="flex flex-col items-center justify-center p-1 min-w-[68px] rounded hover:bg-amber-100 text-slate-800 bg-amber-50 border border-amber-200 transition cursor-pointer">
              <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-[10px] mt-0.5 font-bold text-amber-950">{t.savedProfiles}</span>
            </button>
            <button onClick={onLogout} title="تسجيل الخروج" className="flex flex-col items-center justify-center p-1 min-w-[60px] rounded hover:bg-red-100 text-slate-700 transition cursor-pointer bg-red-50">
              <LogOut className="w-3.5 h-3.5 text-red-700" />
              <span className="text-[10px] mt-0.5 font-bold text-red-900">تسجيل الخروج</span>
            </button>
          </div>

          <div className="h-7 w-[1px] bg-[#C1D2E7] shrink-0" />

          <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-[#C1D2E7] shadow-2xs">
            <button onClick={() => onOpenModal('subjects')} className="flex flex-col items-center justify-center p-1 min-w-[48px] rounded hover:bg-[#D9E6F5] text-slate-700 transition cursor-pointer">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] mt-0.5 font-medium">{t.subjects}</span>
            </button>
            <button onClick={() => onOpenModal('teachers')} className="flex flex-col items-center justify-center p-1 min-w-[48px] rounded hover:bg-[#D9E6F5] text-slate-700 transition cursor-pointer">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[10px] mt-0.5 font-medium">{t.teachers}</span>
            </button>
            <button type="button" onClick={onOpenTeacherClassAssignment} className="flex flex-col items-center justify-center p-1 min-w-[72px] rounded hover:bg-amber-100 text-slate-700 transition bg-amber-50/70 border border-amber-200 cursor-pointer" title={language === 'ar' ? 'إسناد الأقسام للأساتذة' : 'Affecter les classes aux enseignants'}>
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-[10px] mt-0.5 font-bold text-amber-950">{language === 'ar' ? 'إسناد الأقسام' : 'Affecter classes'}</span>
            </button>
            <button onClick={() => onOpenModal('teacher_class_matrix')} className="flex flex-col items-center justify-center p-1 min-w-[65px] rounded hover:bg-emerald-100 text-slate-700 transition bg-emerald-50/70 border border-emerald-200 cursor-pointer" title={t.teacherMatrix}>
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[10px] mt-0.5 font-bold text-emerald-950">{t.teacherMatrix}</span>
            </button>
            <button onClick={() => onOpenModal('classes')} className="flex flex-col items-center justify-center p-1 min-w-[48px] rounded hover:bg-[#D9E6F5] text-slate-700 transition cursor-pointer">
              <School className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-[10px] mt-0.5 font-medium">{t.classes}</span>
            </button>
            <button onClick={() => onOpenModal('class_subject_matrix')} className="flex flex-col items-center justify-center p-1 min-w-[65px] rounded hover:bg-blue-100 text-slate-700 transition bg-blue-50/70 border border-blue-200 cursor-pointer" title={t.classMatrix}>
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span className="text-[10px] mt-0.5 font-bold text-blue-950">{t.classMatrix}</span>
            </button>
            <button onClick={() => onOpenModal('rooms')} className="flex flex-col items-center justify-center p-1 min-w-[48px] rounded hover:bg-[#D9E6F5] text-slate-700 transition cursor-pointer">
              <DoorOpen className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-[10px] mt-0.5 font-medium">{t.rooms}</span>
            </button>
            <button onClick={() => onOpenModal('lessons')} title="إضافة حصة" className="flex flex-col items-center justify-center p-1 min-w-[58px] rounded hover:bg-emerald-100 text-slate-700 transition cursor-pointer bg-emerald-50/70 border border-emerald-200">
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[10px] mt-0.5 font-bold text-emerald-950">إضافة حصة</span>
            </button>
          </div>

          <div className="h-7 w-[1px] bg-[#C1D2E7] shrink-0" />

          <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-[#C1D2E7] shadow-2xs">
            <button onClick={onAutoGenerate} className="flex flex-col items-center justify-center p-1 min-w-[62px] rounded bg-gradient-to-b from-[#2B68B1] to-[#1D4A82] text-white shadow-xs hover:brightness-110 transition cursor-pointer">
              <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span className="text-[10px] mt-0.5 font-bold">{t.autoGenerate}</span>
            </button>
            <button onClick={() => onOpenModal('ai')} className="flex flex-col items-center justify-center p-1 min-w-[62px] rounded bg-gradient-to-b from-purple-600 to-indigo-700 text-white shadow-xs hover:brightness-110 transition cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-[10px] mt-0.5 font-bold">{language === 'ar' ? 'مساعد AI' : 'Assistant IA'}</span>
            </button>
          </div>

          <div className="h-7 w-[1px] bg-[#C1D2E7] shrink-0" />

          <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-[#C1D2E7] shadow-2xs">
            <button onClick={onPrintPreview} className="flex flex-col items-center justify-center p-1 min-w-[48px] rounded hover:bg-[#D9E6F5] text-slate-700 transition cursor-pointer">
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-[10px] mt-0.5 font-medium">{t.print}</span>
            </button>
            <button onClick={onResetSample} className="flex flex-col items-center justify-center p-1 min-w-[52px] rounded hover:bg-[#D9E6F5] text-slate-700 transition cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[10px] mt-0.5 font-medium">{language === 'ar' ? 'النموذج' : 'Exemple'}</span>
            </button>
            <button onClick={() => onOpenModal('new_schedule')} title="الإعدادات" className="flex flex-col items-center justify-center p-1 min-w-[52px] rounded hover:bg-violet-100 text-slate-700 transition cursor-pointer bg-violet-50/70 border border-violet-200">
              <Settings className="w-3.5 h-3.5 text-violet-700" />
              <span className="text-[10px] mt-0.5 font-bold text-violet-950">الإعدادات</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-[#C1D2E7] shrink-0">
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-medium text-slate-600">{language === 'ar' ? 'طريقة العرض:' : 'Mode d\'affichage:'}</span>
          <select value={displayMode} onChange={(e) => setDisplayMode(e.target.value as DisplayMode)} className="text-[11px] font-bold bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
            <option value="matrix_classes">{t.viewByClass}</option>
            <option value="matrix_teachers">{t.viewByTeacher}</option>
            <option value="matrix_rooms">{t.viewByRoom}</option>
            <option value="single_class">{language === 'ar' ? 'جدول فصل واحد' : 'Classe Individuelle'}</option>
            <option value="single_teacher">{language === 'ar' ? 'جدول أستاذ واحد' : 'Enseignant Individuel'}</option>
            <option value="single_room">{language === 'ar' ? 'جدول قاعة واحدة' : 'Salle Individuelle'}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
