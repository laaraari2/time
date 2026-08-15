import React, { useEffect, useState } from 'react';
import {
  Subject, Teacher, ClassGroup, Classroom, Lesson,
  Placement, TimetableConfig, Conflict, DisplayMode
} from '../types';
import { getPlacementDetails, isSlotDisabled } from '../utils/timetableGenerator';
import { translations, Language } from '../utils/i18n';
import { Trash2, AlertCircle, Sparkles, Search, Filter, EyeOff, Eye } from 'lucide-react';

interface TimetableMatrixViewProps {
  config: TimetableConfig;
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassGroup[];
  rooms: Classroom[];
  lessons: Lesson[];
  placements: Placement[];
  conflicts: Conflict[];
  displayMode: DisplayMode;
  selectedLessonForPlacement: Lesson | null;
  onPlaceLesson: (lessonId: string, dayIdx: number, periodIdx: number, roomId?: string) => void;
  onRemovePlacement: (placementId: string) => void;
  onMovePlacement: (placementId: string, newDayIdx: number, newPeriodIdx: number) => void;
  onSelectCellToEdit?: (placement: Placement) => void;
}

export const TimetableMatrixView: React.FC<TimetableMatrixViewProps> = ({
  config,
  subjects,
  teachers,
  classes,
  rooms,
  lessons,
  placements,
  conflicts,
  displayMode,
  selectedLessonForPlacement,
  onPlaceLesson,
  onRemovePlacement,
  onMovePlacement,
  onSelectCellToEdit,
}) => {
  const lang: Language = config.language || 'ar';
  const t = translations[lang] || translations.ar;

  const [draggedPlacementId, setDraggedPlacementId] = useState<string | null>(null);
  const [draggedClassGroupId, setDraggedClassGroupId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  useEffect(() => {
    const handleExternalLessonDrag = (event: Event) => {
      const customEvent = event as CustomEvent<{ classGroupId?: string | null }>;
      setDraggedClassGroupId(customEvent.detail?.classGroupId ?? null);
    };

    window.addEventListener('timetable:drag-class', handleExternalLessonDrag);

    return () => {
      window.removeEventListener('timetable:drag-class', handleExternalLessonDrag);
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hideDisabledSlots, setHideDisabledSlots] = useState<boolean>(true);

  // Helper to get active period indices for a given dayIdx
  const getActivePeriodIndices = (dayIdx: number) => {
    if (!hideDisabledSlots) {
      return config.periods.map((_, i) => i);
    }
    const active = config.periods
      .map((_, i) => i)
      .filter((pIdx) => !isSlotDisabled(config, dayIdx, pIdx));
    return active;
  };

  const totalTableColumns = 1 + config.days.reduce(
    (sum, _, dIdx) => sum + Math.max(1, getActivePeriodIndices(dIdx).length),
    0
  );

  // Determine row items depending on display mode
  let rowEntities: { id: string; code: string; name: string }[] = [];
  if (displayMode === 'matrix_classes' || displayMode === 'single_class') {
    rowEntities = classes.map((c) => ({ id: c.id, code: c.code, name: c.name }));
  } else if (displayMode === 'matrix_teachers' || displayMode === 'single_teacher') {
    rowEntities = teachers.map((t) => ({ id: t.id, code: t.code, name: t.name }));
  } else if (displayMode === 'matrix_rooms' || displayMode === 'single_room') {
    rowEntities = rooms.map((r) => ({ id: r.id, code: r.code, name: r.name }));
  }

  // Set default single entity if needed
  const activeSingleEntityId = selectedEntityId || (rowEntities[0]?.id ?? '');

  // Filter for single entity view and search term
  const isSingleView = displayMode.startsWith('single_');
  let filteredRowEntities = isSingleView
    ? rowEntities.filter((e) => e.id === activeSingleEntityId)
    : rowEntities;

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filteredRowEntities = filteredRowEntities.filter(
      (e) => e.code.toLowerCase().includes(term) || e.name.toLowerCase().includes(term)
    );
  }

  // Helper to find placement for a specific row entity, day, and period
  const getCellPlacement = (entityId: string, dayIdx: number, periodIdx: number) => {
    return placements.find((p) => {
      if (p.dayIndex !== dayIdx || p.periodIndex !== periodIdx) return false;
      const lesson = lessons.find((l) => l.id === p.lessonId);
      if (!lesson) return false;

      if (displayMode === 'matrix_classes' || displayMode === 'single_class') {
        return lesson.classGroupId === entityId;
      } else if (displayMode === 'matrix_teachers' || displayMode === 'single_teacher') {
        return lesson.teacherId === entityId;
      } else if (displayMode === 'matrix_rooms' || displayMode === 'single_room') {
        return (p.roomId || lesson.preferredRoomId) === entityId;
      }
      return false;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, placementId: string) => {
    const placementLesson = placements.find((p) => p.id === placementId);
    const placementLessonData = placementLesson
      ? lessons.find((lesson) => lesson.id === placementLesson.lessonId)
      : undefined;

    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'placement', placementId })
    );
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPlacementId(placementId);

    window.dispatchEvent(
      new CustomEvent('timetable:drag-class', {
        detail: {
          classGroupId: placementLessonData?.classGroupId ?? null,
        },
      })
    );
  };

  const handleDragEnd = () => {
    setDraggedPlacementId(null);
    setDraggedClassGroupId(null);
    window.dispatchEvent(
      new CustomEvent('timetable:drag-class', {
        detail: { classGroupId: null },
      })
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dayIdx: number, periodIdx: number, rowEntityId: string) => {
    e.preventDefault();
    let payloadData: any = null;
    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (raw) {
        if (raw.startsWith('{')) {
          payloadData = JSON.parse(raw);
        } else {
          payloadData = { type: 'placement', placementId: raw };
        }
      }
    } catch (err) {
      // fallback
    }

    if (payloadData && payloadData.type === 'unplaced_lesson') {
      onPlaceLesson(payloadData.lessonId, dayIdx, periodIdx);
    } else if (payloadData && payloadData.type === 'placement') {
      onMovePlacement(payloadData.placementId, dayIdx, periodIdx);
    } else if (draggedPlacementId) {
      onMovePlacement(draggedPlacementId, dayIdx, periodIdx);
    } else if (selectedLessonForPlacement) {
      onPlaceLesson(selectedLessonForPlacement.id, dayIdx, periodIdx);
    }

    handleDragEnd();
  };

  const handleCellClick = (dayIdx: number, periodIdx: number, rowEntityId: string, existingPlacement?: Placement) => {
    if (existingPlacement) {
      if (onSelectCellToEdit) onSelectCellToEdit(existingPlacement);
    } else if (selectedLessonForPlacement) {
      // Place selected lesson
      onPlaceLesson(selectedLessonForPlacement.id, dayIdx, periodIdx);
    }
  };

  // Helper to detect double period spans across consecutive cells
  const getCellMergedInfo = (entityId: string, dayIdx: number, periodIdx: number) => {
    const currentPlacement = getCellPlacement(entityId, dayIdx, periodIdx);
    if (!currentPlacement) return { kind: 'empty' as const };

    const currentLesson = lessons.find((l) => l.id === currentPlacement.lessonId);

    // Check if this placement is the SECOND half of a double period
    if (periodIdx > 0) {
      const prevPlacement = getCellPlacement(entityId, dayIdx, periodIdx - 1);
      if (prevPlacement) {
        const isSameDoubleGroup =
          currentPlacement.doubleGroupId &&
          prevPlacement.doubleGroupId &&
          currentPlacement.doubleGroupId === prevPlacement.doubleGroupId;

        const isSameDoubleLesson =
          currentPlacement.lessonId === prevPlacement.lessonId &&
          !!currentLesson?.isDoublePeriod;

        if (isSameDoubleGroup || isSameDoubleLesson) {
          return { kind: 'second_half' as const };
        }
      }
    }

    // Check if this placement is the FIRST half of a double period spanning 2 periods
    if (periodIdx < config.periods.length - 1) {
      const nextPlacement = getCellPlacement(entityId, dayIdx, periodIdx + 1);
      if (nextPlacement) {
        const isSameDoubleGroup =
          currentPlacement.doubleGroupId &&
          nextPlacement.doubleGroupId &&
          currentPlacement.doubleGroupId === nextPlacement.doubleGroupId;

        const isSameDoubleLesson =
          currentPlacement.lessonId === nextPlacement.lessonId &&
          !!currentLesson?.isDoublePeriod;

        if (isSameDoubleGroup || isSameDoubleLesson) {
          return {
            kind: 'first_half' as const,
            placement: currentPlacement,
            colSpan: 2,
          };
        }
      }
    }

    return {
      kind: 'single' as const,
      placement: currentPlacement,
      colSpan: 1,
    };
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#D1D5DB] p-2 select-none">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-2 rounded-md border border-slate-300 mb-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          {isSingleView ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'العنصر المعروض:' : 'Élément Sélectionné:'}</span>
              <select
                value={activeSingleEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="text-xs font-bold bg-slate-100 border border-slate-300 rounded px-3 py-1 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {rowEntities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} - {e.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-blue-800" />
              <span>
                {displayMode === 'matrix_classes' ? t.viewByClass : displayMode === 'matrix_teachers' ? t.viewByTeacher : t.viewByRoom} ({filteredRowEntities.length})
              </span>
            </div>
          )}

          {/* Toggle Hide/Show Disabled Slots */}
          <button
            type="button"
            onClick={() => setHideDisabledSlots((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-bold text-[11px] transition cursor-pointer ${hideDisabledSlots
                ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            title={hideDisabledSlots ? 'إظهار الفترات المغلقة/الملغاة في الجدول' : 'إخفاء الفترات المغلقة/الملغاة لتقليص حجم الجدول'}
          >
            {hideDisabledSlots ? <EyeOff className="w-3.5 h-3.5 text-purple-700" /> : <Eye className="w-3.5 h-3.5 text-slate-600" />}
            <span>{hideDisabledSlots ? 'إخفاء الحصص المغلقة (مفعل)' : 'إظهار كافة الحصص'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 relative min-w-[200px]">
          <Search className={`w-3.5 h-3.5 text-slate-400 absolute ${lang === 'ar' ? 'right-2.5' : 'left-2.5'} top-2 pointer-events-none`} />
          <input
            type="text"
            placeholder={lang === 'ar' ? 'بحث عن فصل/أستاذ/قاعة...' : 'Rechercher classe/enseignant/salle...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full text-xs ${lang === 'ar' ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-1 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Matrix Container */}
      <div className="flex-1 bg-white rounded-md border border-[#9CA3AF] shadow-sm overflow-auto">
        <table className="w-full border-collapse text-center text-xs min-w-full">
          {/* Header Rows */}
          <thead>
            {/* Top Header: Days */}
            <tr className="bg-[#E2E8F0] border-b border-[#9CA3AF] text-slate-800 font-bold">
              <th className={`p-2 border-r border-[#9CA3AF] w-24 bg-[#CBD5E1] ${lang === 'ar' ? 'sticky right-0' : 'sticky left-0'} z-20`}>
                {displayMode.includes('class')
                  ? t.classGroup
                  : displayMode.includes('teacher')
                    ? t.teacher
                    : t.room}
              </th>
              {config.days.map((dayName, dayIdx) => {
                const activeIndices = getActivePeriodIndices(dayIdx);
                const colSpan = Math.max(1, activeIndices.length);
                const isOffDay = activeIndices.length === 0;

                return (
                  <th
                    key={dayIdx}
                    colSpan={colSpan}
                    className="p-1.5 border-r border-[#9CA3AF] text-center bg-[#DBE2EC] text-slate-900 font-bold border-b border-[#9CA3AF]"
                  >
                    {dayName} {isOffDay && <span className="text-[10px] text-red-700 font-normal">(عطلة)</span>}
                  </th>
                );
              })}
            </tr>

            {/* Sub Header: Time Slots */}
            <tr className="bg-[#F1F5F9] border-b border-[#9CA3AF] text-[10px] text-slate-600 font-medium">
              <th className={`p-1 border-r border-[#9CA3AF] bg-[#E2E8F0] ${lang === 'ar' ? 'sticky right-0' : 'sticky left-0'} z-20`}>
                {t.period}
              </th>
              {config.days.map((_, dayIdx) => {
                const activeIndices = getActivePeriodIndices(dayIdx);
                if (activeIndices.length === 0) {
                  return (
                    <th key={`off-${dayIdx}`} className="p-1 border-r border-slate-300 text-[9.5px] font-bold text-slate-400 bg-slate-200">
                      -
                    </th>
                  );
                }
                return activeIndices.map((periodIdx) => {
                  const period = config.periods[periodIdx];
                  const disabled = isSlotDisabled(config, dayIdx, periodIdx);
                  return (
                    <th
                      key={`${dayIdx}-${periodIdx}`}
                      className={`p-1 border-r border-slate-300 text-[9.5px] font-mono font-bold ${disabled ? 'bg-slate-300 text-slate-500 line-through' : 'bg-[#EDF2F7] text-slate-700'
                        }`}
                    >
                      {period ? period.label : `ح ${periodIdx + 1}`}
                    </th>
                  );
                });
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {filteredRowEntities.length === 0 ? (
              <tr>
                <td
                  colSpan={totalTableColumns}
                  className="p-12 text-center text-slate-500 bg-slate-50/80"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                    <span className="font-extrabold text-sm text-slate-800">
                      {lang === 'ar' ? 'لا توجد عناصر لعرضها في الجدول' : 'Aucun élément à afficher dans l\'emploi du temps'}
                    </span>
                    <p className="text-xs text-slate-500 max-w-md">
                      {lang === 'ar'
                        ? 'قم بإضافة المواد والأساتذة والفصول من القائمة العلوية للبدء في إدخال وتصميم جدول حصص مدرستك من الصفر.'
                        : 'Ajoutez des matières, enseignants et classes depuis le menu supérieur pour concevoir votre emploi du temps.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRowEntities.map((entity, rowIdx) => (
                <tr
                  key={entity.id}
                  className={`border-b border-[#CBD5E1] transition ${
                    draggedClassGroupId === entity.id
                      ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-400'
                      : rowIdx % 2 === 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-[#FAFAFA] hover:bg-slate-50'
                  }`}
                >
                  {/* Row Label (Class code, Teacher code, or Room code) */}
                  <td className={`p-0 border-r border-[#9CA3AF] font-bold text-slate-800 ${
                    draggedClassGroupId === entity.id
                      ? 'bg-emerald-100 text-emerald-950 ring-2 ring-inset ring-emerald-400'
                      : 'bg-[#E2E8F0]'
                  } ${lang === 'ar' ? 'sticky right-0' : 'sticky left-0'} z-10 shadow-2xs`}>
                    <div className="h-8 w-full flex items-center justify-center overflow-hidden px-1">
                      <span
                        className="block w-full truncate text-center text-[10px] leading-none text-blue-900 font-extrabold"
                        title={entity.code}
                      >
                        {entity.code}
                      </span>
                    </div>
                  </td>

                  {/* Day x Period Cells */}
                  {config.days.map((_, dayIdx) => {
                    const activeIndices = getActivePeriodIndices(dayIdx);
                    if (activeIndices.length === 0) {
                      return (
                        <td
                          key={`off-cell-${entity.id}-${dayIdx}`}
                          className="p-0 border-r border-slate-300 bg-slate-100 text-slate-400 font-bold text-[9px] text-center select-none h-8"
                        >
                          عطلة
                        </td>
                      );
                    }

                    return activeIndices.map((periodIdx) => {
                      const disabled = isSlotDisabled(config, dayIdx, periodIdx);
                      if (disabled && !hideDisabledSlots) {
                        return (
                          <td
                            key={`dis-${entity.id}-${dayIdx}-${periodIdx}`}
                            className="p-0 border-r border-slate-300 bg-slate-200/90 text-slate-400 font-bold text-[9px] text-center select-none cursor-not-allowed h-8"
                            title="حصص ملغاة / زوال مغلق"
                          >
                            مغلق
                          </td>
                        );
                      }

                      const cellInfo = getCellMergedInfo(entity.id, dayIdx, periodIdx);

                      if (cellInfo.kind === 'second_half') {
                        // Second half of a double period: the first cell spans both periods, so do not render a second cell.
                        return null;
                      }

                      const placement = cellInfo.kind === 'empty' ? null : cellInfo.placement;
                      const details = placement
                        ? getPlacementDetails(placement, lessons, subjects, teachers, classes, rooms)
                        : null;

                      const colSpan = cellInfo.kind === 'first_half' ? 2 : 1;

                      // Check if cell has conflict
                      const hasConflict = placement
                        ? conflicts.some((c) => c.placementIds.includes(placement.id))
                        : false;

                      return (
                        <td
                          key={`${entity.id}-${dayIdx}-${periodIdx}`}
                          colSpan={colSpan}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dayIdx, periodIdx, entity.id)}
                          onClick={() => handleCellClick(dayIdx, periodIdx, entity.id, placement || undefined)}
                          className={`p-0 border-r border-slate-300 h-8 relative align-middle transition-all cursor-pointer overflow-hidden ${
                            draggedClassGroupId === entity.id && !hasConflict
                              ? 'bg-emerald-50/80'
                              : ''
                          } ${selectedLessonForPlacement ? 'hover:bg-blue-100/60' : ''
                            } ${hasConflict ? 'bg-red-50' : ''}`}
                        >
                          {placement && details ? (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, placement.id)}
                              onDragEnd={handleDragEnd}
                              className={`absolute inset-0 w-full h-full rounded-none border border-black/20 px-1 py-0 flex items-center justify-center shadow-2xs group transition-transform active:scale-[0.99] ${hasConflict ? 'ring-2 ring-red-600 ring-inset animate-pulse' : ''
                                }`}
                              style={{
                                backgroundColor: details.subject?.color || '#E5E7EB',
                                color: details.subject?.textColor || '#000000',
                              }}
                            >
                              {/* Subject Code */}
                              <div className="flex items-center gap-1">
                                <span className="font-extrabold text-[9px] leading-none tracking-wide drop-shadow-2xs truncate max-w-[44px]">
                                  {details.subject?.code || details.subject?.name || '---'}
                                </span>
                              </div>

                              {/* الكارت يعرض فقط كود المادة */}

                              {/* Conflict Warning Icon */}
                              {hasConflict && (
                                <div className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full shadow">
                                  <AlertCircle className="w-3 h-3" />
                                </div>
                              )}

                              {/* Delete Button on Hover */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemovePlacement(placement.id);
                                }}
                                className="absolute top-0.5 left-0.5 bg-red-600 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition hover:bg-red-700 cursor-pointer"
                                title="حذف الحصة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </td>
                      );
                    });
                  })}
                </tr>
              )))}
          </tbody>
        </table>
      </div>
    </div>
  );
};