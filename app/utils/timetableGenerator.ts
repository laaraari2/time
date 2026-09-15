import {
  Placement,
  Lesson,
  Subject,
  Teacher,
  ClassGroup,
  Classroom,
  TimetableConfig,
  Conflict,
} from '../types';


/**
 * هل الخانة مغلقة؟
 */
export function isSlotDisabled(
  config: TimetableConfig,
  dayIdx: number,
  periodIdx: number
): boolean {
  return !!config?.disabledSlots?.some(
    (s) =>
      s.dayIndex === dayIdx &&
      s.periodIndex === periodIdx
  );
}


/**
 * مفتاح استعمال الخانة.
 */
const key = (
  day: number,
  period: number,
  id: string
) => `${day}|${period}|${id}`;


/**
 * فحص جميع التعارضات.
 */
export function checkConflicts(
  placements: Placement[],
  lessons: Lesson[],
  teachers: Teacher[],
  classes: ClassGroup[],
  rooms: Classroom[],
  config: TimetableConfig
): Conflict[] {
  const conflicts: Conflict[] = [];

  const lessonMap = new Map(
    lessons.map((l) => [l.id, l])
  );

  const teacherOccupancy =
    new Map<string, Placement[]>();

  const classOccupancy =
    new Map<string, Placement[]>();

  const roomOccupancy =
    new Map<string, Placement[]>();

  const teacherDailyOccupancy =
    new Map<string, Placement[]>();


  for (const p of placements) {
    const lesson = lessonMap.get(
      p.lessonId
    );

    if (!lesson) continue;


    /*
     * تعارض الفترة المغلقة.
     */
    if (
      isSlotDisabled(
        config,
        p.dayIndex,
        p.periodIndex
      )
    ) {
      conflicts.push({
        id: `conf-disabled-${p.id}`,
        type: 'teacher_unavailable',
        message:
          'الحصة معينة في فترة مغلقة أو ملغاة في إعدادات المؤسسة.',
        severity: 'error',
        placementIds: [p.id],
        dayIndex: p.dayIndex,
        periodIndex: p.periodIndex,
      });
    }


    /*
     * استعمال الأستاذ في نفس التوقيت.
     */
    const teacherKey = key(
      p.dayIndex,
      p.periodIndex,
      lesson.teacherId
    );

    const teacherDayKey = `${p.dayIndex}|${lesson.teacherId}`;
    const existingTeacherDay = teacherDailyOccupancy.get(teacherDayKey) || [];
    teacherDailyOccupancy.set(teacherDayKey, [...existingTeacherDay, p]);

    const existingTeacherPlacements =
      teacherOccupancy.get(
        teacherKey
      ) || [];

    teacherOccupancy.set(
      teacherKey,
      [
        ...existingTeacherPlacements,
        p,
      ]
    );


    /*
     * استعمال القسم في نفس التوقيت.
     */
    const classKey = key(
      p.dayIndex,
      p.periodIndex,
      lesson.classGroupId
    );

    const existingClassPlacements =
      classOccupancy.get(
        classKey
      ) || [];

    classOccupancy.set(
      classKey,
      [
        ...existingClassPlacements,
        p,
      ]
    );


    /*
     * القاعات.
     */
    if (p.roomId) {
      const roomKey = key(
        p.dayIndex,
        p.periodIndex,
        p.roomId
      );

      const existingRoomPlacements =
        roomOccupancy.get(
          roomKey
        ) || [];

      roomOccupancy.set(
        roomKey,
        [
          ...existingRoomPlacements,
          p,
        ]
      );


      const room = rooms.find(
        (r) => r.id === p.roomId
      );

      const classGroup = classes.find(
        (c) =>
          c.id === lesson.classGroupId
      );


      if (
        room &&
        classGroup &&
        room.capacity <
          classGroup.studentCount
      ) {
        conflicts.push({
          id: `conf-capacity-${p.id}`,
          type: 'room_capacity',
          message: `القاعة (${room.name}) لا تتسع لعدد تلاميذ الفصل (${classGroup.studentCount}).`,
          severity: 'error',
          placementIds: [p.id],
          dayIndex: p.dayIndex,
          periodIndex: p.periodIndex,
        });
      }
    }


    /*
     * عدم توفر الأستاذ.
     */
    const teacher = teachers.find(
      (t) =>
        t.id === lesson.teacherId
    );


    if (
      teacher?.unavailableSlots?.some(
        (s) =>
          s.dayIndex === p.dayIndex &&
          s.periodIndex ===
            p.periodIndex
      )
    ) {
      conflicts.push({
        id: `conf-unavail-${p.id}`,
        type: 'teacher_unavailable',
        message: `الأستاذ (${teacher.name}) غير متاح في هذا التوقيت.`,
        severity: 'error',
        placementIds: [p.id],
        dayIndex: p.dayIndex,
        periodIndex: p.periodIndex,
      });
    }
  }


  /*
   * -------------------------------------------------------
   * 1. تعارض الأستاذ في نفس التوقيت
   * -------------------------------------------------------
   */
  for (const [k, list] of teacherOccupancy) {
    if (list.length > 1) {
      const teacherId =
        k.split('|')[2];

      const teacher = teachers.find(
        (t) => t.id === teacherId
      );


      conflicts.push({
        id: `conf-t-${k}`,
        type: 'teacher_double_booking',
        message: `تعارض أستاذ: ${teacher?.name || 'أستاذ مجهول'} لديه أكثر من حصة في نفس التوقيت.`,
        severity: 'error',
        placementIds:
          list.map((p) => p.id),
        dayIndex:
          list[0].dayIndex,
        periodIndex:
          list[0].periodIndex,
      });
    }
  }


  /*
   * -------------------------------------------------------
   * 2. تعارض القسم في نفس التوقيت
   * -------------------------------------------------------
   */
  for (const [k, list] of classOccupancy) {
    if (list.length > 1) {
      const classId =
        k.split('|')[2];

      const classGroup =
        classes.find(
          (c) => c.id === classId
        );


      conflicts.push({
        id: `conf-c-${k}`,
        type: 'class_double_booking',
        message: `تعارض فصل: ${classGroup?.code || 'فصل مجهول'} لديه أكثر من حصة في نفس التوقيت.`,
        severity: 'error',
        placementIds:
          list.map((p) => p.id),
        dayIndex:
          list[0].dayIndex,
        periodIndex:
          list[0].periodIndex,
      });
    }
  }


  /*
   * -------------------------------------------------------
   * 3. تعارض القاعة في نفس التوقيت
   * -------------------------------------------------------
   */
  for (const [k, list] of roomOccupancy) {
    if (list.length > 1) {
      const roomId =
        k.split('|')[2];

      const room = rooms.find(
        (r) => r.id === roomId
      );


      conflicts.push({
        id: `conf-r-${k}`,
        type: 'room_double_booking',
        message: `تعارض قاعة: ${room?.name || 'قاعة مجهولة'} محجوزة لأكثر من حصة.`,
        severity: 'error',
        placementIds:
          list.map((p) => p.id),
        dayIndex:
          list[0].dayIndex,
        periodIndex:
          list[0].periodIndex,
      });
    }
  }


  return conflicts;
}


interface Candidate {
  day: number;
  period: number;
  room?: string;
  score: number;
}


/**
 * Practical school timetable generator.
 */
export function autoGenerateTimetable(
  lessons: Lesson[],
  teachers: Teacher[],
  classes: ClassGroup[],
  rooms: Classroom[],
  config: TimetableConfig
): {
  newPlacements: Placement[];
  unplacedLessons: Lesson[];
  totalPlaced: number;
} {
  const daysCount =
    config.days.length;

  const periods =
    config.periods;

  const periodsCount =
    periods.length;


  const teacherBusy =
    new Set<string>();

  const classBusy =
    new Set<string>();

  const roomBusy =
    new Set<string>();


  /*
   * ساعات الأستاذ اليومية المستعملة فعلياً كـ hard constraint.
   */
  const teacherDayHours =
    new Map<string, number>();


  const classDayPeriods =
    new Map<string, Set<number>>();

  const teacherDayPeriods =
    new Map<string, Set<number>>();

  const subjectDayPeriods =
    new Map<string, Set<string>>();


  const placements: Placement[] =
    [];

  const unplacedLessons: Lesson[] =
    [];


  const requiredPeriodsByLesson =
    new Map<string, number>();

  const placedPeriodsByLesson =
    new Map<string, number>();


  for (const lesson of lessons) {
    requiredPeriodsByLesson.set(
      lesson.id,
      Math.max(
        1,
        Math.round(
          lesson.weeklyPeriods || 1
        )
      )
    );
  }


  const teacherById =
    new Map(
      teachers.map(
        (t) => [t.id, t]
      )
    );


  const classById =
    new Map(
      classes.map(
        (c) => [c.id, c]
      )
    );


  /*
   * إضافة استعمال جديد.
   */
  const addUsage = (
    lesson: Lesson,
    day: number,
    period: number,
    roomId?: string
  ) => {
    teacherBusy.add(
      key(
        day,
        period,
        lesson.teacherId
      )
    );


    classBusy.add(
      key(
        day,
        period,
        lesson.classGroupId
      )
    );


    if (roomId) {
      roomBusy.add(
        key(
          day,
          period,
          roomId
        )
      );
    }


    const td =
      `${lesson.teacherId}|${day}`;

    teacherDayHours.set(
      td,
      (
        teacherDayHours.get(td) ||
        0
      ) + 1
    );


    const cd =
      `${lesson.classGroupId}|${day}`;

    if (
      !classDayPeriods.has(cd)
    ) {
      classDayPeriods.set(
        cd,
        new Set()
      );
    }


    classDayPeriods
      .get(cd)!
      .add(period);


    const tdp =
      `${lesson.teacherId}|${day}`;

    if (
      !teacherDayPeriods.has(tdp)
    ) {
      teacherDayPeriods.set(
        tdp,
        new Set()
      );
    }


    teacherDayPeriods
      .get(tdp)!
      .add(period);


    const sd =
      `${lesson.classGroupId}|${lesson.subjectId}|${day}`;

    if (
      !subjectDayPeriods.has(sd)
    ) {
      subjectDayPeriods.set(
        sd,
        new Set()
      );
    }


    subjectDayPeriods
      .get(sd)!
      .add(
        `${day}|${period}`
      );
  };


  /*
   * فحص إمكانية استعمال القاعة.
   */
  const canUseRoom = (
    lesson: Lesson,
    room: Classroom | undefined
  ) => {
    if (!room) return true;


    const cls =
      classById.get(
        lesson.classGroupId
      );


    if (!cls) return true;


    return (
      room.capacity >=
      cls.studentCount
    );
  };


  /*
   * هل يمكن وضع الحصة؟
   */
  const canPlaceBlock = (
    lesson: Lesson,
    day: number,
    startPeriod: number,
    length: number
  ): {
    ok: boolean;
    room?: string;
  } => {
    const teacher =
      teacherById.get(
        lesson.teacherId
      );


    const cls =
      classById.get(
        lesson.classGroupId
      );


    if (
      !cls ||
      startPeriod + length >
        periodsCount
    ) {
      return {
        ok: false,
      };
    }


    /*
     * اختيار القاعة.
     */
    const roomCandidates =
      rooms.filter((r) => {
        if (
          lesson.preferredRoomId &&
          r.id !==
            lesson.preferredRoomId
        ) {
          return false;
        }


        if (
          r.capacity <
          cls.studentCount
        ) {
          return false;
        }


        for (
          let offset = 0;
          offset < length;
          offset++
        ) {
          if (
            roomBusy.has(
              key(
                day,
                startPeriod +
                  offset,
                r.id
              )
            )
          ) {
            return false;
          }
        }


        return true;
      });


    const fallbackRooms =
      rooms.filter((r) => {
        if (
          r.capacity <
          cls.studentCount
        ) {
          return false;
        }


        for (
          let offset = 0;
          offset < length;
          offset++
        ) {
          if (
            roomBusy.has(
              key(
                day,
                startPeriod +
                  offset,
                r.id
              )
            )
          ) {
            return false;
          }
        }


        return true;
      });


    const selectedRoom =
      rooms.length
        ? (
            roomCandidates[0] ||
            fallbackRooms[0]
          )?.id
        : undefined;


    if (
      rooms.length &&
      !selectedRoom
    ) {
      return {
        ok: false,
      };
    }


    /*
     * فحص كل حصة في البلوك.
     */
    for (
      let offset = 0;
      offset < length;
      offset++
    ) {
      const p =
        startPeriod + offset;


      if (
        isSlotDisabled(
          config,
          day,
          p
        ) ||
        periods[p]?.isBreak
      ) {
        return {
          ok: false,
        };
      }


      if (
        teacher?.unavailableSlots?.some(
          (slot) =>
            slot.dayIndex ===
              day &&
            slot.periodIndex ===
              p
        )
      ) {
        return {
          ok: false,
        };
      }


      if (
        teacherBusy.has(
          key(
            day,
            p,
            lesson.teacherId
          )
        )
      ) {
        return {
          ok: false,
        };
      }


      if (
        classBusy.has(
          key(
            day,
            p,
            lesson.classGroupId
          )
        )
      ) {
        return {
          ok: false,
        };
      }
    }


    return {
      ok: true,
      room: selectedRoom,
    };
  };


  /*
   * تقييم المرشح.
   */
  const scoreCandidate = (
    lesson: Lesson,
    day: number,
    startPeriod: number,
    length: number
  ): Candidate | null => {
    const result =
      canPlaceBlock(
        lesson,
        day,
        startPeriod,
        length
      );


    if (!result.ok) {
      return null;
    }


    const classSet =
      classDayPeriods.get(
        `${lesson.classGroupId}|${day}`
      ) ||
      new Set<number>();


    const teacherSet =
      teacherDayPeriods.get(
        `${lesson.teacherId}|${day}`
      ) ||
      new Set<number>();


    const subjectSet =
      subjectDayPeriods.get(
        `${lesson.classGroupId}|${lesson.subjectId}|${day}`
      ) ||
      new Set<string>();


    let score = 100;


    /*
     * توزيع المادة خلال الأسبوع.
     */
    if (
      subjectSet.size === 0
    ) {
      score += 45;
    } else {
      score -= 50;
    }


    /*
     * تقليل الفراغات.
     */
    for (
      let p = startPeriod;
      p <
        startPeriod + length;
      p++
    ) {
      if (
        classSet.has(p - 1) ||
        classSet.has(p + 1)
      ) {
        score += 8;
      }


      if (
        teacherSet.has(p - 1) ||
        teacherSet.has(p + 1)
      ) {
        score += 5;
      }
    }


    /*
     * تجنب الحصص المتتالية الطويلة.
     */
    const occupied =
      [...classSet].sort(
        (a, b) => a - b
      );


    let maxRun = 0;
    let run = 0;


    for (
      let p = 0;
      p < periodsCount;
      p++
    ) {
      const occupiedHere =
        occupied.includes(p) ||
        (
          p >= startPeriod &&
          p <
            startPeriod + length
        );


      if (occupiedHere) {
        run++;
      } else {
        run = 0;
      }


      maxRun =
        Math.max(
          maxRun,
          run
        );
    }


    if (maxRun >= 4) {
      score -= 30;
    } else if (maxRun === 3) {
      score -= 12;
    }


    /*
     * موازنة الأستاذ بين الأيام.
     *
     * هذا مجرد تفضيل ناعم (soft preference) ولا يضع أي حد
     * أقصى لعدد حصص الأستاذ في اليوم.
     */
    const teacherHours =
      teacherDayHours.get(
        `${lesson.teacherId}|${day}`
      ) || 0;


    score -=
      teacherHours * 3;


    /*
     * تفضيل الحصص المبكرة قليلاً.
     */
    score -=
      startPeriod * 0.5;


    return {
      day,
      period: startPeriod,
      room: result.room,
      score,
    };
  };


  /*
   * إنشاء المهام الأسبوعية.
   */
  type Task = {
    lesson: Lesson;
    occurrence: number;
    blockLength: number;
  };


  const tasks: Task[] = [];


  for (const lesson of lessons) {
    let remaining =
      Math.max(
        1,
        Math.round(
          lesson.weeklyPeriods ||
            1
        )
      );


    let occurrence = 0;


    while (remaining > 0) {
      const blockLength =
        lesson.isDoublePeriod &&
        remaining >= 2
          ? 2
          : 1;


      tasks.push({
        lesson,
        occurrence,
        blockLength,
      });


      occurrence += 1;
      remaining -=
        blockLength;
    }
  }


  /*
   * ترتيب المهام حسب الصعوبة.
   */
  tasks.sort((a, b) => {
    const aTeacher =
      teacherById.get(
        a.lesson.teacherId
      );


    const bTeacher =
      teacherById.get(
        b.lesson.teacherId
      );


    const aCount =
      Math.max(
        1,
        a.lesson.weeklyPeriods ||
          1
      );


    const bCount =
      Math.max(
        1,
        b.lesson.weeklyPeriods ||
          1
      );


    const aDifficulty =
      aCount * 3 +
      (
        aTeacher
          ?.unavailableSlots
          ?.length || 0
      ) * 4 +
      (
        a.blockLength - 1
      ) * 12;


    const bDifficulty =
      bCount * 3 +
      (
        bTeacher
          ?.unavailableSlots
          ?.length || 0
      ) * 4 +
      (
        b.blockLength - 1
      ) * 12;


    return (
      bDifficulty -
      aDifficulty
    );
  });


  /*
   * وضع المهام.
   */
  for (const task of tasks) {
    const candidates: Candidate[] =
      [];


    for (
      let day = 0;
      day < daysCount;
      day++
    ) {
      for (
        let period = 0;
        period < periodsCount;
        period++
      ) {
        const candidate =
          scoreCandidate(
            task.lesson,
            day,
            period,
            task.blockLength
          );


        if (candidate) {
          candidates.push(
            candidate
          );
        }
      }
    }


    candidates.sort(
      (a, b) =>
        b.score -
        a.score
    );


    const selected =
      candidates[0];


    if (!selected) {
      continue;
    }


    const blockPlacements:
      Placement[] = [];


    for (
      let offset = 0;
      offset <
        task.blockLength;
      offset++
    ) {
      const p =
        selected.period +
        offset;


      const roomId =
        selected.room;


      blockPlacements.push({
        id:
          `gen-${task.lesson.id}-${task.occurrence}-${selected.day}-${p}`,

        lessonId:
          task.lesson.id,

        dayIndex:
          selected.day,

        periodIndex:
          p,

        roomId,

        doubleGroupId:
          task.blockLength > 1
            ? `dbl-${task.lesson.id}-${task.occurrence}`
            : undefined,
      });


      addUsage(
        task.lesson,
        selected.day,
        p,
        roomId
      );
    }


    placements.push(
      ...blockPlacements
    );


    placedPeriodsByLesson.set(
      task.lesson.id,
      (
        placedPeriodsByLesson.get(
          task.lesson.id
        ) || 0
      ) +
        task.blockLength
    );
  }


  /*
   * تحديد الدروس التي لم توضع بالكامل.
   */
  for (const lesson of lessons) {
    const required =
      requiredPeriodsByLesson.get(
        lesson.id
      ) || 0;


    const placed =
      placedPeriodsByLesson.get(
        lesson.id
      ) || 0;


    if (
      placed < required
    ) {
      unplacedLessons.push(
        lesson
      );
    }
  }


  return {
    newPlacements:
      placements,

    unplacedLessons,

    totalPlaced:
      placements.length,
  };
}


/**
 * الحصول على تفاصيل الحصة.
 */
export function getPlacementDetails(
  placement: Placement,
  lessons: Lesson[],
  subjects: Subject[],
  teachers: Teacher[],
  classes: ClassGroup[],
  rooms: Classroom[]
) {
  const lesson =
    lessons.find(
      (l) =>
        l.id ===
        placement.lessonId
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


  const room =
    rooms.find(
      (r) =>
        r.id ===
        (
          placement.roomId ||
          lesson.preferredRoomId
        )
    );


  return {
    placement,
    lesson,
    subject,
    teacher,
    classGroup,
    room,
  };
}
