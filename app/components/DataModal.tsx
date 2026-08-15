import React, { useMemo, useRef, useState } from 'react';
import {
  Subject,
  Teacher,
  ClassGroup,
  Classroom,
  Lesson,
  Placement,
  TimetableConfig,
} from '../types';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Users,
  School,
  DoorOpen,
  ListPlus,
  CalendarX,
  Sparkles,
  Layers,
} from 'lucide-react';
import { TeacherAvailabilityModal } from './TeacherAvailabilityModal';
import { TeacherAssignModal } from './TeacherAssignModal';
import { moroccanCurriculumSubjects } from '../data/initiaData';
import * as XLSX from 'xlsx';

interface DataModalProps {
  activeTab: 'subjects' | 'teachers' | 'classes' | 'rooms' | 'lessons';
  config: TimetableConfig;
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassGroup[];
  rooms: Classroom[];
  lessons: Lesson[];
  placements: Placement[];
  onClose: () => void;
  onUpdateSubjects: (subjects: Subject[]) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
  onUpdateClasses: (classes: ClassGroup[]) => void;
  onUpdateRooms: (rooms: Classroom[]) => void;
  onUpdateLessons: (lessons: Lesson[]) => void;
  onUpdatePlacements: (placements: Placement[]) => void;
}

export const DataModal: React.FC<DataModalProps> = ({
  activeTab: initialTab,
  config,
  subjects,
  teachers,
  classes,
  rooms,
  lessons,
  placements,
  onClose,
  onUpdateSubjects,
  onUpdateTeachers,
  onUpdateClasses,
  onUpdateRooms,
  onUpdateLessons,
  onUpdatePlacements,
}) => {
  const [currentTab, setCurrentTab] = useState(initialTab);

  const [editingTeacherForAvailability, setEditingTeacherForAvailability] =
    useState<Teacher | null>(null);

  const [activeTeacherForAssignment, setActiveTeacherForAssignment] =
    useState<Teacher | 'new' | null>(null);

  const teacherFileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================
  // SUBJECT FORM
  // =========================================================

  const [subCode, setSubCode] = useState('');
  const [subName, setSubName] = useState('');
  const [subColor, setSubColor] = useState('#3B82F6');

  // =========================================================
  // TEACHER FORM
  // =========================================================

  const [teacherCode, setTeacherCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubjectId, setTeacherSubjectId] = useState('');

  // =========================================================
  // CLASS FORM
  // =========================================================

  const [classCode, setClassCode] = useState('');
  const [className, setClassName] = useState('');

  // =========================================================
  // ROOM FORM
  // =========================================================

  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');

  // =========================================================
  // LESSON FORM
  // =========================================================

  const [lsnClassId, setLsnClassId] = useState('');
  const [lsnSubjectId, setLsnSubjectId] = useState('');
  const [lsnTeacherId, setLsnTeacherId] = useState('');
  const [lsnHours, setLsnHours] = useState(4);
  const [lsnIsDoublePeriod, setLsnIsDoublePeriod] = useState(false);

  // =========================================================
  // SUBJECT HANDLERS
  // =========================================================

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subCode.trim() || !subName.trim()) return;

    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      code: subCode.trim().toUpperCase(),
      name: subName.trim(),
      color: subColor,
      textColor: '#FFFFFF',
      defaultWeeklyHours: 4,
    };

    onUpdateSubjects([...subjects, newSubject]);

    setSubCode('');
    setSubName('');
  };

  const handleDeleteSubject = (id: string) => {
    const removedLessonIds = new Set(
      lessons
        .filter((lesson) => lesson.subjectId === id)
        .map((lesson) => lesson.id)
    );

    onUpdateSubjects(
      subjects.filter((subject) => subject.id !== id)
    );

    onUpdateTeachers(
      teachers.map((teacher) => ({
        ...teacher,
        subjectIds: teacher.subjectIds.filter(
          (subjectId) => subjectId !== id
        ),
      }))
    );

    onUpdateLessons(
      lessons.filter((lesson) => lesson.subjectId !== id)
    );

    onUpdatePlacements(
      placements.filter(
        (placement) => !removedLessonIds.has(placement.lessonId)
      )
    );

    if (lsnSubjectId === id) {
      setLsnSubjectId('');
      setLsnTeacherId('');
    }
  };

  const handleEditSubject = (subject: Subject) => {
    const name = window.prompt('اسم المادة:', subject.name);
    if (name === null) return;

    const code = window.prompt('رمز المادة:', subject.code);
    if (code === null) return;

    const weeklyHoursValue = window.prompt(
      'عدد الساعات الأسبوعية الافتراضية:',
      String(subject.defaultWeeklyHours)
    );

    if (weeklyHoursValue === null) return;

    const weeklyHours = Number(weeklyHoursValue);

    if (
      !name.trim() ||
      !code.trim() ||
      !Number.isFinite(weeklyHours)
    ) {
      return;
    }

    onUpdateSubjects(
      subjects.map((item) =>
        item.id === subject.id
          ? {
              ...item,
              name: name.trim(),
              code: code.trim().toUpperCase(),
              defaultWeeklyHours: Math.max(
                1,
                Math.round(weeklyHours)
              ),
            }
          : item
      )
    );
  };

  // =========================================================
  // TEACHER HANDLERS
  // =========================================================

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherCode.trim() || !teacherName.trim()) return;

    const newTeacher: Teacher = {
      id: `t-${Date.now()}`,
      code: teacherCode.trim(),
      name: teacherName.trim(),
      subjectIds: teacherSubjectId
        ? [teacherSubjectId]
        : [],
      unavailableSlots: [],
    };

    onUpdateTeachers([...teachers, newTeacher]);

    setTeacherCode('');
    setTeacherName('');
    setTeacherSubjectId('');
  };

  const handleDeleteTeacher = (id: string) => {
    const removedLessonIds = new Set(
      lessons
        .filter((lesson) => lesson.teacherId === id)
        .map((lesson) => lesson.id)
    );

    onUpdateTeachers(
      teachers.filter((teacher) => teacher.id !== id)
    );

    onUpdateLessons(
      lessons.filter((lesson) => lesson.teacherId !== id)
    );

    onUpdatePlacements(
      placements.filter(
        (placement) => !removedLessonIds.has(placement.lessonId)
      )
    );

    if (lsnTeacherId === id) {
      setLsnTeacherId('');
    }
  };

  // =========================================================
  // EXCEL HELPERS
  // =========================================================

  const normalizeHeader = (value: unknown) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_-]+/g, '');

  const normalizeText = (value: unknown) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

  // =========================================================
  // DOWNLOAD TEACHER TEMPLATE
  //
  // النموذج:
  // Matière | Nom
  //
  // المادة تكون معمرة تلقائيا
  // اسم الأستاذ يبقى فارغا
  // =========================================================

  const handleDownloadTeacherTemplate = () => {
    if (!subjects.length) {
      alert(
        'لا توجد مواد دراسية حالياً. أضف المواد أولاً ثم حمّل نموذج الأساتذة.'
      );
      return;
    }

    const rows = subjects.map((subject) => ({
      Matière: subject.name,
      Nom: '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 35 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Enseignants'
    );

    XLSX.writeFile(
      workbook,
      'modele_enseignants_par_matiere.xlsx'
    );
  };

  // =========================================================
  // IMPORT TEACHERS FROM EXCEL
  //
  // المستخدم يعمر فقط:
  // Nom
  //
  // Matière موجودة مسبقا في النموذج
  // =========================================================

  const handleImportTeachersExcel = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: 'array',
      });

      const firstSheet =
        workbook.Sheets[workbook.SheetNames[0]];

      if (!firstSheet) {
        throw new Error(
          'Aucune feuille Excel trouvée.'
        );
      }

      const rows =
        XLSX.utils.sheet_to_json<Record<string, unknown>>(
          firstSheet,
          {
            defval: '',
          }
        );

      if (!rows.length) {
        alert(
          'ملف Excel فارغ أو لا يحتوي على بيانات.'
        );
        return;
      }

      const headers = Object.keys(rows[0]);

      const findColumn = (aliases: string[]) => {
        const normalizedAliases =
          aliases.map(normalizeHeader);

        return headers.find((header) =>
          normalizedAliases.includes(
            normalizeHeader(header)
          )
        );
      };

      const nameColumn = findColumn([
        'Nom',
        'Nom complet',
        'Nom et prénom',
        'Name',
        'Teacher',
        'Teacher name',
        'Full name',
        'الأستاذ',
        'اسم الأستاذ',
        'اسم',
        'الاسم',
        'الاسم الكامل',
      ]);

      const subjectColumn = findColumn([
        'Matière',
        'Matiere',
        'Subject',
        'Discipline',
        'المادة',
        'مادة',
        'المادة الدراسية',
      ]);

      if (!nameColumn) {
        alert(
          'لم أجد عمود اسم الأستاذ. يجب أن يحتوي النموذج على عمود "Nom".'
        );
        return;
      }

      if (!subjectColumn) {
        alert(
          'لم أجد عمود المادة. يجب أن يحتوي النموذج على عمود "Matière".'
        );
        return;
      }

      if (!subjects.length) {
        alert(
          'لا توجد مواد في التطبيق. أضف المواد أولاً.'
        );
        return;
      }

      const subjectByKey = new Map<string, Subject>();

      subjects.forEach((subject) => {
        subjectByKey.set(
          normalizeText(subject.name),
          subject
        );

        subjectByKey.set(
          normalizeText(subject.code),
          subject
        );
      });

      // نبحث عن الأساتذة الموجودين مسبقا
      // بالاسم فقط لأن المستخدم لا يحتاج لكتابة Code
      const teachersByName = new Map<
        string,
        Teacher
      >();

      teachers.forEach((teacher) => {
        teachersByName.set(
          normalizeText(teacher.name),
          teacher
        );
      });

      const updatedTeachers = [...teachers];

      const importedNames = new Set<string>();
      const skipped: string[] = [];
      const unknownSubjects: string[] = [];

      rows.forEach((row, index) => {
        const name = String(
          row[nameColumn] ?? ''
        ).trim();

        const subjectValue = String(
          row[subjectColumn] ?? ''
        ).trim();

        // السطر فارغ بالكامل
        if (!name && !subjectValue) {
          return;
        }

        // المادة ناقصة
        if (!subjectValue) {
          skipped.push(
            `السطر ${index + 2}: المادة فارغة`
          );
          return;
        }

        // الاسم ناقص
        if (!name) {
          skipped.push(
            `السطر ${index + 2}: اسم الأستاذ فارغ`
          );
          return;
        }

        const subject =
          subjectByKey.get(
            normalizeText(subjectValue)
          );

        if (!subject) {
          unknownSubjects.push(
            `${subjectValue} (السطر ${index + 2})`
          );
          return;
        }

        const nameKey = normalizeText(name);

        let teacher =
          teachersByName.get(nameKey);

        if (!teacher) {
          teacher = {
            id: `t-${Date.now()}-${index}`,
            code: `ENS-${String(
              teachers.length + updatedTeachers.length + 1
            ).padStart(3, '0')}`,
            name,
            subjectIds: [],
            unavailableSlots: [],
          };

          updatedTeachers.push(teacher);
          teachersByName.set(
            nameKey,
            teacher
          );
        }

        // إضافة المادة للأستاذ بدون تكرار
        if (
          !teacher.subjectIds.includes(
            subject.id
          )
        ) {
          teacher.subjectIds = [
            ...teacher.subjectIds,
            subject.id,
          ];
        }

        importedNames.add(nameKey);
      });

      if (!importedNames.size) {
        let message =
          'لم تتم إضافة أي أستاذ.';

        if (skipped.length) {
          message +=
            `\n\nالأسطر المتجاوزة:\n${skipped.join(
              '\n'
            )}`;
        }

        if (unknownSubjects.length) {
          message +=
            `\n\nمواد غير موجودة في التطبيق:\n${unknownSubjects.join(
              '\n'
            )}`;
        }

        alert(message);
        return;
      }

      onUpdateTeachers(updatedTeachers);

      let message = `تم استيراد/تحديث ${importedNames.size} أستاذ بنجاح.`;

      if (skipped.length) {
        message += `\nتم تجاوز ${skipped.length} سطر.`;
      }

      if (unknownSubjects.length) {
        message +=
          `\nلم يتم ربط ${unknownSubjects.length} سطر لأن المادة غير موجودة في التطبيق.`;
      }

      alert(message);
    } catch (error) {
      console.error(
        'Excel teacher import error:',
        error
      );

      alert(
        'تعذر قراءة ملف Excel. تأكد أنه بصيغة .xlsx أو .xls وأن الأعمدة هي: Matière و Nom.'
      );
    }
  };

  // =========================================================
  // CLASS HANDLERS
  // =========================================================

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();

    if (!classCode.trim() || !className.trim()) {
      return;
    }

    const newClass: ClassGroup = {
      id: `cls-${Date.now()}`,
      code: classCode.trim(),
      name: className.trim(),
      gradeLevel: '1',
      studentCount: 30,
    };

    onUpdateClasses([...classes, newClass]);

    setClassCode('');
    setClassName('');
  };

  const handleEditClass = (
    classGroup: ClassGroup
  ) => {
    const name = window.prompt(
      'اسم الفصل:',
      classGroup.name
    );

    if (name === null) return;

    const code = window.prompt(
      'رمز الفصل:',
      classGroup.code
    );

    if (code === null) return;

    const gradeLevel = window.prompt(
      'المستوى الدراسي:',
      classGroup.gradeLevel
    );

    if (gradeLevel === null) return;

    const studentCountValue =
      window.prompt(
        'عدد التلاميذ:',
        String(classGroup.studentCount)
      );

    if (studentCountValue === null) return;

    const studentCount =
      Number(studentCountValue);

    if (
      !name.trim() ||
      !code.trim() ||
      !gradeLevel.trim() ||
      !Number.isFinite(studentCount)
    ) {
      return;
    }

    onUpdateClasses(
      classes.map((item) =>
        item.id === classGroup.id
          ? {
              ...item,
              name: name.trim(),
              code: code.trim(),
              gradeLevel:
                gradeLevel.trim(),
              studentCount: Math.max(
                1,
                Math.round(studentCount)
              ),
            }
          : item
      )
    );
  };

  const handleDeleteClass = (
    id: string
  ) => {
    const removedLessonIds = new Set(
      lessons
        .filter(
          (lesson) =>
            lesson.classGroupId === id
        )
        .map((lesson) => lesson.id)
    );

    onUpdateClasses(
      classes.filter(
        (cls) => cls.id !== id
      )
    );

    onUpdateLessons(
      lessons.filter(
        (lesson) =>
          lesson.classGroupId !== id
      )
    );

    onUpdatePlacements(
      placements.filter(
        (placement) =>
          !removedLessonIds.has(
            placement.lessonId
          )
      )
    );

    if (lsnClassId === id) {
      setLsnClassId('');
    }
  };

  // =========================================================
  // ROOM HANDLERS
  // =========================================================

  const handleAddRoom = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !roomCode.trim() ||
      !roomName.trim()
    ) {
      return;
    }

    const newRoom: Classroom = {
      id: `room-${Date.now()}`,
      code: roomCode.trim(),
      name: roomName.trim(),
      capacity: 35,
      type: 'standard',
    };

    onUpdateRooms([
      ...rooms,
      newRoom,
    ]);

    setRoomCode('');
    setRoomName('');
  };

  const handleEditRoom = (
    room: Classroom
  ) => {
    const name = window.prompt(
      'اسم القاعة:',
      room.name
    );

    if (name === null) return;

    const code = window.prompt(
      'رمز القاعة:',
      room.code
    );

    if (code === null) return;

    const capacityValue =
      window.prompt(
        'طاقة الاستيعاب:',
        String(room.capacity)
      );

    if (capacityValue === null) {
      return;
    }

    const type = window.prompt(
      'نوع القاعة (standard / lab / gym / computer):',
      room.type
    );

    if (type === null) return;

    const capacity =
      Number(capacityValue);

    const normalizedType =
      type.trim();

    const allowedTypes =
      new Set([
        'standard',
        'lab',
        'gym',
        'computer',
      ]);

    if (
      !name.trim() ||
      !code.trim() ||
      !Number.isFinite(capacity) ||
      !allowedTypes.has(
        normalizedType
      )
    ) {
      return;
    }

    onUpdateRooms(
      rooms.map((item) =>
        item.id === room.id
          ? {
              ...item,
              name: name.trim(),
              code: code.trim(),
              capacity: Math.max(
                1,
                Math.round(capacity)
              ),
              type:
                normalizedType as Classroom['type'],
            }
          : item
      )
    );
  };

  const handleDeleteRoom = (
    id: string
  ) => {
    onUpdateRooms(
      rooms.filter(
        (room) => room.id !== id
      )
    );

    onUpdateClasses(
      classes.map((cls) =>
        cls.homeRoomId === id
          ? {
              ...cls,
              homeRoomId: undefined,
            }
          : cls
      )
    );

    onUpdateLessons(
      lessons.map((lesson) =>
        lesson.preferredRoomId === id
          ? {
              ...lesson,
              preferredRoomId:
                undefined,
            }
          : lesson
      )
    );

    onUpdatePlacements(
      placements.map((placement) =>
        placement.roomId === id
          ? {
              ...placement,
              roomId: undefined,
            }
          : placement
      )
    );
  };

  // =========================================================
  // FILTER TEACHERS BY SELECTED SUBJECT
  //
  // هذا هو الجزء المهم:
  // اختيار مادة => يظهرون فقط أساتذة المادة
  // =========================================================

  const filteredTeachersForLesson =
    useMemo(() => {
      if (!lsnSubjectId) {
        return [];
      }

      return teachers.filter(
        (teacher) =>
          Array.isArray(
            teacher.subjectIds
          ) &&
          teacher.subjectIds.includes(
            lsnSubjectId
          )
      );
    }, [
      teachers,
      lsnSubjectId,
    ]);

  // =========================================================
  // WHEN SUBJECT CHANGES
  //
  // إذا الأستاذ الحالي لا يدرس المادة الجديدة
  // يتم مسحه
  // =========================================================

  const handleLessonSubjectChange = (
    subjectId: string
  ) => {
    setLsnSubjectId(subjectId);

    if (!subjectId) {
      setLsnTeacherId('');
      return;
    }

    const currentTeacher =
      teachers.find(
        (teacher) =>
          teacher.id ===
          lsnTeacherId
      );

    if (
      !currentTeacher ||
      !currentTeacher.subjectIds.includes(
        subjectId
      )
    ) {
      setLsnTeacherId('');
    }
  };

  // =========================================================
  // LESSON HANDLERS
  // =========================================================

  const handleAddLesson = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !lsnClassId ||
      !lsnSubjectId ||
      !lsnTeacherId
    ) {
      return;
    }

    // حماية إضافية:
    // لا يمكن إضافة أستاذ لا يدرس المادة
    const selectedTeacher =
      teachers.find(
        (teacher) =>
          teacher.id ===
          lsnTeacherId
      );

    if (
      !selectedTeacher ||
      !selectedTeacher.subjectIds.includes(
        lsnSubjectId
      )
    ) {
      alert(
        'هذا الأستاذ لا يدرّس المادة المختارة.'
      );

      setLsnTeacherId('');
      return;
    }

    const newLesson: Lesson = {
      id: `lsn-${Date.now()}`,
      classGroupId: lsnClassId,
      subjectId: lsnSubjectId,
      teacherId: lsnTeacherId,
      weeklyPeriods: Math.max(
        1,
        Math.round(lsnHours)
      ),
      isDoublePeriod:
        lsnIsDoublePeriod,
    };

    onUpdateLessons([
      ...lessons,
      newLesson,
    ]);

    // نترك الفصل والمادة والأستاذ
    // كما هي لتسهيل إضافة حصة أخرى
  };

  const handleEditLesson = (
    lesson: Lesson
  ) => {
    const weeklyPeriodsValue =
      window.prompt(
        'عدد الحصص الأسبوعية:',
        String(lesson.weeklyPeriods)
      );

    if (
      weeklyPeriodsValue === null
    ) {
      return;
    }

    const weeklyPeriods =
      Number(weeklyPeriodsValue);

    if (
      !Number.isFinite(
        weeklyPeriods
      )
    ) {
      return;
    }

    const isDouble =
      window.confirm(
        lesson.isDoublePeriod
          ? 'الحصة مزدوجة حالياً.\n\nاضغط "موافق" لتحويلها إلى منفردة.\nاضغط "إلغاء" للإبقاء عليها مزدوجة.'
          : 'هل تريد جعل الحصة مزدوجة (ساعتان متتاليتان)؟'
      );

    onUpdateLessons(
      lessons.map((item) =>
        item.id === lesson.id
          ? {
              ...item,
              weeklyPeriods:
                Math.max(
                  1,
                  Math.round(
                    weeklyPeriods
                  )
                ),
              isDoublePeriod:
                lesson.isDoublePeriod
                  ? !isDouble
                  : isDouble,
            }
          : item
      )
    );
  };

  const handleDeleteLesson = (
    id: string
  ) => {
    onUpdateLessons(
      lessons.filter(
        (lesson) =>
          lesson.id !== id
      )
    );

    onUpdatePlacements(
      placements.filter(
        (placement) =>
          placement.lessonId !== id
      )
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-300">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#20518D] to-[#2B68B1] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <Edit2 className="w-5 h-5 text-amber-300" />
            <span>
              إدارة البيانات الأساسية للمؤسسة
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-1 bg-slate-100 p-2 border-b border-slate-200 text-xs font-bold overflow-x-auto">

          <button
            onClick={() =>
              setCurrentTab('subjects')
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition cursor-pointer whitespace-nowrap ${
              currentTab === 'subjects'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>
              المواد الدراسية ({subjects.length})
            </span>
          </button>

          <button
            onClick={() =>
              setCurrentTab('teachers')
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition cursor-pointer whitespace-nowrap ${
              currentTab === 'teachers'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>
              الأساتذة ({teachers.length})
            </span>
          </button>

          <button
            onClick={() =>
              setCurrentTab('classes')
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition cursor-pointer whitespace-nowrap ${
              currentTab === 'classes'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <School className="w-4 h-4 text-violet-600" />
            <span>
              الفصول/الشعب ({classes.length})
            </span>
          </button>

          <button
            onClick={() =>
              setCurrentTab('rooms')
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition cursor-pointer whitespace-nowrap ${
              currentTab === 'rooms'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DoorOpen className="w-4 h-4 text-orange-600" />
            <span>
              القاعات ({rooms.length})
            </span>
          </button>

          <button
            onClick={() =>
              setCurrentTab('lessons')
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition cursor-pointer whitespace-nowrap ${
              currentTab === 'lessons'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
            title="إضافة حصة"
          >
            <ListPlus className="w-4 h-4 text-sky-600" />
            <span>
              إضافة حصة
            </span>
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-800">

          {/* =================================================
              SUBJECTS
          ================================================= */}

          {currentTab === 'subjects' && (
            <div className="space-y-4">

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />

                  <div>
                    <span className="font-extrabold text-xs text-emerald-950 block">
                      مواد المنهاج الدراسي المغربي الرسمي
                    </span>

                    <span className="text-[11px] text-emerald-800">
                      تحميل قائمة المواد المعتمدة تلقائياً.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSubjects(
                      moroccanCurriculumSubjects
                    )
                  }
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded flex items-center gap-1 shadow-2xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />

                  <span>
                    تحميل كافة المواد المعتمدة
                  </span>
                </button>
              </div>

              <form
                onSubmit={handleAddSubject}
                className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap gap-3 items-end"
              >
                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    رمز المادة:
                  </label>

                  <input
                    type="text"
                    placeholder="مثال: MATH"
                    value={subCode}
                    onChange={(e) =>
                      setSubCode(
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex-[2] min-w-[180px]">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    اسم المادة الكامل:
                  </label>

                  <input
                    type="text"
                    placeholder="مثال: الرياضيات"
                    value={subName}
                    onChange={(e) =>
                      setSubName(
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    لون المادة:
                  </label>

                  <input
                    type="color"
                    value={subColor}
                    onChange={(e) =>
                      setSubColor(
                        e.target.value
                      )
                    }
                    className="w-12 h-8 rounded border border-slate-300 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  إضافة مادة
                </button>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between"
                    style={{
                      borderRightWidth:
                        '6px',
                      borderRightColor:
                        sub.color,
                    }}
                  >
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">
                        {sub.code}
                      </div>

                      <div className="text-[11px] text-slate-500">
                        {sub.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleEditSubject(
                            sub
                          )
                        }
                        className="text-slate-400 hover:text-blue-600 p-1 transition cursor-pointer"
                        title="تعديل المادة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteSubject(
                            sub.id
                          )
                        }
                        className="text-slate-400 hover:text-red-600 p-1 transition cursor-pointer"
                        title="حذف المادة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================
              TEACHERS
          ================================================= */}

          {currentTab === 'teachers' && (
            <div className="space-y-4">

              <div className="bg-teal-50 border border-teal-200 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3">

                <div>
                  <span className="font-extrabold text-xs text-teal-950 block">
                    إضافة واستيراد الأساتذة حسب المواد
                  </span>

                  <span className="text-[11px] text-teal-800">
                    نموذج Excel يحتوي على المواد تلقائياً، والمستخدم يكتب أسماء الأساتذة فقط.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">

                  <input
                    ref={teacherFileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={
                      handleImportTeachersExcel
                    }
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      teacherFileInputRef.current?.click()
                    }
                    className="bg-white hover:bg-teal-50 text-teal-800 font-bold text-xs px-3 py-2 rounded border border-teal-300 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <span className="text-sm">
                      📥
                    </span>

                    <span>
                      استيراد من Excel
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleDownloadTeacherTemplate
                    }
                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3 py-2 rounded border border-slate-300 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <span className="text-sm">
                      📄
                    </span>

                    <span>
                      تحميل نموذج Excel
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveTeacherForAssignment(
                        'new'
                      )
                    }
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />

                    <span>
                      إضافة أستاذ وتعيين الفصول
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                <div className="font-extrabold mb-1">
                  طريقة استعمال نموذج Excel
                </div>

                <div>
                  حمّل النموذج، ستجد المواد معبأة تلقائياً.
                  اكتب فقط اسم الأستاذ أمام المادة التي يدرسها.
                  يمكن تكرار نفس الأستاذ في أكثر من مادة.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">

                {teachers.map((t) => {
                  const teacherLessons =
                    lessons.filter(
                      (l) =>
                        l.teacherId ===
                        t.id
                    );

                  const assignedClassesCount =
                    new Set(
                      teacherLessons.map(
                        (l) =>
                          l.classGroupId
                      )
                    ).size;

               const totalWeeklyHours =
  teacherLessons.reduce(
    (sum, l) =>
      sum +
      (l.weeklyPeriods || 0) *
        (l.isDoublePeriod ? 2 : 1),
    0
  );

                  const hasGroupSplit =
                    teacherLessons.some(
                      (l) =>
                        l.groupType ===
                          'G1' ||
                        l.groupType ===
                          'G2'
                    );

                  const hasDouble =
                    teacherLessons.some(
                      (l) =>
                        l.isDoublePeriod
                    );

                  const teacherSubjects =
                    subjects.filter(
                      (subject) =>
                        t.subjectIds.includes(
                          subject.id
                        )
                    );

                  return (
                    <div
                      key={t.id}
                      className="p-3 bg-white rounded-lg border border-slate-300 shadow-2xs flex flex-col justify-between gap-2.5"
                    >
                      <div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">

                          <div>
                            <div className="font-extrabold text-xs text-teal-950">
                              {t.code}
                            </div>

                            <div className="text-[11px] font-bold text-slate-700">
                              {t.name}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleDeleteTeacher(
                                t.id
                              )
                            }
                            className="text-slate-400 hover:text-red-600 p-1 transition cursor-pointer"
                            title="حذف الأستاذ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* SUBJECT BADGES */}

                        {teacherSubjects.length >
                          0 && (
                          <div className="flex flex-wrap gap-1 mt-2">

                            {teacherSubjects.map(
                              (subject) => (
                                <span
                                  key={
                                    subject.id
                                  }
                                  className="bg-indigo-50 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200"
                                >
                                  {subject.code}
                                </span>
                              )
                            )}

                          </div>
                        )}

                        {/* SUMMARY */}

                        <div className="flex flex-wrap gap-1 mt-2">

                          <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                            {assignedClassesCount}{' '}
                            فصول مسندة
                          </span>

                          <span className="bg-blue-50 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                            {totalWeeklyHours}{' '}
                            ساعة/أسبوع
                          </span>

                          {hasDouble && (
                            <span className="bg-amber-50 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                              حصة مزدوجة
                            </span>
                          )}

                          {hasGroupSplit && (
                            <span className="bg-emerald-50 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                              مفوج
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">

                        <button
                          type="button"
                          onClick={() =>
                            setActiveTeacherForAssignment(
                              t
                            )
                          }
                          className="flex-1 text-teal-800 bg-teal-50 hover:bg-teal-100 py-1.5 rounded text-[11px] font-bold border border-teal-200 flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-teal-700" />

                          <span>
                            تعديل الفصول والحصص
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingTeacherForAvailability(
                              t
                            )
                          }
                          className="text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1.5 rounded text-[11px] font-bold border border-amber-200 flex items-center gap-1 transition cursor-pointer"
                          title="تحديد أوقات التفرغ"
                        >
                          <CalendarX className="w-3.5 h-3.5" />

                          <span>
                            التفرغات
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TEACHER ASSIGNMENT */}

              {activeTeacherForAssignment && (
                <TeacherAssignModal
                  teacher={
                    activeTeacherForAssignment ===
                    'new'
                      ? null
                      : activeTeacherForAssignment
                  }
                  subjects={subjects}
                  classes={classes}
                  existingLessons={lessons}
                  onClose={() =>
                    setActiveTeacherForAssignment(
                      null
                    )
                  }
                  onSaveTeacherAndLessons={(
                    savedTeacher,
                    newTeacherLessons
                  ) => {
                    const existingIdx =
                      teachers.findIndex(
                        (t) =>
                          t.id ===
                          savedTeacher.id
                      );

                    if (existingIdx >= 0) {
                      onUpdateTeachers(
                        teachers.map(
                          (t) =>
                            t.id ===
                            savedTeacher.id
                              ? savedTeacher
                              : t
                        )
                      );
                    } else {
                      onUpdateTeachers([
                        ...teachers,
                        savedTeacher,
                      ]);
                    }

                    const otherLessons =
                      lessons.filter(
                        (l) =>
                          l.teacherId !==
                          savedTeacher.id
                      );

                    onUpdateLessons([
                      ...otherLessons,
                      ...newTeacherLessons,
                    ]);
                  }}
                />
              )}

              {/* AVAILABILITY */}

              {editingTeacherForAvailability && (
                <TeacherAvailabilityModal
                  teacher={
                    editingTeacherForAvailability
                  }
                  config={config}
                  onClose={() =>
                    setEditingTeacherForAvailability(
                      null
                    )
                  }
                  onSave={(updated) => {
                    onUpdateTeachers(
                      teachers.map(
                        (t) =>
                          t.id ===
                          updated.id
                            ? updated
                            : t
                      )
                    );
                  }}
                />
              )}
            </div>
          )}

          {/* =================================================
              CLASSES
          ================================================= */}

          {currentTab === 'classes' && (
            <div className="space-y-4">

              <form
                onSubmit={handleAddClass}
                className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap gap-3 items-end"
              >
                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    رمز الفصل:
                  </label>

                  <input
                    type="text"
                    placeholder="مثال: 1APIC"
                    value={classCode}
                    onChange={(e) =>
                      setClassCode(
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex-[2] min-w-[180px]">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    اسم الفصل الكامل:
                  </label>

                  <input
                    type="text"
                    placeholder="مثال: الأولى إعدادي - 1"
                    value={className}
                    onChange={(e) =>
                      setClassName(
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  إضافة فصل
                </button>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">

                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-xs text-violet-900">
                        {cls.code}
                      </div>

                      <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                        {cls.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">

                      <button
                        type="button"
                        onClick={() =>
                          handleEditClass(
                            cls
                          )
                        }
                        className="text-slate-400 hover:text-blue-600 p-1 transition"
                        title="تعديل الفصل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteClass(
                            cls.id
                          )
                        }
                        className="text-slate-400 hover:text-red-600 p-1 transition"
                        title="حذف الفصل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================
              ROOMS
          ================================================= */}

          {currentTab === 'rooms' && (
            <div className="space-y-4">

              <form
                onSubmit={handleAddRoom}
                className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap gap-3 items-end"
              >

                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    رمز القاعة:
                  </label>

                  <input
                    type="text"
                    placeholder="مثال: ق 01"
                    value={roomCode}
                    onChange={(e) =>
                      setRoomCode(
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex-[2] min-w-[180px]">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    اسم القاعة الكامل:
                  </label>

                  <input
                    type="text"
                    placeholder="مثال: قاعة 1"
                    value={roomName}
                    onChange={(e) =>
                      setRoomName(
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  إضافة قاعة
                </button>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">

                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-xs text-orange-900">
                        {r.code}
                      </div>

                      <div className="text-[10px] text-slate-500">
                        {r.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">

                      <button
                        type="button"
                        onClick={() =>
                          handleEditRoom(r)
                        }
                        className="text-slate-400 hover:text-blue-600 p-1 transition"
                        title="تعديل القاعة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteRoom(
                            r.id
                          )
                        }
                        className="text-slate-400 hover:text-red-600 p-1 transition"
                        title="حذف القاعة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================
              LESSONS
          ================================================= */}

          {currentTab === 'lessons' && (
            <div className="space-y-4">

              <form
                onSubmit={handleAddLesson}
                className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap gap-3 items-end"
              >

                {/* CLASS */}

                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    الفصل:
                  </label>

                  <select
                    value={lsnClassId}
                    onChange={(e) =>
                      setLsnClassId(
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                    required
                  >
                    <option value="">
                      اختر الفصل...
                    </option>

                    {classes.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                      >
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUBJECT */}

                <div className="flex-1 min-w-[150px]">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    المادة:
                  </label>

                  <select
                    value={lsnSubjectId}
                    onChange={(e) =>
                      handleLessonSubjectChange(
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                    required
                  >
                    <option value="">
                      اختر المادة...
                    </option>

                    {subjects.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                      >
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* TEACHER */}

                <div className="flex-1 min-w-[170px]">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    الأستاذ:
                  </label>

                  <select
                    value={lsnTeacherId}
                    onChange={(e) =>
                      setLsnTeacherId(
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white disabled:bg-slate-100"
                    required
                    disabled={
                      !lsnSubjectId
                    }
                  >
                    <option value="">
                      {!lsnSubjectId
                        ? 'اختر المادة أولاً...'
                        : filteredTeachersForLesson.length ===
                            0
                          ? 'لا يوجد أستاذ لهذه المادة'
                          : 'اختر الأستاذ...'}
                    </option>

                    {filteredTeachersForLesson.map(
                      (t) => (
                        <option
                          key={t.id}
                          value={t.id}
                        >
                          {t.name} ({t.code})
                        </option>
                      )
                    )}
                  </select>

                  {lsnSubjectId && (
                    <div className="mt-1 text-[10px] font-bold text-slate-500">
                      {filteredTeachersForLesson.length}{' '}
                      أستاذ مرتبط بهذه المادة
                    </div>
                  )}
                </div>

                {/* NUMBER OF PERIODS */}

                <div className="w-24">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    عدد الحصص:
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={lsnHours}
                    onChange={(e) =>
                      setLsnHours(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded"
                    required
                  />
                </div>

                {/* TYPE */}

                <div className="w-28">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    نوع الحصة:
                  </label>

                  <select
                    value={
                      lsnIsDoublePeriod
                        ? 'double'
                        : 'single'
                    }
                    onChange={(e) =>
                      setLsnIsDoublePeriod(
                        e.target.value ===
                          'double'
                      )
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="single">
                      منفردة
                    </option>

                    <option value="double">
                      مزدوجة
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={
                    !lsnClassId ||
                    !lsnSubjectId ||
                    !lsnTeacherId
                  }
                  className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  إضافة حصة
                </button>
              </form>

              {/* LESSONS TABLE */}

              <div className="overflow-x-auto border border-slate-200 rounded-lg">

                <table className="w-full text-right text-xs">

                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">
                        الفصل
                      </th>

                      <th className="p-2.5">
                        المادة
                      </th>

                      <th className="p-2.5">
                        الأستاذ
                      </th>

                      <th className="p-2.5 text-center">
                        الحصص الأسبوعية
                      </th>

                      <th className="p-2.5 text-center">
                        نوع الحصة
                      </th>
                        <th className="p-2.5 text-center">
                       عدد الساعات
                      </th>


                      <th className="p-2.5 text-center">
                        إجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {lessons.map(
                      (lsn) => {
                        const c =
                          classes.find(
                            (item) =>
                              item.id ===
                              lsn.classGroupId
                          );

                        const s =
                          subjects.find(
                            (item) =>
                              item.id ===
                              lsn.subjectId
                          );

                        const t =
                          teachers.find(
                            (item) =>
                              item.id ===
                              lsn.teacherId
                          );

                        return (
                          <tr
                            key={lsn.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >

                            <td className="p-2.5 font-bold text-violet-900">
                              {c?.code ||
                                '---'}
                            </td>

                            <td
                              className="p-2.5 font-bold"
                              style={{
                                color:
                                  s?.color &&
                                  s.color !==
                                    '#E5E7EB'
                                    ? s.color
                                    : '#111827',
                              }}
                            >
                              {s?.name ||
                                '---'}{' '}
                              ({s?.code})
                            </td>

                            <td className="p-2.5 font-medium">
                              {t?.name ||
                                '---'}
                            </td>

                            <td className="p-2.5 text-center font-extrabold">
                              {lsn.weeklyPeriods}
                            </td>

                            <td className="p-2.5 text-center">

                              <span
                                className={`inline-flex px-2 py-1 rounded-full font-bold ${
                                  lsn.isDoublePeriod
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {lsn.isDoublePeriod
                                  ? 'مزدوجة'
                                  : 'منفردة'}
                              </span>

                            </td>

                          <td className="p-2.5 text-center font-extrabold text-blue-900">
  {(lsn.weeklyPeriods || 0) *
    (lsn.isDoublePeriod ? 2 : 1)}
</td>
                             <td className="p-2.5 text-center">

                              <div className="flex items-center justify-center gap-1">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditLesson(
                                      lsn
                                    )
                                  }
                                  className="text-slate-400 hover:text-blue-600 p-1"
                                  title="تعديل الحصة"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteLesson(
                                      lsn.id
                                    )
                                  }
                                  className="text-slate-400 hover:text-red-600 p-1"
                                  title="حذف الحصة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded shadow-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};