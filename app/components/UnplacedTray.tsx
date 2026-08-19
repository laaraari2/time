import React, { useState } from 'react';
import { Lesson, Subject, ClassGroup, Teacher, Placement } from '../types';
import { translations, Language } from '../utils/i18n';
import {
  Layers,
  Play,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface UnplacedTrayProps {
  lessons: Lesson[];
  placements: Placement[];
  subjects: Subject[];
  classes: ClassGroup[];
  teachers: Teacher[];
  selectedLessonForPlacement: Lesson | null;
  onSelectLesson: (lesson: Lesson | null) => void;
  onDropPlacementToTray?: (placementId: string) => void;
  onAutoPlaceAll: () => void;
  position?: 'bottom' | 'top';
  language?: Language;
  onTogglePosition?: () => void;
}

type UnplacedItem = {
  lesson: Lesson;
  occurrence: number;
};

type UnplacedGroup = {
  key: string;
  items: UnplacedItem[];
  remainingCount: number;
};

export const UnplacedTray: React.FC<UnplacedTrayProps> = ({
  lessons,
  placements,
  subjects,
  classes,
  teachers,
  selectedLessonForPlacement,
  onSelectLesson,
  onDropPlacementToTray,
  onAutoPlaceAll,
  position = 'bottom',
  language = 'ar',
  onTogglePosition,
}) => {
  const t = translations[language] || translations.ar;
  const [isCollapsed, setIsCollapsed] = useState(false);

  /*
   * weeklyPeriods = number of weekly occurrences.
   *
   * A double occurrence creates TWO Placement records in the timetable,
   * sharing the same doubleGroupId, but it is still ONE occurrence/card.
   *
   * Example:
   *   weeklyPeriods = 2 + isDoublePeriod = true
   *   => 2 cards in the tray
   *   => each card represents 2 consecutive timetable hours
   *   => after placing one card, one card remains
   */

  const getPlacedOccurrences = (lesson: Lesson): number => {
    const lessonPlacements = placements.filter(
      (placement) => placement.lessonId === lesson.id
    );

    if (!lesson.isDoublePeriod) {
      return lessonPlacements.length;
    }

    // Double occurrence = one doubleGroupId, even though it has two placements.
    const groups = new Set<string>();

    lessonPlacements.forEach((placement) => {
      if (placement.doubleGroupId) {
        groups.add(`double:${placement.doubleGroupId}`);
        return;
      }

      // Backward compatibility for old data without doubleGroupId.
      const sibling = lessonPlacements.find(
        (other) =>
          other.id !== placement.id &&
          other.dayIndex === placement.dayIndex &&
          Math.abs(other.periodIndex - placement.periodIndex) === 1
      );

      if (sibling) {
        groups.add(
          `legacy:${placement.dayIndex}:${Math.min(
            placement.periodIndex,
            sibling.periodIndex
          )}`
        );
      } else {
        groups.add(`single:${placement.id}`);
      }
    });

    return groups.size;
  };

  // Do NOT divide by 2: weeklyPeriods is the number of occurrences/cards.
  const getRequiredOccurrences = (lesson: Lesson): number =>
    Math.max(0, lesson.weeklyPeriods);

  const groupsMap = new Map<string, UnplacedGroup>();

  lessons.forEach((lesson) => {
    const requiredOccurrences = getRequiredOccurrences(lesson);
    const placedOccurrences = getPlacedOccurrences(lesson);
    const remaining = Math.max(
      0,
      requiredOccurrences - placedOccurrences
    );

    if (remaining <= 0) return;

    const key = [
      lesson.subjectId,
      lesson.classGroupId,
      lesson.teacherId,
      lesson.groupName || '',
      lesson.groupType || '',
      lesson.isDoublePeriod ? 'double' : 'single',
    ].join('::');

    const existing = groupsMap.get(key);

    if (existing) {
      for (let i = 0; i < remaining; i += 1) {
        existing.items.push({
          lesson,
          occurrence: existing.items.length,
        });
      }
      existing.remainingCount += remaining;
    } else {
      groupsMap.set(key, {
        key,
        items: Array.from({ length: remaining }, (_, i) => ({
          lesson,
          occurrence: i,
        })),
        remainingCount: remaining,
      });
    }
  });

  const unplacedGroups = Array.from(groupsMap.values());

  const totalRemainingCount = unplacedGroups.reduce(
    (total, group) => total + group.remainingCount,
    0
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!onDropPlacementToTray) return;

        try {
          const raw = e.dataTransfer.getData('text/plain');
          if (!raw) return;

          const payload = raw.startsWith('{')
            ? JSON.parse(raw)
            : {
                type: 'placement',
                placementId: raw,
              };

          if (
            payload?.type === 'placement' &&
            payload.placementId
          ) {
            onDropPlacementToTray(payload.placementId);
            onSelectLesson(null);
          }
        } catch {
          // Ignore malformed drag payloads.
        }
      }}
      className={`bg-[#EBF2FA] ${
        position === 'bottom' ? 'border-t-2' : 'border-b-2'
      } border-[#20518D] px-3 py-1.5 shadow-md flex flex-col gap-1.5 select-none transition-all duration-200 shrink-0`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-800 p-1 rounded text-xs font-bold transition cursor-pointer"
            title={isCollapsed ? t.expand : t.collapse}
          >
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4 text-[#20518D]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#20518D]" />
            )}
            <span>{isCollapsed ? t.expand : t.collapse}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#20518D]" />
            <span className="text-xs font-extrabold text-slate-800">
              {t.unplacedTitle}
            </span>
            <span className="bg-[#20518D] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {totalRemainingCount} {t.remaining}
            </span>
          </div>

          {onTogglePosition && (
            <button
              type="button"
              onClick={onTogglePosition}
              className="text-[11px] font-bold text-[#20518D] bg-white border border-[#20518D]/30 hover:bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer mr-2"
              title={position === 'bottom' ? t.moveTop : t.moveBottom}
            >
              {position === 'bottom' ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              <span>
                {position === 'bottom' ? t.moveTop : t.moveBottom}
              </span>
            </button>
          )}
        </div>

        {unplacedGroups.length > 0 && (
          <div className="flex items-center gap-2">
            {selectedLessonForPlacement && (
              <span className="text-xs text-amber-800 font-bold bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded animate-pulse">
                {language === 'ar'
                  ? 'تم تحديد بطاقة! انقر على خانة في الجدول لتسكينها'
                  : 'Séance sélectionnée! Cliquez sur la grille pour la placer'}
              </span>
            )}

            <button
              type="button"
              onClick={onAutoPlaceAll}
              className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded shadow-xs transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{t.autoPlace}</span>
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div
          className="flex flex-wrap content-start items-start gap-2 overflow-y-auto overflow-x-hidden py-1 min-h-[48px] max-h-[108px] scrollbar-thin border-t border-slate-200/80 pt-1"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
        >
          {unplacedGroups.length === 0 ? (
            <div className="w-full flex items-center justify-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 py-1.5 rounded-md">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>
                {language === 'ar'
                  ? 'ممتاز! جميع الحصص معينة بنجاح في الجدول المدرسِي.'
                  : "Parfait! Toutes les séances sont placées dans l'emploi du temps."}
              </span>
            </div>
          ) : (
            unplacedGroups.map((group) => {
              const firstLesson = group.items[0]?.lesson;
              if (!firstLesson) return null;

              const fallbackSubject = subjects.find(
                (item) => item.id === firstLesson.subjectId
              );
              const fallbackClass = classes.find(
                (item) => item.id === firstLesson.classGroupId
              );
              const fallbackTeacher = teachers.find(
                (item) => item.id === firstLesson.teacherId
              );

              const cardWidth = 76;
              const cardHeight = 38;
              const stackOffset = 6;
              const depth = Math.max(0, group.items.length - 1);

              return (
                <div
                  key={group.key}
                  className="relative shrink-0"
                  style={{
                    width: cardWidth + depth * stackOffset,
                    height: cardHeight + depth * stackOffset,
                  }}
                >
                  {group.items.map((item, index) => {
                    const lesson = item.lesson;

                    const subject =
                      subjects.find(
                        (subjectItem) =>
                          subjectItem.id === lesson.subjectId
                      ) || fallbackSubject;

                    const classGroup =
                      classes.find(
                        (classItem) =>
                          classItem.id === lesson.classGroupId
                      ) || fallbackClass;

                    const teacher =
                      teachers.find(
                        (teacherItem) =>
                          teacherItem.id === lesson.teacherId
                      ) || fallbackTeacher;

                    const isSelected =
                      selectedLessonForPlacement?.id === lesson.id;

                    const subjectCode =
                      subject?.code?.trim() ||
                      subject?.name?.trim() ||
                      '---';

                    const classCode =
                      classGroup?.code?.trim() || '---';

                    const teacherCode =
                      teacher?.code?.trim() || '---';

                    const tooltipText =
                      language === 'ar'
                        ? `${subject?.name || subjectCode}
القسم: ${classCode}
الأستاذ: ${teacherCode}
النوع: ${
                            lesson.isDoublePeriod
                              ? 'حصة مزدوجة (ساعتان متتاليتان)'
                              : 'حصة منفردة (ساعة واحدة)'
                          }
الحصة رقم: ${item.occurrence + 1}
المتبقي: ${group.remainingCount} حصص`
                        : `${subject?.name || subjectCode}
Classe : ${classCode}
Enseignant : ${teacherCode}
Type : ${
                            lesson.isDoublePeriod
                              ? 'séance double (2 heures consécutives)'
                              : 'séance simple (1 heure)'
                          }
Séance n° : ${item.occurrence + 1}
Restant : ${group.remainingCount} séances`;

                    const visualOffset =
                      (group.items.length - 1 - index) *
                      stackOffset;

                    return (
                      <div
                        key={`${group.key}-${item.occurrence}`}
                        draggable
                        title={tooltipText}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            'text/plain',
                            JSON.stringify({
                              type: 'unplaced_lesson',
                              lessonId: lesson.id,
                              occurrence: item.occurrence,
                            })
                          );
                          e.dataTransfer.effectAllowed = 'move';

                          window.dispatchEvent(
                            new CustomEvent('timetable:drag-class', {
                              detail: {
                                classGroupId: lesson.classGroupId,
                              },
                            })
                          );

                          onSelectLesson(lesson);
                        }}
                        onDragEnd={() => {
                          window.dispatchEvent(
                            new CustomEvent('timetable:drag-class', {
                              detail: {
                                classGroupId: null,
                              },
                            })
                          );
                        }}
                        onClick={() =>
                          onSelectLesson(
                            isSelected ? null : lesson
                          )
                        }
                        className={`absolute rounded-md border border-black/20 px-2 shadow-sm flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-150 ${
                          isSelected
                            ? 'ring-2 ring-blue-600 ring-offset-1'
                            : 'hover:-translate-y-0.5'
                        }`}
                        style={{
                          width: cardWidth,
                          height: cardHeight,
                          top: visualOffset,
                          left: visualOffset,
                          zIndex: index + 1,
                          backgroundColor:
                            teacher?.color || '#E5E7EB',
                          color:
                            teacher?.textColor || '#000000',
                        }}
                      >
                        <span className="text-[11px] font-black leading-none">
                          {subjectCode}
                        </span>

                        <span className="text-[8px] font-bold opacity-90 truncate max-w-[68px] leading-tight">
                          {classCode}
                        </span>

                        <span className="text-[7px] opacity-80 truncate max-w-[68px] leading-none">
                          {teacherCode}
                        </span>

                        {lesson.isDoublePeriod && (
                          <span className="absolute -left-1.5 -top-1.5 rounded border border-white bg-amber-500 px-1 text-[7px] font-black leading-none text-white shadow">
                            2س
                          </span>
                        )}

                        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-red-600 px-1 text-[8px] font-black leading-none text-white shadow">
                          {item.occurrence + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
