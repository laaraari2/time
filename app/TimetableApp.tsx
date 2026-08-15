'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertTriangle,
  X,
} from 'lucide-react';

import {
  Subject,
  Teacher,
  ClassGroup,
  Classroom,
  Lesson,
  Placement,
  TimetableConfig,
  DisplayMode,
  SavedScheduleProfile,
} from './types';

import {
  defaultConfig,
  initialSubjects,
  initialClassGroups,
  initialClassrooms,
  initialTeachers,
  buildInitialLessonsAndPlacements,
} from './data/initiaData';

import {
  checkConflicts,
  autoGenerateTimetable,
} from './utils/timetableGenerator';

import { RibbonHeader } from './components/RibbonHeader';
import { TimetableMatrixView } from './components/TimetableMatrixView';
import { UnplacedTray } from './components/UnplacedTray';
import { DataModal } from './components/DataModal';
import { AutoGenerateModal } from './components/AutoGenerateModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { ConflictDrawer } from './components/ConflictDrawer';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { LessonCardModal } from './components/LessonCardModal';
import { NewScheduleModal } from './components/NewScheduleModal';
import { SettingsModal } from './components/SettingsModal';
import { TeacherWorkloadModal } from './components/TeacherWorkloadModal';
import { TeacherAssignModal } from './components/TeacherAssignModal';
import { ClassSubjectMatrixModal } from './components/ClassSubjectMatrixModal';
import { TeacherClassMatrixModal } from './components/TeacherClassMatrixModal';
import { TeacherClassAssignmentModal } from './components/TeacherClassAssignmentModal';
import { SavedProfilesModal } from './components/SavedProfilesModal';

type TimetableSavePayload = {
  config: TimetableConfig;
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassGroup[];
  rooms: Classroom[];
  lessons: Lesson[];
  placements: Placement[];
};

export type TimetableAppProps = {
  initialProfile?: SavedScheduleProfile | null;
  openNewSchedule?: boolean;
  onBackToDashboard: () => void;
  onLogout: () => void;
};

export function TimetableApp({
  initialProfile = null,
  openNewSchedule = false,
  onBackToDashboard,
  onLogout,
}: TimetableAppProps) {
  const isCreatingNewSchedule =
    openNewSchedule && !initialProfile;

  /*
   * ============================================================
   * APPLICATION DATA
   *
   * A genuinely new project starts completely empty.
   * Existing/saved projects can still use the sample defaults
   * until their own data is loaded.
   * ============================================================
   */

  const [config, setConfig] =
    useState<TimetableConfig>(defaultConfig);

  const [subjects, setSubjects] =
    useState<Subject[]>(
      isCreatingNewSchedule ? [] : initialSubjects
    );

  const [teachers, setTeachers] =
    useState<Teacher[]>(
      isCreatingNewSchedule ? [] : initialTeachers
    );

  const [classes, setClasses] =
    useState<ClassGroup[]>(
      isCreatingNewSchedule ? [] : initialClassGroups
    );

  const [rooms, setRooms] =
    useState<Classroom[]>(
      isCreatingNewSchedule ? [] : initialClassrooms
    );

  const initialData = useMemo(() => {
    return buildInitialLessonsAndPlacements();
  }, []);

  const [lessons, setLessons] =
    useState<Lesson[]>(
      isCreatingNewSchedule ? [] : initialData.lessons
    );

  const [placements, setPlacements] =
    useState<Placement[]>(
      isCreatingNewSchedule ? [] : initialData.placements
    );

  /*
   * ============================================================
   * DATABASE STATE
   * ============================================================
   */

  const [savedProfiles, setSavedProfiles] =
    useState<SavedScheduleProfile[]>([]);

  const [currentProfileId, setCurrentProfileId] =
    useState<string | null>(null);

  const [storageLoaded, setStorageLoaded] =
    useState(false);

  const [projectReady, setProjectReady] =
    useState(Boolean(initialProfile));

  const [saving, setSaving] =
    useState(false);

  const [showLeaveDialog, setShowLeaveDialog] =
    useState(false);

  const [leaveAction, setLeaveAction] =
    useState<'dashboard' | 'logout'>('dashboard');

  const [savedSnapshot, setSavedSnapshot] =
    useState<string | null>(null);

  const saveTimerRef =
    useRef<number | null>(null);

  const saveInProgressRef =
    useRef(false);

  const pendingSaveRef =
    useRef(false);

  const latestPayloadRef =
    useRef<TimetableSavePayload | null>(null);

  /*
   * ============================================================
   * LOAD PROJECT
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadProject = async () => {
      try {
        const profilesResponse = await fetch(
          '/api/timetable/profiles',
          { method: 'GET', cache: 'no-store' }
        );

        if (profilesResponse.ok) {
          const profiles = await profilesResponse.json();

          if (!cancelled && Array.isArray(profiles)) {
            setSavedProfiles(profiles);
          }
        }

        if (!initialProfile) {
          if (!cancelled) {
            setStorageLoaded(true);
          }
          return;
        }

        const response = await fetch(
          `/api/timetable/profiles/${initialProfile.id}`,
          { method: 'GET', cache: 'no-store' }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load project: ${response.status}`
          );
        }

        const project = await response.json();

        if (cancelled) return;

        setConfig(project.config);
        setSubjects(
          Array.isArray(project.subjects)
            ? project.subjects
            : []
        );
        setTeachers(
          Array.isArray(project.teachers)
            ? project.teachers
            : []
        );
        setClasses(
          Array.isArray(project.classes)
            ? project.classes
            : []
        );
        setRooms(
          Array.isArray(project.rooms)
            ? project.rooms
            : []
        );
        setLessons(
          Array.isArray(project.lessons)
            ? project.lessons
            : []
        );
        setPlacements(
          Array.isArray(project.placements)
            ? project.placements
            : []
        );
        setCurrentProfileId(project.id);

        setSavedSnapshot(
          JSON.stringify({
            config: project.config,
            subjects: Array.isArray(project.subjects)
              ? project.subjects
              : [],
            teachers: Array.isArray(project.teachers)
              ? project.teachers
              : [],
            classes: Array.isArray(project.classes)
              ? project.classes
              : [],
            rooms: Array.isArray(project.rooms)
              ? project.rooms
              : [],
            lessons: Array.isArray(project.lessons)
              ? project.lessons
              : [],
            placements: Array.isArray(project.placements)
              ? project.placements
              : [],
          })
        );

        setProjectReady(true);
      } catch (error) {
        console.error(
          'Failed to load project:',
          error
        );
      } finally {
        if (!cancelled) {
          setStorageLoaded(true);
        }
      }
    };

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [initialProfile]);

  /*
   * ============================================================
   * SYNC HTML LANGUAGE / RTL
   * ============================================================
   */

  useEffect(() => {
    const lang =
      config.language || 'ar';

    document.documentElement.dir =
      lang === 'ar'
        ? 'rtl'
        : 'ltr';

    document.documentElement.lang =
      lang;
  }, [config.language]);

  /*
   * ============================================================
   * SAVE CURRENT PROJECT
   * ============================================================
   */

  const currentPayload: TimetableSavePayload =
    useMemo(
      () => ({
        config,
        subjects,
        teachers,
        classes,
        rooms,
        lessons,
        placements,
      }),
      [
        config,
        subjects,
        teachers,
        classes,
        rooms,
        lessons,
        placements,
      ]
    );

  const currentSnapshot =
    useMemo(
      () => JSON.stringify(currentPayload),
      [currentPayload]
    );

  const isDirty =
    storageLoaded &&
    projectReady &&
    (
      savedSnapshot === null ||
      currentSnapshot !== savedSnapshot
    );

  const runSave = async (
    overridePayload?: Partial<TimetableSavePayload>,
    options?: { suppressAlert?: boolean }
  ): Promise<boolean> => {
    if (saveInProgressRef.current) {
      return false;
    }

    saveInProgressRef.current = true;
    setSaving(true);

    try {
      const payload: TimetableSavePayload = {
        ...currentPayload,
        ...overridePayload,
        teachers:
          overridePayload?.teachers ??
          currentPayload.teachers,
      };

      let savedProfile: SavedScheduleProfile | null = null;

      if (currentProfileId) {
        const response = await fetch(
          `/api/timetable/profiles/${currentProfileId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to update project: ${response.status}`
          );
        }

        const result = await response.json();

        savedProfile =
          result.profile ?? result;
      } else {
        const projectName =
          String(
            payload.config.schoolName ||
              'مشروع جديد'
          ).trim() || 'مشروع جديد';

        const response = await fetch(
          '/api/timetable/profiles',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: projectName,
              ...payload,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to create project: ${response.status}`
          );
        }

        savedProfile =
          await response.json();

        setCurrentProfileId(
          savedProfile.id
        );
      }

      if (savedProfile) {
        setSavedProfiles((prev) => [
          savedProfile,
          ...prev.filter(
            (profile) =>
              profile.id !== savedProfile.id
          ),
        ]);
      }

      setSavedSnapshot(
        JSON.stringify(payload)
      );

      return true;
    } catch (error) {
      console.error(
        'Failed to save project:',
        error
      );

      if (!options?.suppressAlert) {
        alert(
          'تعذر حفظ المشروع. لم يتم تسجيل الخروج حتى لا تضيع التغييرات.'
        );
      }

      return false;
    } finally {
      saveInProgressRef.current = false;
      setSaving(false);
    }
  };

  const handleSaveProject = async () => {
    await runSave();
  };

  const handleTeacherClassAssignmentSave = async (
    updatedTeachers: Teacher[]
  ) => {
    // The assignment modal saves the complete teacher list. The previous
    // handler expected a single Teacher, so it received an array, read
    // `updatedTeacher.id` as undefined, and then saved the old teachers.
    setTeachers(updatedTeachers);

    return await runSave(
      { teachers: updatedTeachers },
      { suppressAlert: true }
    );
  };

  const handleLeaveProject = () => {
    if (!isDirty) {
      onBackToDashboard();
      return;
    }

    setLeaveAction('dashboard');
    setShowLeaveDialog(true);
  };

  const handleLogoutRequest = () => {
    if (!isDirty) {
      onLogout();
      return;
    }

    setLeaveAction('logout');
    setShowLeaveDialog(true);
  };

  const handleSaveAndLeave = async () => {
    const saved = await runSave();

    if (!saved) {
      return;
    }

    setShowLeaveDialog(false);
    onBackToDashboard();
  };

  const handleLeaveWithoutSaving = () => {
    setShowLeaveDialog(false);
    onBackToDashboard();
  };

  const handleSaveAndLogout = async () => {
    const saved = await runSave();

    if (!saved) {
      return;
    }

    setShowLeaveDialog(false);
    onLogout();
  };

  const handleLogoutWithoutSaving = () => {
    setShowLeaveDialog(false);
    onLogout();
  };

  useEffect(() => {
    const handleBeforeUnload = (
      event: BeforeUnloadEvent
    ) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );
    };
  }, [isDirty]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(
          saveTimerRef.current
        );
      }
    };
  }, []);

  /*
   * ============================================================
   * SAVED PROFILES
   * ============================================================
   */

  const handleSaveCurrentAsNew =
    async (name: string) => {
      try {
        const response =
          await fetch(
            '/api/timetable/profiles',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                name,
                config,
                subjects,
                teachers,
                classes,
                rooms,
                lessons,
                placements,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            `Failed to save profile: ${response.status}`
          );
        }

        const profile =
          await response.json();

        setSavedProfiles(
          (prev) => [
            profile,
            ...prev,
          ]
        );

        setCurrentProfileId(
          profile.id
        );

        setSavedSnapshot(
          JSON.stringify({
            config,
            subjects,
            teachers,
            classes,
            rooms,
            lessons,
            placements,
          })
        );
      } catch (error) {
        console.error(
          'Failed to save profile:',
          error
        );

        alert(
          'حدث خطأ أثناء حفظ استعمال الزمن في قاعدة البيانات.'
        );
      }
    };

  const handleLoadProfile = (
    prof: SavedScheduleProfile
  ) => {
    setConfig(prof.config);
    setSubjects(prof.subjects);
    setTeachers(prof.teachers);
    setClasses(prof.classes);
    setRooms(prof.rooms);
    setLessons(prof.lessons);
    setPlacements(prof.placements);

    setCurrentProfileId(
      prof.id
    );

    setSavedSnapshot(
      JSON.stringify({
        config: prof.config,
        subjects: prof.subjects,
        teachers: prof.teachers,
        classes: prof.classes,
        rooms: prof.rooms,
        lessons: prof.lessons,
        placements: prof.placements,
      })
    );
  };

  const handleDuplicateProfile =
    async (
      prof: SavedScheduleProfile
    ) => {
      try {
        const response =
          await fetch(
            '/api/timetable/profiles',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                name: `${prof.name} (نسخة)`,
                config: prof.config,
                subjects: prof.subjects,
                teachers: prof.teachers,
                classes: prof.classes,
                rooms: prof.rooms,
                lessons: prof.lessons,
                placements: prof.placements,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            `Failed to duplicate profile: ${response.status}`
          );
        }

        const duplicated =
          await response.json();

        setSavedProfiles(
          (prev) => [
            duplicated,
            ...prev,
          ]
        );
      } catch (error) {
        console.error(
          'Failed to duplicate profile:',
          error
        );

        alert(
          'حدث خطأ أثناء نسخ استعمال الزمن.'
        );
      }
    };

  const handleDeleteProfile =
    async (
      profileId: string
    ) => {
      try {
        const response =
          await fetch(
            `/api/timetable/profiles/${profileId}`,
            {
              method: 'DELETE',
            }
          );

        if (!response.ok) {
          throw new Error(
            `Failed to delete profile: ${response.status}`
          );
        }

        setSavedProfiles(
          (prev) =>
            prev.filter(
              (p) =>
                p.id !== profileId
            )
        );

        if (
          currentProfileId ===
          profileId
        ) {
          setCurrentProfileId(
            null
          );
        }
      } catch (error) {
        console.error(
          'Failed to delete profile:',
          error
        );

        alert(
          'حدث خطأ أثناء حذف استعمال الزمن.'
        );
      }
    };

  /*
   * ============================================================
   * LANGUAGE
   * ============================================================
   */

  const handleToggleLanguage =
    () => {
      const currentLang =
        config.language || 'ar';

      const newLang =
        currentLang === 'ar'
          ? 'fr'
          : 'ar';

      const arDays = [
        'الاثنين',
        'الثلاثاء',
        'الأربعاء',
        'الخميس',
        'الجمعة',
        'السبت',
        'الأحد',
      ];

      const frDays = [
        'Lundi',
        'Mardi',
        'Mercredi',
        'Jeudi',
        'Vendredi',
        'Samedi',
        'Dimanche',
      ];

      const newDays =
        config.days.map(
          (day) => {
            if (
              newLang === 'fr'
            ) {
              const idx =
                arDays.indexOf(
                  day
                );

              return idx !== -1
                ? frDays[idx]
                : day;
            }

            const idx =
              frDays.indexOf(
                day
              );

            return idx !== -1
              ? arDays[idx]
              : day;
          }
        );

      setConfig(
        (prev) => ({
          ...prev,
          language:
            newLang,
          days:
            newDays,
        })
      );
    };

  /*
   * ============================================================
   * UI STATE
   * ============================================================
   */

  const [
    displayMode,
    setDisplayMode,
  ] =
    useState<DisplayMode>(
      'matrix_classes'
    );

  const [
    selectedLessonForPlacement,
    setSelectedLessonForPlacement,
  ] =
    useState<Lesson | null>(
      null
    );

  const [
    editingPlacement,
    setEditingPlacement,
  ] =
    useState<Placement | null>(
      null
    );

  const [
    activeModal,
    setActiveModal,
  ] =
    useState<string | null>(
      null
    );

  /*
   * ============================================================
   * OPEN A PROFILE / NEW SCHEDULE FROM DASHBOARD
   * ============================================================
   */

  useEffect(() => {
    if (!storageLoaded) return;

    if (initialProfile) {
      setConfig(initialProfile.config);
      setSubjects(initialProfile.subjects);
      setTeachers(initialProfile.teachers);
      setClasses(initialProfile.classes);
      setRooms(initialProfile.rooms);
      setLessons(initialProfile.lessons);
      setPlacements(initialProfile.placements);
      setCurrentProfileId(initialProfile.id);

      setSavedSnapshot(
        JSON.stringify({
          config: initialProfile.config,
          subjects: initialProfile.subjects,
          teachers: initialProfile.teachers,
          classes: initialProfile.classes,
          rooms: initialProfile.rooms,
          lessons: initialProfile.lessons,
          placements: initialProfile.placements,
        })
      );
    }

    if (openNewSchedule && !initialProfile) {
      /*
       * New project = no inherited/sample data.
       * The settings modal will be the first step.
       */
      setConfig(defaultConfig);
      setSubjects([]);
      setTeachers([]);
      setClasses([]);
      setRooms([]);
      setLessons([]);
      setPlacements([]);

      setCurrentProfileId(null);
      setSavedSnapshot(null);
      setSelectedLessonForPlacement(null);

      setActiveModal('new_schedule');
    }
  }, [storageLoaded, initialProfile, openNewSchedule]);

  const dataModalTabs = [
    'subjects',
    'teachers',
    'classes',
    'rooms',
    'lessons',
  ] as const;

  type DataModalTab =
    (typeof dataModalTabs)[number];

  const isDataModalTab = (
    value: string | null
  ): value is DataModalTab =>
    dataModalTabs.includes(
      value as DataModalTab
    );

  const [
    editingTeacherForAssign,
    setEditingTeacherForAssign,
  ] =
    useState<Teacher | null>(
      null
    );

  const [
    showTeacherClassAssignment,
    setShowTeacherClassAssignment,
  ] =
    useState(false);

  const [
    isFullscreen,
    setIsFullscreen,
  ] =
    useState(false);

  /*
   * ============================================================
   * FULLSCREEN
   * ============================================================
   */

  useEffect(() => {
    const handleFullscreenChange =
      () => {
        setIsFullscreen(
          !!document.fullscreenElement
        );
      };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen =
    () => {
      if (
        !document.fullscreenElement
      ) {
        document.documentElement
          .requestFullscreen()
          .catch((err) => {
            console.warn(
              'Full-screen request denied or not supported in iframe',
              err
            );
          });
      } else if (
        document.exitFullscreen
      ) {
        document.exitFullscreen();
      }
    };

  /*
   * ============================================================
   * CONFLICTS
   * ============================================================
   */

  const conflicts = useMemo(
    () => {
      return checkConflicts(
        placements,
        lessons,
        teachers,
        classes,
        rooms,
        config
      );
    },
    [
      placements,
      lessons,
      teachers,
      classes,
      rooms,
      config,
    ]
  );

  /*
   * ============================================================
   * PLACEMENT STATISTICS
   * ============================================================
   */

  const totalRequiredPeriods =
    useMemo(() => {
      return lessons.reduce(
        (sum, lesson) =>
          sum +
          lesson.weeklyPeriods,
        0
      );
    }, [lessons]);

  const placedPercentage =
    useMemo(() => {
      if (
        totalRequiredPeriods ===
        0
      ) {
        return 0;
      }

      const count =
        placements.length;

      return Math.min(
        100,
        Math.round(
          (count /
            totalRequiredPeriods) *
            100
        )
      );
    }, [
      placements,
      totalRequiredPeriods,
    ]);

  /*
   * ============================================================
   * WEEKLY HOURS: REQUIRED VS SCHEDULED
   *
   * Required hours are entered manually in the teacher/class
   * assignment modal. Scheduled hours are derived from actual
   * placements: a single period = 1 hour, a double period = 2.
   * ============================================================
   */
  const weeklyHoursStatus = useMemo(() => {
    const status: Array<{
      teacherId: string;
      teacherName: string;
      subjectId: string;
      classId: string;
      requiredHours: number;
      scheduledHours: number;
      remainingHours: number;
    }> = [];

    const seenDoubleGroups = new Set<string>();

    for (const teacher of teachers) {
      const assignments = Array.isArray(teacher.weeklyHoursAssignments)
        ? teacher.weeklyHoursAssignments
        : [];

      for (const assignment of assignments) {
        const requiredHours = Math.max(
          0,
          Number(assignment.weeklyHours) || 0
        );

        if (
          !assignment.classGroupId ||
          !assignment.subjectId ||
          requiredHours <= 0
        ) {
          continue;
        }

        let scheduledHours = 0;

        for (const placement of placements as any[]) {
          const lesson = lessons.find(
            (item) =>
              item.id === placement.lessonId
          );

          if (
            !lesson ||
            lesson.teacherId !== teacher.id ||
            lesson.classGroupId !== assignment.classId ||
            lesson.subjectId !== assignment.subjectId
          ) {
            continue;
          }

          if (placement.doubleGroupId) {
            const key = String(
              placement.doubleGroupId
            );

            if (seenDoubleGroups.has(key)) {
              continue;
            }

            seenDoubleGroups.add(key);
            scheduledHours += 2;
          } else {
            scheduledHours += lesson.isDoublePeriod ? 2 : 1;
          }
        }

        status.push({
          teacherId: teacher.id,
          teacherName:
            teacher.name ||
            teacher.code ||
            teacher.id,
          subjectId: assignment.subjectId,
          classId: assignment.classGroupId,
          requiredHours,
          scheduledHours,
          remainingHours:
            requiredHours - scheduledHours,
        });
      }
    }

    return status;
  }, [teachers, lessons, placements]);

  const weeklyHoursSummary = useMemo(() => {
    return weeklyHoursStatus.reduce(
      (summary, item) => {
        summary.required += item.requiredHours;
        summary.scheduled += item.scheduledHours;
        summary.remaining += Math.max(
          0,
          item.remainingHours
        );
        if (item.remainingHours > 0) {
          summary.missing += 1;
        }
        if (item.remainingHours === 0) {
          summary.complete += 1;
        }
        return summary;
      },
      {
        required: 0,
        scheduled: 0,
        remaining: 0,
        missing: 0,
        complete: 0,
      }
    );
  }, [weeklyHoursStatus]);

  /*
   * ============================================================
   * PLACE LESSON
   * ============================================================
   */

  const handlePlaceLesson = (
    lessonId: string,
    dayIdx: number,
    periodIdx: number,
    roomId?: string
  ) => {
    const lesson =
      lessons.find(
        (l) =>
          l.id === lessonId
      );

    if (!lesson) return;

    if (
      lesson.isDoublePeriod
    ) {
      let p1 = periodIdx;
      let p2 =
        periodIdx + 1;

      if (
        p2 >=
        config.periods.length
      ) {
        p1 = Math.max(
          0,
          config.periods.length -
            2
        );

        p2 =
          config.periods.length -
          1;
      }

      const dblGroupId =
        `dbl-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 6)}`;

      const newP1: Placement =
        {
          id: `plc-${Date.now()}-1`,
          lessonId,
          dayIndex:
            dayIdx,
          periodIndex:
            p1,
          roomId,
          doubleGroupId:
            dblGroupId,
        };

      const newP2: Placement =
        {
          id: `plc-${Date.now()}-2`,
          lessonId,
          dayIndex:
            dayIdx,
          periodIndex:
            p2,
          roomId,
          doubleGroupId:
            dblGroupId,
        };

      setPlacements(
        (prev) => [
          ...prev,
          newP1,
          newP2,
        ]
      );
    } else {
      const newPlacement:
        Placement = {
        id:
          `plc-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 6)}`,
        lessonId,
        dayIndex:
          dayIdx,
        periodIndex:
          periodIdx,
        roomId,
      };

      setPlacements(
        (prev) => [
          ...prev,
          newPlacement,
        ]
      );
    }

    setSelectedLessonForPlacement(
      null
    );
  };

  /*
   * ============================================================
   * REMOVE PLACEMENT
   * ============================================================
   */

  const handleRemovePlacement = (
    placementId: string
  ) => {
    setPlacements(
      (prev) => {
        const target =
          prev.find(
            (p) =>
              p.id ===
              placementId
          );

        if (!target) {
          return prev;
        }

        if (
          target.doubleGroupId
        ) {
          return prev.filter(
            (p) =>
              p.doubleGroupId !==
              target.doubleGroupId
          );
        }

        const lesson =
          lessons.find(
            (l) =>
              l.id ===
              target.lessonId
          );

        if (
          lesson?.isDoublePeriod
        ) {
          const sibling =
            prev.find(
              (p) =>
                p.lessonId ===
                  target.lessonId &&
                p.dayIndex ===
                  target.dayIndex &&
                p.id !==
                  target.id &&
                Math.abs(
                  p.periodIndex -
                    target.periodIndex
                ) === 1
            );

          if (sibling) {
            return prev.filter(
              (p) =>
                p.id !==
                  target.id &&
                p.id !==
                  sibling.id
            );
          }
        }

        return prev.filter(
          (p) =>
            p.id !==
            placementId
        );
      }
    );
  };

  /*
   * ============================================================
   * MOVE PLACEMENT
   * ============================================================
   */

  const handleMovePlacement = (
    placementId: string,
    newDayIdx: number,
    newPeriodIdx: number
  ) => {
    setPlacements(
      (prev) => {
        const target =
          prev.find(
            (p) =>
              p.id ===
              placementId
          );

        if (!target) {
          return prev;
        }

        let proposed = [
          ...prev,
        ];

        let movedPlacementIds =
          [placementId];

        if (
          target.doubleGroupId
        ) {
          const siblings =
            prev.filter(
              (p) =>
                p.doubleGroupId ===
                target.doubleGroupId
            );

          if (
            siblings.length ===
            2
          ) {
            const sorted = [
              ...siblings,
            ].sort(
              (a, b) =>
                a.periodIndex -
                b.periodIndex
            );

            let p1 =
              newPeriodIdx;

            let p2 =
              newPeriodIdx + 1;

            if (
              p2 >=
              config.periods.length
            ) {
              p1 = Math.max(
                0,
                config.periods.length -
                  2
              );

              p2 =
                config.periods.length -
                1;
            }

            movedPlacementIds =
              sorted.map(
                (p) => p.id
              );

            proposed =
              prev.map(
                (p) => {
                  if (
                    p.id ===
                    sorted[0].id
                  ) {
                    return {
                      ...p,
                      dayIndex:
                        newDayIdx,
                      periodIndex:
                        p1,
                    };
                  }

                  if (
                    p.id ===
                    sorted[1].id
                  ) {
                    return {
                      ...p,
                      dayIndex:
                        newDayIdx,
                      periodIndex:
                        p2,
                    };
                  }

                  return p;
                }
              );
          }
        } else {
          const lesson =
            lessons.find(
              (l) =>
                l.id ===
                target.lessonId
            );

          if (
            lesson?.isDoublePeriod
          ) {
            const sibling =
              prev.find(
                (p) =>
                  p.lessonId ===
                    target.lessonId &&
                  p.dayIndex ===
                    target.dayIndex &&
                  p.id !==
                    target.id &&
                  Math.abs(
                    p.periodIndex -
                      target.periodIndex
                  ) === 1
              );

            if (sibling) {
              const sorted = [
                target,
                sibling,
              ].sort(
                (a, b) =>
                  a.periodIndex -
                  b.periodIndex
              );

              let p1 =
                newPeriodIdx;

              let p2 =
                newPeriodIdx +
                1;

              if (
                p2 >=
                config.periods.length
              ) {
                p1 = Math.max(
                  0,
                  config.periods.length -
                    2
                );

                p2 =
                  config.periods.length -
                  1;
              }

              movedPlacementIds =
                sorted.map(
                  (p) => p.id
                );

              proposed =
                prev.map(
                  (p) => {
                    if (
                      p.id ===
                      sorted[0].id
                    ) {
                      return {
                        ...p,
                        dayIndex:
                          newDayIdx,
                        periodIndex:
                          p1,
                      };
                    }

                    if (
                      p.id ===
                      sorted[1].id
                    ) {
                      return {
                        ...p,
                        dayIndex:
                          newDayIdx,
                        periodIndex:
                          p2,
                      };
                    }

                    return p;
                  }
                );
            } else {
              proposed =
                prev.map(
                  (p) =>
                    p.id ===
                    placementId
                      ? {
                          ...p,
                          dayIndex:
                            newDayIdx,
                          periodIndex:
                            newPeriodIdx,
                        }
                      : p
                );
            }
          } else {
            proposed =
              prev.map(
                (p) =>
                  p.id ===
                  placementId
                    ? {
                        ...p,
                        dayIndex:
                          newDayIdx,
                        periodIndex:
                          newPeriodIdx,
                      }
                    : p
              );
          }
        }

        const previousConflicts =
          checkConflicts(
            prev,
            lessons,
            teachers,
            classes,
            rooms,
            config
          );

        const proposedConflicts =
          checkConflicts(
            proposed,
            lessons,
            teachers,
            classes,
            rooms,
            config
          );

        const movedConflictKey = (
          conflict: (typeof proposedConflicts)[number]
        ) =>
          `${conflict.type}|${[
            ...conflict.placementIds,
          ]
            .sort()
            .join(',')}`;

        const previousKeys =
          new Set(
            previousConflicts.map(
              movedConflictKey
            )
          );

        const introducesConflict =
          proposedConflicts.some(
            (conflict) =>
              conflict.placementIds.some(
                (id) =>
                  movedPlacementIds.includes(
                    id
                  )
              ) &&
              !previousKeys.has(
                movedConflictKey(
                  conflict
                )
              )
          );

        if (
          introducesConflict
        ) {
          return prev;
        }

        return proposed;
      }
    );
  };

  /*
   * ============================================================
   * ACTIONS
   * ============================================================
   */

  const handleNewSchedule =
    () => {
      setActiveModal(
        'new_schedule'
      );
    };

  const handleConfirmSetupSchedule =
    (
      newConfig: TimetableConfig,
      mode:
        | 'scratch'
        | 'keep_data'
    ) => {
      setProjectReady(true);
      setConfig(newConfig);

      if (
        mode === 'scratch'
      ) {
        setSubjects([]);
        setTeachers([]);
        setClasses([]);
        setRooms([]);
        setLessons([]);
        setPlacements([]);

        setSelectedLessonForPlacement(
          null
        );

        setActiveModal(
          'subjects'
        );
      } else if (
        mode ===
        'keep_data'
      ) {
        setPlacements([]);

        setSelectedLessonForPlacement(
          null
        );
      }
    };

  /*
   * ============================================================
   * RESET SAMPLE DATA
   * ============================================================
   */

  const handleResetSampleData =
    () => {
      setProjectReady(true);
      const {
        lessons: initL,
        placements: initP,
      } =
        buildInitialLessonsAndPlacements();

      setConfig(
        (prev) => ({
          ...prev,
          schoolName:
            'مؤسسة الرواد المدرسية',
        })
      );

      setSubjects(
        initialSubjects
      );

      setTeachers(
        initialTeachers
      );

      setClasses(
        initialClassGroups
      );

      setRooms(
        initialClassrooms
      );

      setLessons(initL);
      setPlacements(initP);

      setSelectedLessonForPlacement(
        null
      );
    };

  /*
   * ============================================================
   * AUTO GENERATE
   * ============================================================
   */

  const handleRunAutoGenerate =
    () => {
      const result =
        autoGenerateTimetable(
          lessons,
          teachers,
          classes,
          rooms,
          config
        );

      setPlacements(
        result.newPlacements
      );

      setSelectedLessonForPlacement(
        null
      );

      if (
        result.unplacedLessons
          .length > 0
      ) {
        const names =
          result.unplacedLessons
            .map(
              (lesson) => {
                const cls =
                  classes.find(
                    (c) =>
                      c.id ===
                      lesson.classGroupId
                  )?.code || '?';

                const subject =
                  subjects.find(
                    (s) =>
                      s.id ===
                      lesson.subjectId
                  )?.code || '?';

                return `${cls} / ${subject}`;
              }
            )
            .join(', ');

        window.setTimeout(
          () => {
            alert(
              `تم توليد الجدول مع وجود ${result.unplacedLessons.length} تكليف(ات) لم يتم تسكينها.\n\n${names}\n\nراجع القيود أو عدد القاعات والأوقات المتاحة.`
            );
          },
          50
        );
      }
    };

  /*
   * ============================================================
   * EXPORT JSON
   * ============================================================
   */

  const handleExportJSON =
    () => {
      const data = {
        config,
        subjects,
        teachers,
        classes,
        rooms,
        lessons,
        placements,
      };

      const blob =
        new Blob(
          [
            JSON.stringify(
              data,
              null,
              2
            ),
          ],
          {
            type: 'application/json',
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          'a'
        );

      a.href = url;

      a.download =
        `aSc_Timetable_${config.schoolName.replace(
          /\s+/g,
          '_'
        )}.json`;

      a.click();

      URL.revokeObjectURL(
        url
      );
    };

  /*
   * ============================================================
   * IMPORT JSON
   * ============================================================
   */

  const handleImportJSON =
    () => {
      const input =
        document.createElement(
          'input'
        );

      input.type = 'file';
      input.accept =
        'application/json';

      input.onchange = (
        e: Event
      ) => {
        const inputElement =
          e.currentTarget as HTMLInputElement;

        const file =
          inputElement.files?.[0];

        if (!file) return;

        const reader =
          new FileReader();

        reader.onload = (
          event
        ) => {
          try {
            const data =
              JSON.parse(
                event.target
                  ?.result as string
              );

            if (data.config) {
              setConfig(
                data.config
              );
            }

            if (
              Array.isArray(
                data.subjects
              )
            ) {
              setSubjects(
                data.subjects
              );
            }

            if (
              Array.isArray(
                data.teachers
              )
            ) {
              setTeachers(
                data.teachers
              );
            }

            if (
              Array.isArray(
                data.classes
              )
            ) {
              setClasses(
                data.classes
              );
            }

            if (
              Array.isArray(
                data.rooms
              )
            ) {
              setRooms(
                data.rooms
              );
            }

            if (
              Array.isArray(
                data.lessons
              )
            ) {
              setLessons(
                data.lessons
              );
            }

            if (
              Array.isArray(
                data.placements
              )
            ) {
              setPlacements(
                data.placements
              );
            }

            alert(
              'تم استيراد ملف الجدول المدرسي بنجاح!'
            );
          } catch (error) {
            console.error(
              'Failed to import JSON:',
              error
            );

            alert(
              'حدث خطأ أثناء قراءة ملف JSON.'
            );
          }
        };

        reader.readAsText(
          file
        );
      };

      input.click();
    };

  /*
   * ============================================================
   * TRAY
   * ============================================================
   */

  const [
    trayPosition,
    setTrayPosition,
  ] =
    useState<
      'bottom' | 'top'
    >('bottom');

  const isRtl =
    (config.language ||
      'ar') === 'ar';

  /*
   * ============================================================
   * LOADING SCREEN
   * ============================================================
   */

  if (!storageLoaded) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center bg-slate-100 font-sans"
        dir="rtl"
      >
        <div className="rounded-xl bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          جاري تحميل البيانات من قاعدة البيانات...
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * APPLICATION
   * ============================================================
   */

  return (
    <div
      className={`flex h-screen w-screen flex-col overflow-hidden bg-slate-100 font-sans ${
        isRtl
          ? 'text-right'
          : 'text-left'
      }`}
      dir={
        isRtl
          ? 'rtl'
          : 'ltr'
      }
    >
      <RibbonHeader
        schoolName={
          config.schoolName
        }
        activeTab="home"
        setActiveTab={() => {}}
        displayMode={
          displayMode
        }
        setDisplayMode={
          setDisplayMode
        }
        conflictCount={
          conflicts.length
        }
        placedPercentage={
          placedPercentage
        }
        isFullscreen={
          isFullscreen
        }
        language={
          config.language ||
          'ar'
        }
        onToggleFullscreen={
          toggleFullscreen
        }
        onToggleLanguage={
          handleToggleLanguage
        }
        onNew={
          handleNewSchedule
        }
        onOpenSavedProfiles={() =>
          setActiveModal(
            'saved_profiles'
          )
        }
        onOpenModal={(
          modalName
        ) => {
          if (modalName === 'teacher_class_assignment') {
            setShowTeacherClassAssignment(true);
            return;
          }

          setActiveModal(modalName);
        }}
        onOpenTeacherClassAssignment={() =>
          setShowTeacherClassAssignment(true)
        }
        onAutoGenerate={() =>
          setActiveModal(
            'auto_generate'
          )
        }
        onCheckConflicts={() =>
          setActiveModal(
            'conflicts'
          )
        }
        onPrintPreview={() =>
          setActiveModal(
            'print'
          )
        }
        onExportJSON={
          handleExportJSON
        }
        onResetSample={
          handleResetSampleData
        }
        isSaved={!isDirty}
        saving={saving}
        onSaveProject={handleSaveProject}
        onLogout={handleLogoutRequest}
      />

      {weeklyHoursStatus.length > 0 && (
        <div className="mx-4 mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black text-slate-900">
                {config.language === 'ar'
                  ? 'متابعة الساعات الأسبوعية'
                  : 'Suivi des heures hebdomadaires'}
              </div>
              <div className="mt-1 text-[10px] font-semibold text-slate-500">
                {config.language === 'ar'
                  ? 'المطلوب من إسناد الأقسام مقابل الساعات المبرمجة فعلياً في استعمال الزمن.'
                  : 'Heures demandées dans l’affectation مقابل heures réellement placées.'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black">
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
                {config.language === 'ar'
                  ? `المطلوب: ${weeklyHoursSummary.required} س`
                  : `Demandé : ${weeklyHoursSummary.required} h`}
              </span>
              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                {config.language === 'ar'
                  ? `المنجز: ${weeklyHoursSummary.scheduled} س`
                  : `Programmé : ${weeklyHoursSummary.scheduled} h`}
              </span>
              <span className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                {config.language === 'ar'
                  ? `المتبقي: ${weeklyHoursSummary.remaining} س`
                  : `Restant : ${weeklyHoursSummary.remaining} h`}
              </span>
              {weeklyHoursSummary.missing > 0 && (
                <span className="rounded-lg bg-red-50 px-3 py-2 text-red-700">
                  {config.language === 'ar'
                    ? `${weeklyHoursSummary.missing} إسناد ناقص`
                    : `${weeklyHoursSummary.missing} affectation(s) incomplète(s)`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {trayPosition ===
        'top' && (
        <UnplacedTray
          lessons={lessons}
          placements={placements}
          subjects={subjects}
          classes={classes}
          teachers={teachers}
          selectedLessonForPlacement={
            selectedLessonForPlacement
          }
          onSelectLesson={
            setSelectedLessonForPlacement
          }
          onDropPlacementToTray={
            handleRemovePlacement
          }
          position="top"
          language={
            config.language ||
            'ar'
          }
          onTogglePosition={() =>
            setTrayPosition(
              'bottom'
            )
          }
          onAutoPlaceAll={() => {
            const {
              newPlacements,
            } =
              autoGenerateTimetable(
                lessons,
                teachers,
                classes,
                rooms,
                config
              );

            setPlacements(
              newPlacements
            );
          }}
        />
      )}

      <TimetableMatrixView
        config={config}
        subjects={subjects}
        teachers={teachers}
        classes={classes}
        rooms={rooms}
        lessons={lessons}
        placements={placements}
        conflicts={conflicts}
        displayMode={
          displayMode
        }
        selectedLessonForPlacement={
          selectedLessonForPlacement
        }
        onPlaceLesson={
          handlePlaceLesson
        }
        onRemovePlacement={
          handleRemovePlacement
        }
        onMovePlacement={
          handleMovePlacement
        }
        onSelectCellToEdit={(
          p
        ) =>
          setEditingPlacement(
            p
          )
        }
      />

      {trayPosition ===
        'bottom' && (
        <UnplacedTray
          lessons={lessons}
          placements={placements}
          subjects={subjects}
          classes={classes}
          teachers={teachers}
          selectedLessonForPlacement={
            selectedLessonForPlacement
          }
          onSelectLesson={
            setSelectedLessonForPlacement
          }
          onDropPlacementToTray={
            handleRemovePlacement
          }
          position="bottom"
          language={
            config.language ||
            'ar'
          }
          onTogglePosition={() =>
            setTrayPosition(
              'top'
            )
          }
          onAutoPlaceAll={() => {
            const {
              newPlacements,
            } =
              autoGenerateTimetable(
                lessons,
                teachers,
                classes,
                rooms,
                config
              );

            setPlacements(
              newPlacements
            );
          }}
        />
      )}

      {isDataModalTab(
        activeModal
      ) && (
        <DataModal
          activeTab={
            activeModal
          }
          config={config}
          subjects={subjects}
          teachers={teachers}
          classes={classes}
          rooms={rooms}
          lessons={lessons}
          placements={placements}
          onClose={() =>
            setActiveModal(
              null
            )
          }
          onUpdateSubjects={
            setSubjects
          }
          onUpdateTeachers={
            setTeachers
          }
          onUpdateClasses={
            setClasses
          }
          onUpdateRooms={
            setRooms
          }
          onUpdateLessons={
            setLessons
          }
          onUpdatePlacements={
            setPlacements
          }
        />
      )}

      {editingPlacement &&
        (() => {
          const lesson =
            lessons.find(
              (l) =>
                l.id ===
                editingPlacement.lessonId
            );

          if (!lesson) {
            return null;
          }

          const subject =
            subjects.find(
              (s) =>
                s.id ===
                lesson.subjectId
            );

          const teacher =
            teachers.find(
              (t) =>
                t.id ===
                lesson.teacherId
            );

          const classGroup =
            classes.find(
              (c) =>
                c.id ===
                lesson.classGroupId
            );

          const currentRoom =
            rooms.find(
              (r) =>
                r.id ===
                editingPlacement.roomId
            );

          return (
            <LessonCardModal
              placement={
                editingPlacement
              }
              lesson={lesson}
              subject={subject}
              teacher={teacher}
              classGroup={
                classGroup
              }
              currentRoom={
                currentRoom
              }
              allRooms={rooms}
              allTeachers={
                teachers
              }
              conflicts={
                conflicts
              }
              onClose={() =>
                setEditingPlacement(
                  null
                )
              }
              onUpdatePlacement={(
                pId,
                rId,
                tId
              ) => {
                setPlacements(
                  (prev) =>
                    prev.map(
                      (p) =>
                        p.id ===
                        pId
                          ? {
                              ...p,
                              roomId:
                                rId,
                            }
                          : p
                    )
                );

                if (tId) {
                  setLessons(
                    (prev) =>
                      prev.map(
                        (l) =>
                          l.id ===
                          lesson.id
                            ? {
                                ...l,
                                teacherId:
                                  tId,
                              }
                            : l
                      )
                  );
                }
              }}
              onRemovePlacement={
                handleRemovePlacement
              }
            />
          );
        })()}

      {activeModal ===
        'settings' && (
        <SettingsModal
          currentConfig={config}
          language={config.language || 'ar'}
          onClose={() =>
            setActiveModal(null)
          }
          onSave={(updatedConfig) => {
            setConfig(updatedConfig);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal ===
        'new_schedule' && (
        <NewScheduleModal
          currentConfig={
            config
          }
          onClose={() =>
            setActiveModal(
              null
            )
          }
          onConfirmSetup={
            handleConfirmSetupSchedule
          }
          onLoadSampleData={
            handleResetSampleData
          }
        />
      )}

      {activeModal ===
        'auto_generate' && (
        <AutoGenerateModal
          onClose={() =>
            setActiveModal(
              null
            )
          }
          onStartGeneration={
            handleRunAutoGenerate
          }
        />
      )}

      {activeModal ===
        'ai' && (
        <AIAssistantModal
          subjects={subjects}
          teachers={teachers}
          classes={classes}
          onClose={() =>
            setActiveModal(
              null
            )
          }
        />
      )}

      {activeModal ===
        'conflicts' && (
        <ConflictDrawer
          conflicts={conflicts}
          config={config}
          onClose={() =>
            setActiveModal(
              null
            )
          }
          onResolveConflict={
            (pId) =>
              handleRemovePlacement(
                pId
              )
          }
        />
      )}

      {activeModal ===
        'teacher_stats' && (
        <TeacherWorkloadModal
          teachers={teachers}
          subjects={subjects}
          classes={classes}
          lessons={lessons}
          placements={placements}
          onClose={() =>
            setActiveModal(
              null
            )
          }
          onEditTeacher={(
            teacher
          ) => {
            setActiveModal(
              null
            );

            setEditingTeacherForAssign(
              teacher
            );
          }}
        />
      )}

      {activeModal ===
        'class_subject_matrix' && (
        <ClassSubjectMatrixModal
          classes={classes}
          subjects={subjects}
          lessons={lessons}
          language={
            config.language ||
            'ar'
          }
          onClose={() =>
            setActiveModal(
              null
            )
          }
        />
      )}

      {activeModal ===
        'teacher_class_matrix' && (
        <TeacherClassMatrixModal
          teachers={teachers}
          subjects={subjects}
          classes={classes}
          lessons={lessons}
          language={
            config.language ||
            'ar'
          }
          onClose={() =>
            setActiveModal(
              null
            )
          }
        />
      )}

      {editingTeacherForAssign && (
        <TeacherAssignModal
          teacher={
            editingTeacherForAssign
          }
          subjects={subjects}
          classes={classes}
          existingLessons={
            lessons
          }
          onClose={() =>
            setEditingTeacherForAssign(
              null
            )
          }
          onSaveTeacherAndLessons={(
            updatedTeacher,
            newTeacherLessons
          ) => {
            setTeachers(
              (prev) => {
                const exists =
                  prev.some(
                    (t) =>
                      t.id ===
                      updatedTeacher.id
                  );

                if (exists) {
                  return prev.map(
                    (t) =>
                      t.id ===
                      updatedTeacher.id
                        ? updatedTeacher
                        : t
                  );
                }

                return [
                  ...prev,
                  updatedTeacher,
                ];
              }
            );

            setLessons(
              (prev) => {
                const otherLessons =
                  prev.filter(
                    (l) =>
                      l.teacherId !==
                      updatedTeacher.id
                  );

                return [
                  ...otherLessons,
                  ...newTeacherLessons,
                ];
              }
            );

            setEditingTeacherForAssign(
              null
            );
          }}
        />
      )}

      {showTeacherClassAssignment && (
        <TeacherClassAssignmentModal
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          lessons={lessons}
          language={config.language || 'ar'}
          config={config}
          onClose={() =>
            setShowTeacherClassAssignment(false)
          }
          onSave={handleTeacherClassAssignmentSave}
        />
      )}

      {activeModal ===
        'saved_profiles' && (
        <SavedProfilesModal
          savedProfiles={
            savedProfiles
          }
          currentProfileId={
            currentProfileId
          }
          currentConfig={
            config
          }
          currentSubjects={
            subjects
          }
          currentTeachers={
            teachers
          }
          currentClasses={
            classes
          }
          currentRooms={
            rooms
          }
          currentLessons={
            lessons
          }
          currentPlacements={
            placements
          }
          language={
            config.language ||
            'ar'
          }
          onClose={() =>
            setActiveModal(
              null
            )
          }
          onLoadProfile={
            handleLoadProfile
          }
          onSaveCurrentAsNew={
            handleSaveCurrentAsNew
          }
          onDuplicateProfile={
            handleDuplicateProfile
          }
          onDeleteProfile={
            handleDeleteProfile
          }
        />
      )}

      {activeModal ===
        'print' && (
        <PrintPreviewModal
          config={config}
          subjects={subjects}
          teachers={teachers}
          classes={classes}
          rooms={rooms}
          lessons={lessons}
          placements={
            placements
          }
          onClose={() =>
            setActiveModal(
              null
            )
          }
        />
      )}

      {saving && (
        <div className="pointer-events-none fixed bottom-4 left-4 z-[9999] rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
          جاري حفظ البيانات...
        </div>
      )}

      {showLeaveDialog && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="bg-gradient-to-l from-[#123E70] to-[#2B68B1] px-5 py-4 text-white">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <AlertTriangle className="h-6 w-6 text-amber-300" />
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-black">
                    توجد تغييرات غير محفوظة
                  </h3>
                  <p className="mt-1 text-xs leading-6 text-white/75">
                    {leaveAction === 'logout'
                      ? 'قبل تسجيل الخروج، اختر ماذا تريد أن تفعل بهذه التغييرات.'
                      : 'قبل العودة إلى المشاريع، اختر ماذا تريد أن تفعل بهذه التغييرات.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLeaveDialog(false)}
                  className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="إلغاء"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-6 text-amber-900">
                هذه التغييرات لن يتم الاحتفاظ بها إذا اخترت الخروج بدون حفظ.
              </div>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void (
                      leaveAction === 'logout'
                        ? handleSaveAndLogout()
                        : handleSaveAndLeave()
                    )
                  }
                  disabled={saving}
                  className="rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                >
                  حفظ والخروج
                </button>

                <button
                  type="button"
                  onClick={
                    leaveAction === 'logout'
                      ? handleLogoutWithoutSaving
                      : handleLeaveWithoutSaving
                  }
                  disabled={saving}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  خروج بدون حفظ
                </button>

                <button
                  type="button"
                  onClick={() => setShowLeaveDialog(false)}
                  disabled={saving}
                  className="rounded-2xl bg-slate-100 px-4 py-3.5 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}