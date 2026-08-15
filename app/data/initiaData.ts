import { Subject, Teacher, ClassGroup, Classroom, Lesson, Placement, TimetableConfig } from '../types';

export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, August is month 7
  if (month >= 7) {
    return `${year} - ${year + 1}`;
  } else {
    return `${year - 1} - ${year}`;
  }
}

export const defaultConfig: TimetableConfig = {
  schoolName: 'مؤسسة السلام التعليمية',
  academicYear: getCurrentAcademicYear(),
  days: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
  periods: [
    { periodIndex: 0, label: '8:30-9:30', startTime: '08:30', endTime: '09:30' },
    { periodIndex: 1, label: '9:30-10:30', startTime: '09:30', endTime: '10:30' },
    { periodIndex: 2, label: '10:30-11:30', startTime: '10:30', endTime: '11:30' },
    { periodIndex: 3, label: '11:30-12:30', startTime: '11:30', endTime: '12:30' },
    { periodIndex: 4, label: '14:30-15:30', startTime: '14:30', endTime: '15:30' },
    { periodIndex: 5, label: '15:30-16:30', startTime: '15:30', endTime: '16:30' },
    { periodIndex: 6, label: '16:30-17:30', startTime: '16:30', endTime: '17:30' },
  ],
};

export const moroccanCurriculumSubjects: Subject[] = [
  { id: 'sub-ar', code: 'AR', name: 'اللغة العربية', color: '#10B981', textColor: '#FFFFFF', defaultWeeklyHours: 4 },
  { id: 'sub-fr', code: 'FR', name: 'اللغة الفرنسية', color: '#3B82F6', textColor: '#FFFFFF', defaultWeeklyHours: 4 },
  { id: 'sub-math', code: 'MATH', name: 'الرياضيات', color: '#F59E0B', textColor: '#FFFFFF', defaultWeeklyHours: 5 },
  { id: 'sub-pc', code: 'PC', name: 'الفيزياء والكيمياء', color: '#8B5CF6', textColor: '#FFFFFF', defaultWeeklyHours: 4 },
  { id: 'sub-svt', code: 'SVT', name: 'علوم الحياة والأرض', color: '#059669', textColor: '#FFFFFF', defaultWeeklyHours: 3 },
  { id: 'sub-hg', code: 'HG', name: 'التاريخ والجغرافيا', color: '#D97706', textColor: '#FFFFFF', defaultWeeklyHours: 3 },
  { id: 'sub-ei', code: 'EI', name: 'التربية الإسلامية', color: '#047857', textColor: '#FFFFFF', defaultWeeklyHours: 2 },
  { id: 'sub-ang', code: 'ANG', name: 'اللغة الإنجليزية', color: '#2563EB', textColor: '#FFFFFF', defaultWeeklyHours: 3 },
  { id: 'sub-eps', code: 'EPS', name: 'التربية البدنية والرياضية', color: '#DC2626', textColor: '#FFFFFF', defaultWeeklyHours: 2 },
  { id: 'sub-ph', code: 'PH', name: 'الفلسفة', color: '#7C3AED', textColor: '#FFFFFF', defaultWeeklyHours: 2 },
  { id: 'sub-info', code: 'INFO', name: 'المعلوميات والتكنولوجيا', color: '#0284C7', textColor: '#FFFFFF', defaultWeeklyHours: 2 },
  { id: 'sub-amz', code: 'AMZ', name: 'اللغة الأمازيغية', color: '#EA580C', textColor: '#FFFFFF', defaultWeeklyHours: 3 },
  { id: 'sub-art', code: 'ART', name: 'التربية الفنية والموسيقية', color: '#EC4899', textColor: '#FFFFFF', defaultWeeklyHours: 2 },
  { id: 'sub-eng', code: 'ENG', name: 'علوم المهندس', color: '#4B5563', textColor: '#FFFFFF', defaultWeeklyHours: 3 },
];

export const initialSubjects: Subject[] = moroccanCurriculumSubjects;

export const initialClassGroups: ClassGroup[] = [
  { id: 'cls-1apic', code: '1APIC', name: 'الأولى ثانوي إعدادي', gradeLevel: '1', studentCount: 32 },
  { id: 'cls-2apic', code: '2APIC', name: 'الثانية ثانوي إعدادي', gradeLevel: '2', studentCount: 34 },
  { id: 'cls-3apic1', code: '3APIC1', name: 'الثالثة إعدادي - فوج 1', gradeLevel: '3', studentCount: 30 },
  { id: 'cls-3apic2', code: '3APIC2', name: 'الثالثة إعدادي - فوج 2', gradeLevel: '3', studentCount: 30 },
  { id: 'cls-tc', code: 'TC', name: 'الجذع المشترك العلمي', gradeLevel: 'TC', studentCount: 35 },
  { id: 'cls-1bac', code: '1BAC', name: 'الأولى بكالوريا علوم', gradeLevel: '1BAC', studentCount: 33 },
  { id: 'cls-2bac-svt', code: '2BAC/SVT', name: 'الثانية بكالوريا علوم الحياة والأرض', gradeLevel: '2BAC', studentCount: 28 },
  { id: 'cls-2bac-pc', code: '2BAC/PC', name: 'الثانية بكالوريا علوم فيزيائية', gradeLevel: '2BAC', studentCount: 29 },
];

export const initialClassrooms: Classroom[] = [
  { id: 'room-1', code: 'ق 01', name: 'قاعة 1', capacity: 36, type: 'standard' },
  { id: 'room-2', code: 'ق 02', name: 'قاعة 2', capacity: 36, type: 'standard' },
  { id: 'room-3', code: 'ق 03', name: 'قاعة 3', capacity: 36, type: 'standard' },
  { id: 'room-pc', code: 'م فيزياء', name: 'مختبر الفيزياء', capacity: 32, type: 'lab' },
  { id: 'room-svt', code: 'م علوم', name: 'مختبر العلوم', capacity: 32, type: 'lab' },
  { id: 'room-gym', code: 'م الرياضة', name: 'الملعب الرياضي', capacity: 50, type: 'gym' },
];

export const initialTeachers: Teacher[] = [
  { id: 't-math1', code: 'أ.العلمي', name: 'أستاذ العلمِي (رياضيات)', subjectIds: ['sub-math'], unavailableSlots: [] },
  { id: 't-math2', code: 'أ.التازي', name: 'أستاذ التازي (رياضيات)', subjectIds: ['sub-math'], unavailableSlots: [] },
  { id: 't-pc1', code: 'أ.العلوي', name: 'أستاذ العلوي (فيزياء)', subjectIds: ['sub-pc'], unavailableSlots: [] },
  { id: 't-fr1', code: 'أ.بناني', name: 'أستاذة بناني (فرنسية)', subjectIds: ['sub-fr'], unavailableSlots: [] },
  { id: 't-ar1', code: 'أ.المرابط', name: 'أستاذ المرابط (عربية)', subjectIds: ['sub-ar'], unavailableSlots: [] },
  { id: 't-ang1', code: 'أ.جون', name: 'أستاذ جون (إنجليزية)', subjectIds: ['sub-ang'], unavailableSlots: [] },
  { id: 't-hg1', code: 'أ.الفاسي', name: 'أستاذ الفاسي (اجتماعيات)', subjectIds: ['sub-hg'], unavailableSlots: [] },
  { id: 't-svt1', code: 'أ.شفيق', name: 'أستاذة شفيق (علوم)', subjectIds: ['sub-svt'], unavailableSlots: [] },
  { id: 't-eps1', code: 'أ.الادريسي', name: 'أستاذ الإدريسي (رياضة)', subjectIds: ['sub-eps'], unavailableSlots: [] },
  { id: 't-ph1', code: 'أ.السوسي', name: 'أستاذ السوسي (فلسفة)', subjectIds: ['sub-ph'], unavailableSlots: [] },
  { id: 't-ei1', code: 'أ.اليعقوبي', name: 'أستاذ اليعقوبي (تربية إسلامية)', subjectIds: ['sub-ei'], unavailableSlots: [] },
];

// Helper to construct sample initial lessons and placements based on screenshot
export function buildInitialLessonsAndPlacements(): { lessons: Lesson[]; placements: Placement[] } {
  const lessons: Lesson[] = [];
  const placements: Placement[] = [];

  // Define grid structure matching screenshot exactly:
  // Screenshot grid columns:
  // Day Index 0: الاثنين (Monday) - slots 0 to 6
  // Day Index 1: الثلاثاء (Tuesday) - slots 0 to 6
  // Day Index 2: الأربعاء (Wednesday) - slots 0 to 6
  // Day Index 3: الخميس (Thursday) - slots 0 to 6
  // Day Index 4: الجمعة (Friday) - slots 0 to 6

  // Sample mappings for exact grid rows from screenshot:
  // Row 0: 1APIC
  // Row 1: 2APIC
  // Row 2: 3APIC1
  // Row 3: 3APIC2
  // Row 4: TC
  // Row 5: 1BAC
  // Row 6: 2BAC/SVT
  // Row 7: 2BAC/PC

  const gridData: { classCode: string; dayIndex: number; periodIndex: number; subjectCode: string; teacherId: string }[] = [
    // الاثنين (Day 0)
    { classCode: '1APIC', dayIndex: 0, periodIndex: 0, subjectCode: 'EI', teacherId: 't-ei1' },
    { classCode: '1APIC', dayIndex: 0, periodIndex: 1, subjectCode: 'MATH', teacherId: 't-math1' },
    { classCode: '1APIC', dayIndex: 0, periodIndex: 2, subjectCode: 'HG', teacherId: 't-hg1' },
    { classCode: '1APIC', dayIndex: 0, periodIndex: 3, subjectCode: 'EPS', teacherId: 't-eps1' },

    { classCode: '2APIC', dayIndex: 0, periodIndex: 0, subjectCode: 'SVT', teacherId: 't-svt1' },
    { classCode: '2APIC', dayIndex: 0, periodIndex: 1, subjectCode: 'PC', teacherId: 't-pc1' },
    { classCode: '2APIC', dayIndex: 0, periodIndex: 2, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '2APIC', dayIndex: 0, periodIndex: 3, subjectCode: 'EPS', teacherId: 't-eps1' },
    { classCode: '2APIC', dayIndex: 0, periodIndex: 4, subjectCode: 'AR', teacherId: 't-ar1' },

    { classCode: '3APIC1', dayIndex: 0, periodIndex: 0, subjectCode: 'EPS', teacherId: 't-eps1' },
    { classCode: '3APIC1', dayIndex: 0, periodIndex: 1, subjectCode: 'MATH', teacherId: 't-math2' },
    { classCode: '3APIC1', dayIndex: 0, periodIndex: 2, subjectCode: 'SVT', teacherId: 't-svt1' },
    { classCode: '3APIC1', dayIndex: 0, periodIndex: 3, subjectCode: 'HG', teacherId: 't-hg1' },
    { classCode: '3APIC1', dayIndex: 0, periodIndex: 4, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: '3APIC1', dayIndex: 0, periodIndex: 5, subjectCode: 'FR', teacherId: 't-fr1' },

    { classCode: '3APIC2', dayIndex: 0, periodIndex: 0, subjectCode: 'SVT', teacherId: 't-svt1' },
    { classCode: '3APIC2', dayIndex: 0, periodIndex: 1, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '3APIC2', dayIndex: 0, periodIndex: 2, subjectCode: 'MATH', teacherId: 't-math1' },
    { classCode: '3APIC2', dayIndex: 0, periodIndex: 3, subjectCode: 'HG', teacherId: 't-hg1' },

    { classCode: 'TC', dayIndex: 0, periodIndex: 0, subjectCode: 'PC', teacherId: 't-pc1' },
    { classCode: 'TC', dayIndex: 0, periodIndex: 1, subjectCode: 'HG', teacherId: 't-hg1' },
    { classCode: 'TC', dayIndex: 0, periodIndex: 2, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: 'TC', dayIndex: 0, periodIndex: 3, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: 'TC', dayIndex: 0, periodIndex: 4, subjectCode: 'PC', teacherId: 't-pc1' },
    { classCode: 'TC', dayIndex: 0, periodIndex: 5, subjectCode: 'MATH', teacherId: 't-math1' },

    { classCode: '1BAC', dayIndex: 0, periodIndex: 0, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: '1BAC', dayIndex: 0, periodIndex: 1, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '1BAC', dayIndex: 0, periodIndex: 2, subjectCode: 'SVT', teacherId: 't-svt1' },
    { classCode: '1BAC', dayIndex: 0, periodIndex: 3, subjectCode: 'EPS', teacherId: 't-eps1' },
    { classCode: '1BAC', dayIndex: 0, periodIndex: 4, subjectCode: 'MATH', teacherId: 't-math2' },

    { classCode: '2BAC/SVT', dayIndex: 0, periodIndex: 0, subjectCode: 'EPS', teacherId: 't-eps1' },
    { classCode: '2BAC/SVT', dayIndex: 0, periodIndex: 1, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: '2BAC/SVT', dayIndex: 0, periodIndex: 2, subjectCode: 'PC', teacherId: 't-pc1' },
    { classCode: '2BAC/SVT', dayIndex: 0, periodIndex: 3, subjectCode: 'AR', teacherId: 't-ar1' },

    { classCode: '2BAC/PC', dayIndex: 0, periodIndex: 0, subjectCode: 'MATH', teacherId: 't-math1' },
    { classCode: '2BAC/PC', dayIndex: 0, periodIndex: 1, subjectCode: 'SVT', teacherId: 't-svt1' },
    { classCode: '2BAC/PC', dayIndex: 0, periodIndex: 2, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '2BAC/PC', dayIndex: 0, periodIndex: 3, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '2BAC/PC', dayIndex: 0, periodIndex: 4, subjectCode: 'EPS', teacherId: 't-eps1' },
    { classCode: '2BAC/PC', dayIndex: 0, periodIndex: 5, subjectCode: 'AR', teacherId: 't-ar1' },

    // الثلاثاء (Day 1)
    { classCode: '1APIC', dayIndex: 1, periodIndex: 0, subjectCode: 'SVT', teacherId: 't-svt1' },
    { classCode: '1APIC', dayIndex: 1, periodIndex: 1, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '1APIC', dayIndex: 1, periodIndex: 2, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '2APIC', dayIndex: 1, periodIndex: 0, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: '2APIC', dayIndex: 1, periodIndex: 1, subjectCode: 'HG', teacherId: 't-hg1' },
    { classCode: '2APIC', dayIndex: 1, periodIndex: 2, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '3APIC1', dayIndex: 1, periodIndex: 0, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '3APIC1', dayIndex: 1, periodIndex: 1, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '3APIC1', dayIndex: 1, periodIndex: 2, subjectCode: 'EPS', teacherId: 't-eps1' },
    { classCode: '3APIC1', dayIndex: 1, periodIndex: 3, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: '3APIC2', dayIndex: 1, periodIndex: 0, subjectCode: 'MATH', teacherId: 't-math1' },
    { classCode: '3APIC2', dayIndex: 1, periodIndex: 1, subjectCode: 'EI', teacherId: 't-ei1' },
    { classCode: '3APIC2', dayIndex: 1, periodIndex: 2, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: 'TC', dayIndex: 1, periodIndex: 0, subjectCode: 'MATH', teacherId: 't-math2' },
    { classCode: 'TC', dayIndex: 1, periodIndex: 1, subjectCode: 'PC', teacherId: 't-pc1' },
    { classCode: 'TC', dayIndex: 1, periodIndex: 2, subjectCode: 'FR', teacherId: 't-fr1' },

    // الأربعاء (Day 2)
    { classCode: '1APIC', dayIndex: 2, periodIndex: 0, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '1APIC', dayIndex: 2, periodIndex: 1, subjectCode: 'HG', teacherId: 't-hg1' },
    { classCode: '2APIC', dayIndex: 2, periodIndex: 0, subjectCode: 'MATH', teacherId: 't-math1' },
    { classCode: '2APIC', dayIndex: 2, periodIndex: 1, subjectCode: 'EI', teacherId: 't-ei1' },
    { classCode: '3APIC1', dayIndex: 2, periodIndex: 0, subjectCode: 'MATH', teacherId: 't-math2' },
    { classCode: '3APIC1', dayIndex: 2, periodIndex: 1, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '3APIC1', dayIndex: 2, periodIndex: 2, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '3APIC2', dayIndex: 2, periodIndex: 0, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '3APIC2', dayIndex: 2, periodIndex: 1, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '3APIC2', dayIndex: 2, periodIndex: 2, subjectCode: 'PC', teacherId: 't-pc1' },
    { classCode: 'TC', dayIndex: 2, periodIndex: 0, subjectCode: 'EI', teacherId: 't-ei1' },
    { classCode: 'TC', dayIndex: 2, periodIndex: 1, subjectCode: 'PH', teacherId: 't-ph1' },

    // الخميس (Day 3)
    { classCode: '1APIC', dayIndex: 3, periodIndex: 0, subjectCode: 'MATH', teacherId: 't-math1' },
    { classCode: '1APIC', dayIndex: 3, periodIndex: 1, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: '1APIC', dayIndex: 3, periodIndex: 2, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '1APIC', dayIndex: 3, periodIndex: 3, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '2APIC', dayIndex: 3, periodIndex: 0, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: '2APIC', dayIndex: 3, periodIndex: 1, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '2APIC', dayIndex: 3, periodIndex: 2, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '2APIC', dayIndex: 3, periodIndex: 3, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '3APIC1', dayIndex: 3, periodIndex: 0, subjectCode: 'HG', teacherId: 't-hg1' },
    { classCode: '3APIC1', dayIndex: 3, periodIndex: 1, subjectCode: 'PC', teacherId: 't-pc1' },
    { classCode: '3APIC1', dayIndex: 3, periodIndex: 2, subjectCode: 'MATH', teacherId: 't-math2' },
    { classCode: '3APIC1', dayIndex: 3, periodIndex: 3, subjectCode: 'EI', teacherId: 't-ei1' },
    { classCode: 'TC', dayIndex: 3, periodIndex: 0, subjectCode: 'SVT', teacherId: 't-svt1' },
    { classCode: 'TC', dayIndex: 3, periodIndex: 1, subjectCode: 'MATH', teacherId: 't-math1' },
    { classCode: 'TC', dayIndex: 3, periodIndex: 2, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: 'TC', dayIndex: 3, periodIndex: 3, subjectCode: 'FR', teacherId: 't-fr1' },

    // الجمعة (Day 4)
    { classCode: '1APIC', dayIndex: 4, periodIndex: 0, subjectCode: 'MATH', teacherId: 't-math1' },
    { classCode: '1APIC', dayIndex: 4, periodIndex: 1, subjectCode: 'PC', teacherId: 't-pc1' },
    { classCode: '1APIC', dayIndex: 4, periodIndex: 2, subjectCode: 'AR', teacherId: 't-ar1' },
    { classCode: '2APIC', dayIndex: 4, periodIndex: 0, subjectCode: 'MATH', teacherId: 't-math2' },
    { classCode: '2APIC', dayIndex: 4, periodIndex: 1, subjectCode: 'HG', teacherId: 't-hg1' },
    { classCode: '2APIC', dayIndex: 4, periodIndex: 2, subjectCode: 'EPS', teacherId: 't-eps1' },
    { classCode: '3APIC1', dayIndex: 4, periodIndex: 0, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: '3APIC1', dayIndex: 4, periodIndex: 1, subjectCode: 'FR', teacherId: 't-fr1' },
    { classCode: '3APIC2', dayIndex: 4, periodIndex: 0, subjectCode: 'HG', teacherId: 't-hg1' },
    { classCode: '3APIC2', dayIndex: 4, periodIndex: 1, subjectCode: 'ANG', teacherId: 't-ang1' },
    { classCode: '3APIC2', dayIndex: 4, periodIndex: 2, subjectCode: 'EPS', teacherId: 't-eps1' },
    { classCode: 'TC', dayIndex: 4, periodIndex: 0, subjectCode: 'EPS', teacherId: 't-eps1' },
    { classCode: 'TC', dayIndex: 4, periodIndex: 1, subjectCode: 'SVT', teacherId: 't-svt1' },
    { classCode: 'TC', dayIndex: 4, periodIndex: 2, subjectCode: 'MATH', teacherId: 't-math1' },
    { classCode: 'TC', dayIndex: 4, periodIndex: 3, subjectCode: 'ANG', teacherId: 't-ang1' },
  ];

  // The application model uses one Lesson as an assignment and
  // weeklyPeriods as the number of occurrences required during the week.
  // Group the sample grid by class + subject + teacher so workload totals
  // and automatic generation use the same data model.
  const lessonByAssignment = new Map<string, Lesson>();

  gridData.forEach((item, index) => {
    const classGroup = initialClassGroups.find((c) => c.code === item.classCode);
    const subject = initialSubjects.find((s) => s.code === item.subjectCode);
    if (!classGroup || !subject) return;

    const assignmentKey = `${classGroup.id}|${subject.id}|${item.teacherId}`;
    let lesson = lessonByAssignment.get(assignmentKey);

    if (!lesson) {
      lesson = {
        id: `lsn-${index + 1}`,
        classGroupId: classGroup.id,
        subjectId: subject.id,
        teacherId: item.teacherId,
        weeklyPeriods: 0,
      };
      lessonByAssignment.set(assignmentKey, lesson);
      lessons.push(lesson);
    }

    lesson.weeklyPeriods += 1;

    placements.push({
      id: `plc-${lesson.id}-${item.dayIndex}-${item.periodIndex}`,
      lessonId: lesson.id,
      dayIndex: item.dayIndex,
      periodIndex: item.periodIndex,
    });
  });

  return { lessons, placements };
}
