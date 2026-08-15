import React, { useState } from 'react';
import { TimetableConfig, TimePeriod } from '../types';
import { getCurrentAcademicYear } from '../data/initiaData';
import { X, Sparkles, School, Calendar, Clock, ArrowUp, ArrowDown, Plus, Trash2, Check, RotateCcw } from 'lucide-react';

interface NewScheduleModalProps {
  currentConfig: TimetableConfig;
  onClose: () => void;
  onConfirmSetup: (newConfig: TimetableConfig, mode: 'scratch' | 'keep_data') => void;
  onLoadSampleData: () => void;
}

const ALL_WEEK_DAYS = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const FRENCH_WEEK_DAYS: Record<string, string> = {
  'الاثنين': 'Lundi',
  'الثلاثاء': 'Mardi',
  'الأربعاء': 'Mercredi',
  'الخميس': 'Jeudi',
  'الجمعة': 'Vendredi',
  'السبت': 'Samedi',
  'الأحد': 'Dimanche',
};

export const NewScheduleModal: React.FC<NewScheduleModalProps> = ({
  currentConfig,
  onClose,
  onConfirmSetup,
  onLoadSampleData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'days' | 'periods' | 'afternoon'>('general');

  // Form State
  const [schoolName, setSchoolName] = useState(
    currentConfig.schoolName || (currentConfig.language === 'fr' ? "Nouvel établissement scolaire" : 'المؤسسة التعليمية الجديدة')
  );
  const [academicYear, setAcademicYear] = useState(currentConfig.academicYear || getCurrentAcademicYear());
  const [schoolLogo, setSchoolLogo] = useState<string>(currentConfig.schoolLogo || '');
  const [ministryLogo, setMinistryLogo] = useState<string>(currentConfig.ministryLogo || '');
  const [ministryName, setMinistryName] = useState<string>(
    currentConfig.ministryName ||
      (currentConfig.language === 'fr'
        ? "Royaume du Maroc - Ministère de l'Éducation nationale, du Préscolaire et des Sports"
        : 'المملكة المغربية - وزارة التربية الوطنية والتعليم الأولي والرياضة')
  );
  const [language, setLanguage] = useState<'ar' | 'fr'>(currentConfig.language || 'ar');
  const isFrench = language === 'fr';
  const t = (ar: string, fr: string) => (isFrench ? fr : ar);
  const displayDay = (day: string) => (isFrench ? FRENCH_WEEK_DAYS[day] || day : day);

  const AR_MINISTRY = 'المملكة المغربية - وزارة التربية الوطنية والتعليم الأولي والرياضة';
  const FR_MINISTRY = "Royaume du Maroc - Ministère de l'Éducation nationale, du Préscolaire et des Sports";

  const handleLanguageChange = (nextLanguage: 'ar' | 'fr') => {
    setLanguage(nextLanguage);
    const defaultMinistry = ministryName === AR_MINISTRY || ministryName === FR_MINISTRY || !ministryName.trim();
    if (defaultMinistry) setMinistryName(nextLanguage === 'fr' ? FR_MINISTRY : AR_MINISTRY);

    setPeriodsList((prev) =>
      prev.map((period, index) => {
        const arabicDefault = `الحصة ${index + 1}`;
        const frenchDefault = `Séance ${index + 1}`;
        if (period.label === arabicDefault || period.label === frenchDefault) {
          return { ...period, label: nextLanguage === 'fr' ? frenchDefault : arabicDefault };
        }
        return period;
      })
    );
  };

  /**
   * Convert an uploaded logo to a self-contained data URL.
   *
   * Keeping uploaded images inside the project config makes them survive
   * project reloads and avoids broken external image URLs during printing.
   * We resize very large files so the project JSON does not become needlessly
   * huge, while preserving transparency for PNG/WebP logos.
   */
  const readLogoFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const source = String(reader.result || '');

        const image = new Image();
        image.onload = () => {
          const maxSize = 1024;
          const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
          const width = Math.max(1, Math.round(image.naturalWidth * scale));
          const height = Math.max(1, Math.round(image.naturalHeight * scale));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext('2d');
          if (!context) {
            resolve(source);
            return;
          }

          context.clearRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);

          // PNG keeps transparent ministry/school logos intact.
          resolve(canvas.toDataURL('image/png'));
        };

        image.onerror = () => resolve(source);
        image.src = source;
      };

      reader.onerror = () => reject(reader.error || new Error('Unable to read logo file'));
      reader.readAsDataURL(file);
    });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSchoolLogo(await readLogoFile(file));
    } catch (error) {
      console.error('Failed to load school logo:', error);
    } finally {
      e.target.value = '';
    }
  };

  const handleMinistryLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setMinistryLogo(await readLogoFile(file));
    } catch (error) {
      console.error('Failed to load ministry logo:', error);
    } finally {
      e.target.value = '';
    }
  };

  const normalizeLogo = (value: string) => value.trim();

  
  // Days State
  const [selectedDays, setSelectedDays] = useState<string[]>(
    currentConfig.days.length > 0 ? currentConfig.days : ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
  );
  const [newDayInput, setNewDayInput] = useState('');

  // Periods State
  const [periodsCount, setPeriodsCount] = useState<number>(
    currentConfig.periods.length > 0 ? currentConfig.periods.length : 8
  );
  const [periodsList, setPeriodsList] = useState<TimePeriod[]>(() => {
    if (currentConfig.periods.length > 0) return currentConfig.periods;
    return generateDefaultPeriods(8);
  });

  // Disabled Slots State
  const [disabledSlots, setDisabledSlots] = useState<{ dayIndex: number; periodIndex: number }[]>(
    currentConfig.disabledSlots || []
  );

  // Helper to identify afternoon periods vs morning periods
  const isAfternoonPeriod = (pIdx: number): boolean => {
    const p = periodsList[pIdx];
    if (p && p.startTime) {
      const hour = parseInt(p.startTime.split(':')[0], 10);
      if (!isNaN(hour)) {
        return hour >= 13;
      }
    }
    if (periodsCount >= 7) {
      return pIdx >= 4;
    }
    return pIdx >= Math.ceil(periodsCount / 2);
  };

  // Helper to check if slot is disabled
  const isSlotDisabled = (dayIdx: number, periodIdx: number) => {
    return disabledSlots.some((s) => s.dayIndex === dayIdx && s.periodIndex === periodIdx);
  };

  // Toggle single slot
  const toggleSlotDisabled = (dayIdx: number, periodIdx: number) => {
    if (isSlotDisabled(dayIdx, periodIdx)) {
      setDisabledSlots((prev) => prev.filter((s) => !(s.dayIndex === dayIdx && s.periodIndex === periodIdx)));
    } else {
      setDisabledSlots((prev) => [...prev, { dayIndex: dayIdx, periodIndex: periodIdx }]);
    }
  };

  // Set day mode helper (all active, morning only, afternoon only, off)
  const setDaySlotMode = (dayIdx: number, mode: 'all' | 'morning' | 'afternoon' | 'off') => {
    // First remove existing disabled slots for this day
    let next = disabledSlots.filter((s) => s.dayIndex !== dayIdx);

    if (mode === 'morning') {
      // disable afternoon periods (isAfternoonPeriod is true)
      for (let p = 0; p < periodsCount; p++) {
        if (isAfternoonPeriod(p)) {
          next.push({ dayIndex: dayIdx, periodIndex: p });
        }
      }
    } else if (mode === 'afternoon') {
      // disable morning periods (isAfternoonPeriod is false)
      for (let p = 0; p < periodsCount; p++) {
        if (!isAfternoonPeriod(p)) {
          next.push({ dayIndex: dayIdx, periodIndex: p });
        }
      }
    } else if (mode === 'off') {
      // disable all periods
      for (let p = 0; p < periodsCount; p++) {
        next.push({ dayIndex: dayIdx, periodIndex: p });
      }
    }
    setDisabledSlots(next);
  };

  // Quick preset actions for afternoon off
  const applyAfternoonPreset = (preset: 'wed' | 'fri' | 'wed_fri' | 'sat' | 'clear') => {
    if (preset === 'clear') {
      setDisabledSlots([]);
      return;
    }
    const wedIdx = selectedDays.indexOf('الأربعاء');
    const friIdx = selectedDays.indexOf('الجمعة');
    const satIdx = selectedDays.indexOf('السبت');

    let next = [...disabledSlots];

    const disableAfternoonForDay = (dayIdx: number) => {
      if (dayIdx === -1) return;
      // remove existing for day
      next = next.filter((s) => s.dayIndex !== dayIdx);
      for (let p = 0; p < periodsCount; p++) {
        if (isAfternoonPeriod(p)) {
          next.push({ dayIndex: dayIdx, periodIndex: p });
        }
      }
    };

    if (preset === 'wed') disableAfternoonForDay(wedIdx);
    if (preset === 'fri') disableAfternoonForDay(friIdx);
    if (preset === 'wed_fri') {
      disableAfternoonForDay(wedIdx);
      disableAfternoonForDay(friIdx);
    }
    if (preset === 'sat') disableAfternoonForDay(satIdx);

    setDisabledSlots(next);
  };

  // Helper to generate default time slots
  function generateDefaultPeriods(count: number): TimePeriod[] {
    const times: { start: string; end: string }[] = [
      { start: '08:30', end: '09:30' },
      { start: '09:30', end: '10:30' },
      { start: '10:30', end: '11:30' },
      { start: '11:30', end: '12:30' },
      { start: '14:30', end: '15:30' },
      { start: '15:30', end: '16:30' },
      { start: '16:30', end: '17:30' },
      { start: '17:30', end: '18:30' },
      { start: '18:30', end: '19:30' },
      { start: '19:30', end: '20:30' },
    ];

    return Array.from({ length: count }, (_, i) => ({
      periodIndex: i,
      label: isFrench ? `Séance ${i + 1}` : `الحصة ${i + 1}`,
      startTime: times[i]?.start || `0${8 + i}:00`,
      endTime: times[i]?.end || `0${9 + i}:00`,
      isBreak: false,
    }));
  }

  // Handle Periods Count change
  const handlePeriodsCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(12, newCount));
    setPeriodsCount(count);
    if (count > periodsList.length) {
      const added = generateDefaultPeriods(count);
      setPeriodsList(added);
    } else {
      setPeriodsList((prev) => prev.slice(0, count));
    }
  };

  // Day Reordering & Toggles
  const handleMoveDay = (index: number, direction: 'up' | 'down') => {
    const newDays = [...selectedDays];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx >= 0 && targetIdx < newDays.length) {
      const temp = newDays[index];
      newDays[index] = newDays[targetIdx];
      newDays[targetIdx] = temp;

      // Keep disabled slots attached to the same day when the day order changes.
      setDisabledSlots((prev) =>
        prev.map((slot) => {
          if (slot.dayIndex === index) {
            return { ...slot, dayIndex: targetIdx };
          }

          if (slot.dayIndex === targetIdx) {
            return { ...slot, dayIndex: index };
          }

          return slot;
        })
      );

      setSelectedDays(newDays);
    }
  };

  const handleToggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length <= 1) return; // Must keep at least 1 day

      const removedIndex = selectedDays.indexOf(day);

      // Remove constraints belonging to the removed day, then shift the
      // remaining day indexes so they continue to point at the same days.
      setDisabledSlots((prev) =>
        prev
          .filter((slot) => slot.dayIndex !== removedIndex)
          .map((slot) =>
            slot.dayIndex > removedIndex
              ? { ...slot, dayIndex: slot.dayIndex - 1 }
              : slot
          )
      );

      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddCustomDay = () => {
    if (newDayInput.trim() && !selectedDays.includes(newDayInput.trim())) {
      setSelectedDays([...selectedDays, newDayInput.trim()]);
      setNewDayInput('');
    }
  };

  // Presets
  const applyPresetDays = (preset: 'mon_fri' | 'mon_sat' | 'sun_thu') => {
    if (preset === 'mon_fri') setSelectedDays(['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']);
    if (preset === 'mon_sat') setSelectedDays(['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']);
    if (preset === 'sun_thu') setSelectedDays(['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']);
  };

  // Build final config
  const getPreparedConfig = (): TimetableConfig => {
    return {
      schoolName,
      academicYear,
      schoolLogo: normalizeLogo(schoolLogo),
      ministryLogo: normalizeLogo(ministryLogo),
      ministryName,
      language,
      days: selectedDays,
      periods: periodsList.map((p, idx) => ({ ...p, periodIndex: idx })),
      disabledSlots,
    };
  };

  return (
    <div dir={isFrench ? 'ltr' : 'rtl'} lang={isFrench ? 'fr' : 'ar'} className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <School className="w-5 h-5 text-amber-300" />
            <span>{t('معالج إنشاء وتجميع الجدول الدراسي (إعدادات المؤسسة، الأيام، والتوقيت)', `Assistant de création et de configuration de l'emploi du temps (établissement, jours et horaires)`)}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 border-b border-slate-200 shrink-0 text-xs font-bold text-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-blue-700 text-blue-800 bg-white'
                : 'border-transparent hover:bg-slate-200/60'
            }`}
          >
            <School className="w-4 h-4 text-blue-600" />
            <span>{t('1. المؤسسة', '1. Établissement')}</span>
          </button>
          <button
            onClick={() => setActiveTab('days')}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'days'
                ? 'border-blue-700 text-blue-800 bg-white'
                : 'border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{t(`2. أيام الدراسة (${selectedDays.length})`, `2. Jours d'étude (${selectedDays.length})`)}</span>
          </button>
          <button
            onClick={() => setActiveTab('periods')}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'periods'
                ? 'border-blue-700 text-blue-800 bg-white'
                : 'border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{t(`3. الحصص والتوقيت (${periodsCount})`, `3. Heures et pondération (${periodsCount})`)}</span>
          </button>
          <button
            onClick={() => setActiveTab('afternoon')}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'afternoon'
                ? 'border-blue-700 text-blue-800 bg-white'
                : 'border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{t(`4. تقليص الزوال والعطل (${disabledSlots.length})`, `4. Récréations et pauses (${disabledSlots.length})`)}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-slate-800">
          {/* TAB 1: General Info */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-900 leading-relaxed font-medium">
                {t('قم بإدخال بيانات المؤسسة الشاملة، اللوجو الشعار، واللغة المفضلة. ستظهر هذه المعلومات في الترويسة العليا وعند طباعة صفحة A4 افقية.', "Saisissez les informations complètes de l'établissement, le logo, le slogan et la langue préférée. Ces informations apparaîtront dans l'en-tête et lors de l'impression sur une page A4 paysage.")}
              </div>

              {/* Language Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('لغة واجهة البرنامج (Language):', 'Langue de l’interface :')}</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('ar')}
                    className={`flex-1 py-2 px-3 rounded font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-2 ${
                      language === 'ar'
                        ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>العربية (RTL)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('fr')}
                    className={`flex-1 py-2 px-3 rounded font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-2 ${
                      language === 'fr'
                        ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>Français (LTR)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('الوزارة / الأكاديمية (السطر الأعلى):', 'Ministère / Académie (en-tête) :')}</label>
                <input
                  type="text"
                  value={ministryName}
                  onChange={(e) => setMinistryName(e.target.value)}
                  placeholder={t(AR_MINISTRY, FR_MINISTRY)}
                  className="w-full p-2.5 border border-slate-300 rounded font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('اسم المؤسسة التعليمية:', `Nom de l'établissement :`)}</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder={t('مثال: ثانوية الحسن الثاني', 'Ex. : Lycée Hassan II')}
                    className="w-full p-2.5 border border-slate-300 rounded font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('السنة / الموسم الدراسي:', 'Année scolaire :')}</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder={t('مثال: 2025 - 2026', 'Ex. : 2025 - 2026')}
                    className="w-full p-2.5 border border-slate-300 rounded font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('شعار / لوجو المؤسسة (يظهر وسط رأس صفحة الطباعة):', "Logo de l'établissement (apparaît dans l'en-tête à l'impression) :")}</label>
                <div className="flex items-center gap-4 bg-slate-50 p-3 border border-slate-300 rounded-lg">
                  {schoolLogo ? (
                    <div className="relative w-16 h-16 bg-white border border-slate-300 rounded p-1 flex items-center justify-center shrink-0 shadow-2xs">
                      <img src={schoolLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setSchoolLogo('')}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 cursor-pointer"
                        title={t('إزالة اللوجو', 'Supprimer le logo')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-slate-200 border border-dashed border-slate-400 rounded flex flex-col items-center justify-center text-slate-500 shrink-0">
                      <School className="w-6 h-6 text-slate-400" />
                      <span className="text-[9px] font-bold mt-0.5">{t('بدون شعار', 'Aucun logo')}</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-xs text-slate-600 cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
                    />
                    <div className="text-[10px] text-slate-500 font-medium">
                      {t('أو يمكنك إلصاق رابط مباشر لصورة الشعار:', "Ou collez une URL directe vers le logo :")}
                    </div>
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={schoolLogo.startsWith('data:') ? '' : schoolLogo}
                      onChange={(e) => setSchoolLogo(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Ministry Logo Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('شعار الوزارة (يظهر في رأس صفحة الطباعة):', "Logo du ministère (apparaît dans l’en-tête à l’impression) :")}</label>
                <div className="flex items-center gap-4 bg-slate-50 p-3 border border-slate-300 rounded-lg">
                  {ministryLogo ? (
                    <div className="relative w-16 h-16 bg-white border border-slate-300 rounded p-1 flex items-center justify-center shrink-0 shadow-2xs">
                      <img src={ministryLogo} alt="Ministry Logo" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setMinistryLogo('')}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 cursor-pointer"
                        title={t('إزالة شعار الوزارة', 'Supprimer le logo du ministère')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-slate-200 border border-dashed border-slate-400 rounded flex flex-col items-center justify-center text-slate-500 shrink-0">
                      <School className="w-6 h-6 text-slate-400" />
                      <span className="text-[9px] font-bold mt-0.5">{t('بدون شعار الوزارة', 'Aucun logo du ministère')}</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMinistryLogoUpload}
                      className="text-xs text-slate-600 cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
                    />
                    <div className="text-[10px] text-slate-500 font-medium">
                      {t('يمكنك تحميل شعار وزارة التربية الوطنية أو لصق رابط مباشر للصورة.', 'Vous pouvez charger le logo du ministère ou coller une URL directe vers l’image.')}
                    </div>
                    <input
                      type="url"
                      placeholder="https://example.com/ministry-logo.png"
                      value={ministryLogo.startsWith('data:') ? '' : ministryLogo}
                      onChange={(e) => setMinistryLogo(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('days')}
                  className="bg-blue-700 text-white font-bold px-4 py-2 rounded float-left hover:bg-blue-800 transition cursor-pointer"
                >
                  {t('المتابعة لترتيب أيام الدراسة ←', "Continuer vers les jours d'étude →")}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Days Configuration */}
          {activeTab === 'days' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900 font-medium leading-relaxed">
                {t('حدد الأيام التي تُدرس فيها الحصص في مؤسستك، ويمكنك إعادة ترتيبها (التقديم أو التأخير) باستخدام الأسهم.', "Sélectionnez les jours d'étude de votre établissement et réorganisez-les à l'aide des flèches.")}
              </div>

              {/* Presets */}
              <div>
                <span className="font-bold text-slate-700 block mb-1.5">{t('أنظمة الأيام الشائعة (جاهزة):', 'Configurations courantes des jours :')}</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetDays('mon_fri')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-bold text-[11px] cursor-pointer"
                  >
                    {t('5 أيام (الاثنين ← الجمعة)', '5 jours (Lundi → Vendredi)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDays('mon_sat')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-bold text-[11px] cursor-pointer"
                  >
                    {t('6 أيام (الاثنين ← السبت)', '6 jours (Lundi → Samedi)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDays('sun_thu')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-bold text-[11px] cursor-pointer"
                  >
                    {t('5 أيام (الأحد ← الخميس)', '5 jours (Dimanche → Jeudi)')}
                  </button>
                </div>
              </div>

              {/* Toggle List */}
              <div>
                <span className="font-bold text-slate-700 block mb-1.5">{t('تحديد الأيام المفعلة:', 'Jours actifs :')}</span>
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2.5 rounded border border-slate-200">
                  {ALL_WEEK_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`px-3 py-1.5 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{displayDay(day)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ordered Days List with Shift up/down */}
              <div>
                <span className="font-bold text-slate-700 block mb-1.5">{t('ترتيب وتسلسل الأيام في جدول الأسبوع:', "Ordre des jours dans l'emploi du temps :")}</span>
                <div className="space-y-1.5 bg-slate-100 p-2 rounded-lg border border-slate-300">
                  {selectedDays.map((day, idx) => (
                    <div
                      key={day}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 font-bold text-slate-800 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-extrabold">
                          {idx + 1}
                        </span>
                        <span>{displayDay(day)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveDay(idx, 'up')}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded disabled:opacity-30 cursor-pointer"
                          title={t('تحريك لأعلى', 'Monter')}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === selectedDays.length - 1}
                          onClick={() => handleMoveDay(idx, 'down')}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded disabled:opacity-30 cursor-pointer"
                          title={t('تحريك لأسفل', 'Descendre')}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className="bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded hover:bg-slate-300 transition cursor-pointer"
                >
                  {t('← السابق', '← Précédent')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('periods')}
                  className="bg-blue-700 text-white font-bold px-4 py-2 rounded hover:bg-blue-800 transition cursor-pointer"
                >
                  {t('المتابعة لضبط أوقات الحصص ←', 'Continuer vers les horaires →')}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Periods & Timings */}
          {activeTab === 'periods' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 font-medium leading-relaxed">
                {t('حدد عدد الحصص في اليوم الواحد والتوقيت الزمني لكل حصة لتناسب النظام المدرسي الخاص بك.', "Définissez le nombre de séances quotidiennes et les horaires adaptés à votre système scolaire.")}
              </div>

              {/* Number of periods */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
                <label className="font-bold text-slate-800 text-xs">
                  {t('عدد الحصص اليومية المطلوب في الجدول:', "Nombre de séances quotidiennes :")}
                </label>
                <div className="flex items-center gap-2">
                  {[4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePeriodsCountChange(num)}
                      className={`w-8 h-8 rounded font-extrabold text-xs transition cursor-pointer ${
                        periodsCount === num
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Periods List Editor */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 font-bold text-[11px] border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 w-12">#</th>
                      <th className="p-2 border-r border-slate-300">{t('مسمى الحصة', 'Intitulé')}</th>
                      <th className="p-2 border-r border-slate-300">{t('توقيت البداية', 'Début')}</th>
                      <th className="p-2">{t('توقيت النهاية', 'Fin')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodsList.map((period, idx) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-1.5 font-bold text-slate-700 bg-slate-100 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="p-1.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={period.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPeriodsList((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, label: val } : p))
                              );
                            }}
                            className="w-full text-center p-1 border border-slate-300 rounded font-bold text-slate-800 text-xs"
                          />
                        </td>
                        <td className="p-1.5 border-r border-slate-200">
                          <input
                            type="time"
                            value={period.startTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPeriodsList((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, startTime: val } : p))
                              );
                            }}
                            className="w-full text-center p-1 border border-slate-300 rounded font-bold text-slate-800 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="time"
                            value={period.endTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPeriodsList((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, endTime: val } : p))
                              );
                            }}
                            className="w-full text-center p-1 border border-slate-300 rounded font-bold text-slate-800 text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('days')}
                  className="bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded hover:bg-slate-300 transition cursor-pointer"
                >
                  {t('← السابق', '← Précédent')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('afternoon')}
                  className="bg-blue-700 text-white font-bold px-4 py-2 rounded hover:bg-blue-800 transition cursor-pointer"
                >
                  {t('المتابعة لضبط أوقات الزوال/العطل ←', 'Continuer vers les pauses / demi-journées →')}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Afternoon & Special Day Slot Controls */}
          {activeTab === 'afternoon' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-purple-900 font-medium leading-relaxed">
                {t('هناك بعض المؤسسات التعليمية لا تشتغل زوال يوم الأربعاء، أو زوال يوم الجمعة، أو زوال السبت. يمكنك هنا تحديد الحصص المفعلة والملغاة لكل يوم لمنع إسناد دروس فيها وتقليص حجم جدول الزمن.', "Certains établissements ne travaillent pas le mercredi, le vendredi ou le samedi après-midi. Définissez ici les créneaux actifs ou désactivés afin d'éviter d'y placer des cours.")}
              </div>

              {/* Quick Presets */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">{t('إعدادات سريعة لتأطير أوقات الزوال والعطل:', 'Réglages rapides des après-midis et jours non travaillés :')}</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyAfternoonPreset('wed')}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 font-bold px-3 py-1.5 rounded text-[11px] cursor-pointer"
                  >
                    {t('إلغاء زوال الأربعاء (مساءً)', 'Désactiver le mercredi après-midi')}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAfternoonPreset('fri')}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 font-bold px-3 py-1.5 rounded text-[11px] cursor-pointer"
                  >
                    {t('إلغاء زوال الجمعة (مساءً)', 'Désactiver le vendredi après-midi')}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAfternoonPreset('wed_fri')}
                    className="bg-purple-700 hover:bg-purple-800 text-white border border-purple-800 font-bold px-3 py-1.5 rounded text-[11px] cursor-pointer"
                  >
                    {t('إلغاء زوال الأربعاء والجمعة معاً', 'Désactiver mercredi et vendredi après-midi')}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAfternoonPreset('sat')}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 font-bold px-3 py-1.5 rounded text-[11px] cursor-pointer"
                  >
                    {t('إلغاء زوال السبت', 'Désactiver le samedi après-midi')}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAfternoonPreset('clear')}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 font-bold px-3 py-1.5 rounded text-[11px] cursor-pointer"
                  >
                    {t('تفعيل جميع الحصص (إلغاء التقييد)', 'Activer tous les créneaux (supprimer les restrictions)')}
                  </button>
                </div>
              </div>

              {/* Day-by-day interactive slot table */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">{t('تخصيص الحصص بالتفصيل لكل يوم:', 'Personnaliser les créneaux pour chaque jour :')}</span>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {selectedDays.map((dayName, dayIdx) => {
                    const isMorningOnly = periodsList.every((_, pIdx) =>
                      !isAfternoonPeriod(pIdx) ? !isSlotDisabled(dayIdx, pIdx) : isSlotDisabled(dayIdx, pIdx)
                    );
                    const isDayOff = periodsList.every((_, pIdx) => isSlotDisabled(dayIdx, pIdx));
                    const isAllActive = periodsList.every((_, pIdx) => !isSlotDisabled(dayIdx, pIdx));

                    return (
                      <div
                        key={dayIdx}
                        className="bg-white p-3 rounded-lg border border-slate-300 shadow-2xs space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-black text-[10px]">
                              {dayIdx + 1}
                            </span>
                            <span>{displayDay(dayName)}</span>
                          </div>

                          {/* Quick Day Mode Buttons */}
                          <div className="flex items-center gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setDaySlotMode(dayIdx, 'all')}
                              className={`px-2 py-1 rounded font-bold cursor-pointer border ${
                                isAllActive
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {t('كامل اليوم', 'Toute la journée')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDaySlotMode(dayIdx, 'morning')}
                              className={`px-2 py-1 rounded font-bold cursor-pointer border ${
                                isMorningOnly
                                  ? 'bg-amber-600 text-white border-amber-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {t('الصباح فقط (إلغاء الزوال)', 'Matin uniquement')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDaySlotMode(dayIdx, 'off')}
                              className={`px-2 py-1 rounded font-bold cursor-pointer border ${
                                isDayOff
                                  ? 'bg-red-600 text-white border-red-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {t('عطلة بالكامل', 'Journée non travaillée')}
                            </button>
                          </div>
                        </div>

                        {/* Interactive period chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {periodsList.map((p, pIdx) => {
                            const disabled = isSlotDisabled(dayIdx, pIdx);
                            const isAfternoon = isAfternoonPeriod(pIdx);

                            return (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => toggleSlotDisabled(dayIdx, pIdx)}
                                title={disabled ? t('انقر للتفعيل', 'Cliquer pour activer') : t('انقر للإلغاء', 'Cliquer pour désactiver')}
                                className={`px-2 py-1 rounded border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                                  disabled
                                    ? 'bg-red-50 text-red-700 border-red-300 line-through opacity-80 hover:opacity-100'
                                    : isAfternoon
                                    ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                                    : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                                }`}
                              >
                                <span>{p.label}</span>
                                {disabled ? (
                                  <span className="text-[9px] font-black text-red-600">{t('(ملغاة)', '(Désactivée)')}</span>
                                ) : (
                                  <span className="text-[9px] opacity-75">{isAfternoon ? t('زوال', 'Après-midi') : t('صباح', 'Matin')}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('periods')}
                  className="bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded hover:bg-slate-300 transition cursor-pointer"
                >
                  {t('← السابق', '← Précédent')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-5 py-4 border-t border-slate-200 shrink-0 space-y-2">
          <span className="font-bold text-slate-700 block text-[11px]">{t('خيارات التثبيت والتنفيذ:', "Options d'application et d'exécution :")}</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Action 1: Create Blank Schedule */}
            <button
              onClick={() => {
                onConfirmSetup(getPreparedConfig(), 'scratch');
                onClose();
              }}
              className="bg-red-700 hover:bg-red-800 text-white font-bold p-2.5 rounded text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('البدء من الصفر (جدول فارغ)', 'Repartir de zéro (emploi du temps vide)')}</span>
            </button>

            {/* Action 2: Apply to Current Data */}
            <button
              onClick={() => {
                onConfirmSetup(getPreparedConfig(), 'keep_data');
                onClose();
              }}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold p-2.5 rounded text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t('تطبيق التوقيت للبيانات الحالية', 'Appliquer les horaires aux données actuelles')}</span>
            </button>

            {/* Action 3: Load Sample Model */}
            <button
              onClick={() => {
                onLoadSampleData();
                onClose();
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold p-2.5 rounded text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('تحميل النموذج التجريبي', "Charger le modèle d'exemple")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};