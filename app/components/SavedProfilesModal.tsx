import React, { useState } from 'react';
import { SavedScheduleProfile, TimetableConfig, Subject, Teacher, ClassGroup, Classroom, Lesson, Placement } from '../types';
import { X, FolderOpen, Plus, Copy, Trash2, CheckCircle, Clock, Calendar, Save } from 'lucide-react';
import { translations, Language } from '../utils/i18n';

interface SavedProfilesModalProps {
  savedProfiles: SavedScheduleProfile[];
  currentProfileId: string | null;
  currentConfig: TimetableConfig;
  currentSubjects: Subject[];
  currentTeachers: Teacher[];
  currentClasses: ClassGroup[];
  currentRooms: Classroom[];
  currentLessons: Lesson[];
  currentPlacements: Placement[];
  language?: Language;
  onClose: () => void;
  onLoadProfile: (profile: SavedScheduleProfile) => void;
  onSaveCurrentAsNew: (name: string) => void;
  onDuplicateProfile: (profile: SavedScheduleProfile) => void;
  onDeleteProfile: (profileId: string) => void;
}

export const SavedProfilesModal: React.FC<SavedProfilesModalProps> = ({
  savedProfiles,
  currentProfileId,
  currentConfig,
  currentSubjects,
  currentTeachers,
  currentClasses,
  currentRooms,
  currentLessons,
  currentPlacements,
  language = 'ar',
  onClose,
  onLoadProfile,
  onSaveCurrentAsNew,
  onDuplicateProfile,
  onDeleteProfile,
}) => {
  const t = translations[language] || translations.ar;
  const [newProfileName, setNewProfileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    onSaveCurrentAsNew(newProfileName.trim());
    setNewProfileName('');
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#20518D] to-[#1D4A82] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <FolderOpen className="w-5 h-5 text-amber-300" />
            <span>{t.savedProfilesTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current Section */}
        <div className="bg-blue-50/80 p-4 border-b border-blue-200 shrink-0">
          {!isSaving ? (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-blue-950 text-xs">{t.saveCurrentAsNew}</h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  حفظ الوضع الحالي لجدول الحصص والتوزيع كنسخة مستقلة يمكنك العودة إليها لاحقاً.
                </p>
              </div>
              <button
                onClick={() => setIsSaving(true)}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{t.saveProfile}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="أدخل اسماً تمييزياً للنسخة (مثال: استعمال الدورة 1 - نسخة نهائية)..."
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                autoFocus
                className="flex-1 p-2 border border-blue-300 rounded text-xs font-bold bg-white text-blue-950 focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={!newProfileName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded text-xs transition cursor-pointer shrink-0"
              >
                {t.save}
              </button>
              <button
                type="button"
                onClick={() => setIsSaving(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-2 rounded text-xs transition cursor-pointer shrink-0"
              >
                {t.cancel}
              </button>
            </form>
          )}
        </div>

        {/* List of Saved Profiles */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          <h4 className="font-bold text-xs text-slate-700 mb-2">قائمة استعمالات الزمن المسجلة المحفوظة ({savedProfiles.length}):</h4>

          {savedProfiles.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-500 font-bold text-xs">
              لا توجد استعمالات زمن محفوظة حالياً. يمكنك حفظ النسخة الحالية بالضغط على زر "حفظ النسخة الحالية".
            </div>
          ) : (
            savedProfiles.map((prof) => {
              const isCurrent = prof.id === currentProfileId;
              const totalLessons = prof.lessons.length;
              const totalPlaced = prof.placements.length;

              return (
                <div
                  key={prof.id}
                  className={`p-3.5 rounded-lg border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{prof.name}</span>
                      {isCurrent && (
                        <span className="bg-amber-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>النشط حالياً</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>آخر تحديث: {prof.updatedAt}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prof.config.schoolName} ({prof.config.academicYear})</span>
                      </span>
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10.5px] font-bold">
                        {totalPlaced} / {totalLessons} حصة مسكنة
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onLoadProfile(prof);
                          onClose();
                        }}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>{t.loadProfile}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDuplicateProfile(prof)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="استنساخ هذه النسخة"
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t.duplicateProfile}</span>
                    </button>

                    <button
                      onClick={() => onDeleteProfile(prof.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer"
                      title="حذف النسخة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-5 py-1.5 rounded text-xs transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
