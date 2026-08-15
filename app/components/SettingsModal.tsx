'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, Check, Clock, X } from 'lucide-react';
import { TimetableConfig } from '../types';

interface SettingsModalProps {
  currentConfig: TimetableConfig;
  language?: 'ar' | 'fr';
  onClose: () => void;
  onSave: (config: TimetableConfig) => void;
}

const FALLBACK_DAYS = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const FR_DAYS: Record<string, string> = {
  'الاثنين': 'Lundi',
  'الثلاثاء': 'Mardi',
  'الأربعاء': 'Mercredi',
  'الخميس': 'Jeudi',
  'الجمعة': 'Vendredi',
  'السبت': 'Samedi',
  'الأحد': 'Dimanche',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentConfig,
  language = 'ar',
  onClose,
  onSave,
}) => {
  const isFrench = language === 'fr';
  const [days, setDays] = useState<string[]>(
    currentConfig.days.length > 0 ? [...currentConfig.days] : [...FALLBACK_DAYS]
  );
  const [disabledSlots, setDisabledSlots] = useState(
    currentConfig.disabledSlots || []
  );

  const displayDay = (day: string) =>
    isFrench ? FR_DAYS[day] || day : day;

  const periods = currentConfig.periods || [];

  const isAfternoon = (periodIndex: number) => {
    const p = periods[periodIndex];
    if (p?.startTime) {
      const hour = Number.parseInt(p.startTime.split(':')[0], 10);
      if (!Number.isNaN(hour)) return hour >= 13;
    }
    return periodIndex >= Math.ceil(periods.length / 2);
  };

  const slotKey = (dayIndex: number, periodIndex: number) =>
    `${dayIndex}:${periodIndex}`;

  const disabledSet = useMemo(
    () =>
      new Set(
        disabledSlots.map((slot) => slotKey(slot.dayIndex, slot.periodIndex))
      ),
    [disabledSlots]
  );

  const isDisabled = (dayIndex: number, periodIndex: number) =>
    disabledSet.has(slotKey(dayIndex, periodIndex));

  const setDayMode = (
    dayIndex: number,
    mode: 'all' | 'morning' | 'afternoon' | 'off'
  ) => {
    setDisabledSlots((prev) => {
      const next = prev.filter((slot) => slot.dayIndex !== dayIndex);

      for (let periodIndex = 0; periodIndex < periods.length; periodIndex += 1) {
        const afternoon = isAfternoon(periodIndex);
        const shouldDisable =
          mode === 'off' ||
          (mode === 'morning' && afternoon) ||
          (mode === 'afternoon' && !afternoon);

        if (shouldDisable) {
          next.push({ dayIndex, periodIndex });
        }
      }

      return next;
    });
  };

  const toggleDay = (dayIndex: number) => {
    if (days.length <= 1) return;

    const removedDay = days[dayIndex];
    const nextDays = days.filter((_, index) => index !== dayIndex);

    setDisabledSlots((prev) =>
      prev
        .filter((slot) => slot.dayIndex !== dayIndex)
        .map((slot) => ({
          ...slot,
          dayIndex: slot.dayIndex > dayIndex ? slot.dayIndex - 1 : slot.dayIndex,
        }))
    );

    setDays(nextDays);
    void removedDay;
  };

  const toggleSlot = (dayIndex: number, periodIndex: number) => {
    setDisabledSlots((prev) => {
      const exists = prev.some(
        (slot) => slot.dayIndex === dayIndex && slot.periodIndex === periodIndex
      );

      return exists
        ? prev.filter(
            (slot) =>
              !(slot.dayIndex === dayIndex && slot.periodIndex === periodIndex)
          )
        : [...prev, { dayIndex, periodIndex }];
    });
  };

  const reorderDay = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= days.length) return;

    const nextDays = [...days];
    [nextDays[index], nextDays[target]] = [nextDays[target], nextDays[index]];

    setDisabledSlots((prev) =>
      prev.map((slot) => {
        if (slot.dayIndex === index) return { ...slot, dayIndex: target };
        if (slot.dayIndex === target) return { ...slot, dayIndex: index };
        return slot;
      })
    );

    setDays(nextDays);
  };

  const handleSave = () => {
    onSave({
      ...currentConfig,
      days,
      disabledSlots,
    });
  };

  return (
    <div
      dir={isFrench ? 'ltr' : 'rtl'}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-800 to-indigo-900 px-5 py-3 text-white">
          <div className="flex items-center gap-2 font-bold">
            <Calendar className="h-5 w-5 text-amber-300" />
            <span>{isFrench ? 'Paramètres de l’emploi du temps' : 'إعدادات استعمال الزمن'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-semibold leading-6 text-blue-900">
            {isFrench
              ? 'Définissez les jours travaillés et, pour chaque jour, les créneaux réellement disponibles. Ces restrictions seront utilisées par le planning.'
              : 'حدد أيام العمل، ثم حدد لكل يوم الفترات التي يمكن استعمالها فعلياً. هذه القيود ستطبق على الجدول.'}
          </div>

          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center gap-2 font-black text-slate-800">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {isFrench ? 'Jours de travail' : 'أيام العمل'}
              </div>

              <div className="space-y-2">
                {days.map((day, index) => {
                  const dayDisabledCount = disabledSlots.filter(
                    (slot) => slot.dayIndex === index
                  ).length;
                  const allOff = periods.length > 0 && dayDisabledCount >= periods.length;

                  return (
                    <div
                      key={`${day}-${index}`}
                      className="rounded-xl border border-slate-200 bg-white p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2 font-bold text-slate-800">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] text-blue-800">
                            {index + 1}
                          </span>
                          <span className="truncate">{displayDay(day)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => reorderDay(index, -1)}
                            disabled={index === 0}
                            className="rounded px-1.5 py-1 text-xs text-slate-500 hover:bg-blue-50 disabled:opacity-30"
                            title={isFrench ? 'Monter' : 'تحريك لأعلى'}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => reorderDay(index, 1)}
                            disabled={index === days.length - 1}
                            className="rounded px-1.5 py-1 text-xs text-slate-500 hover:bg-blue-50 disabled:opacity-30"
                            title={isFrench ? 'Descendre' : 'تحريك لأسفل'}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleDay(index)}
                            className="rounded px-1.5 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50"
                          >
                            {isFrench ? 'Retirer' : 'إزالة'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setDayMode(index, 'all')}
                          className="rounded-lg bg-emerald-50 px-2 py-1.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          {isFrench ? 'Toute la journée' : 'كامل اليوم'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDayMode(index, 'morning')}
                          className="rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100"
                        >
                          {isFrench ? 'Matin' : 'الصباح فقط'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDayMode(index, 'afternoon')}
                          className="rounded-lg bg-violet-50 px-2 py-1.5 text-[10px] font-bold text-violet-800 hover:bg-violet-100"
                        >
                          {isFrench ? 'Après-midi' : 'الزوال فقط'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDayMode(index, 'off')}
                          className={`rounded-lg px-2 py-1.5 text-[10px] font-bold ${
                            allOff
                              ? 'bg-red-600 text-white'
                              : 'bg-red-50 text-red-800 hover:bg-red-100'
                          }`}
                        >
                          {isFrench ? 'Fermé' : 'عطلة'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-3 flex items-center gap-2 font-black text-slate-800">
                <Clock className="h-4 w-4 text-blue-600" />
                {isFrench ? 'Créneaux par jour' : 'الفترات حسب اليوم'}
              </div>

              {days.map((day, dayIndex) => (
                <div key={`${day}-slots-${dayIndex}`} className="mb-4 last:mb-0">
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="font-bold text-slate-800">{displayDay(day)}</span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {isFrench ? 'Cliquez pour activer/désactiver' : 'انقر لتفعيل أو تعطيل الحصة'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {periods.length === 0 ? (
                      <div className="text-xs text-slate-500">
                        {isFrench ? 'Aucun créneau défini.' : 'لم يتم تعريف الحصص الزمنية بعد.'}
                      </div>
                    ) : (
                      periods.map((period, periodIndex) => {
                        const disabled = isDisabled(dayIndex, periodIndex);
                        const afternoon = isAfternoon(periodIndex);
                        return (
                          <button
                            type="button"
                            key={`${dayIndex}-${periodIndex}`}
                            onClick={() => toggleSlot(dayIndex, periodIndex)}
                            className={`rounded-lg border px-2.5 py-2 text-[10px] font-bold transition ${
                              disabled
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : afternoon
                                  ? 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100'
                                  : 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                            }`}
                          >
                            <span className="block">{period.label}</span>
                            <span className="mt-0.5 block text-[9px] opacity-75">
                              {period.startTime} - {period.endTime}
                            </span>
                            <span className="mt-0.5 block text-[9px]">
                              {disabled
                                ? isFrench ? 'Désactivée' : 'ملغاة'
                                : isFrench ? 'Active' : 'مفعلة'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
          >
            {isFrench ? 'Annuler' : 'إلغاء'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-extrabold text-white shadow hover:bg-blue-800"
          >
            <Check className="h-4 w-4" />
            {isFrench ? 'Enregistrer les paramètres' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
};