export interface Subject {
  id: string;
  code: string;
  name: string;
  color: string; // Hex color code e.g. #FF8C38
  textColor?: string;
  defaultWeeklyHours: number;
}

export interface Teacher {
  id: string;
  code: string;
  name: string;
  email?: string;

  // Legacy field kept for backward compatibility. It is NOT a constraint.
  // Teachers may teach any number of periods in a day as long as there is no real conflict.
  maxHoursPerDay?: number;

  // Subjects taught by this teacher
  subjectIds: string[];

  // Classes assigned to this teacher
  classGroupIds?: string[];

  color?: string;

  // Days and periods when the teacher cannot teach
  unavailableSlots: {
    dayIndex: number;
    periodIndex: number;
  }[];
}

export interface WeeklyHoursAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classGroupId: string;
  weeklyHours: number;
}

export interface ClassGroup {
  id: string;
  code: string; // e.g. "1APIC", "2BAC/PC"
  name: string; // e.g. "الأولى إعدادي - 1", "الثانية بكالوريا علوم فيزيائية"
  gradeLevel: string;
  studentCount: number;
  homeRoomId?: string;
}

export interface Classroom {
  id: string;
  code: string; // e.g. "S01", "LAB-PH"
  name: string;
  capacity: number;
  type: 'standard' | 'lab' | 'gym' | 'computer';
}

export interface Lesson {
  id: string;
  classGroupId: string;
  subjectId: string;
  teacherId: string;
  preferredRoomId?: string;

  // Total periods required per week
  weeklyPeriods: number;

  // Blocks of 2 consecutive hours
  isDoublePeriod?: boolean;

  // التفويج: full class or specific group
  groupType?: 'full' | 'G1' | 'G2';

  // e.g. "فوج 1" or "فوج 2"
  groupName?: string;
}

export interface Placement {
  id: string;
  lessonId: string;

  // 0 to days.length - 1
  dayIndex: number;

  // 0 to periodsPerDay - 1
  periodIndex: number

  roomId?: string;

  // Group ID to link 2 consecutive periods for double-period lessons
  doubleGroupId?: string;
}

export interface TimePeriod {
  periodIndex: number;
  label: string; // e.g. "8:30-9:30"
  startTime: string;
  endTime: string;
  isBreak?: boolean;
}

export interface TimetableConfig {
  schoolName: string;
  academicYear: string;

  schoolLogo?: string; // base64 or URL
  ministryLogo?: string; // base64 or URL

  ministryName?: string;

  // e.g. "المملكة المغربية - وزارة التربية الوطنية والتعليم الأولي والرياضة"
  language?: 'ar' | 'fr';

  // e.g. ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]
  days: string[];

  periods: TimePeriod[];

  // Disabled day/period slots
  // e.g. Wednesday afternoon off
  disabledSlots?: {
    dayIndex: number;
    periodIndex: number;
  }[];
}

export interface SavedScheduleProfile {
  id: string;
  name: string;
  updatedAt: string;

  config: TimetableConfig;

  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassGroup[];
  rooms: Classroom[];
  lessons: Lesson[];
  placements: Placement[];
}

export interface Conflict {
  id: string;

  type:
    | 'teacher_double_booking'
    | 'room_double_booking'
    | 'class_double_booking'
    | 'teacher_unavailable'
    | 'room_capacity'
    | 'teacher_class_shift_conflict';

  message: string;

  severity: 'error' | 'warning';

  placementIds: string[];

  dayIndex: number;
  periodIndex: number;
}

export type ActiveTab =
  | 'home'
  | 'data'
  | 'generate'
  | 'preview'
  | 'export';

export type DisplayMode =
  | 'matrix_classes'
  | 'matrix_teachers'
  | 'matrix_rooms'
  | 'single_class'
  | 'single_teacher'
  | 'single_room';