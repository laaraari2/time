import { NextResponse } from 'next/server';
import { requireSupabaseUser } from '../../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../../lib/supabase/admin';

type JsonRecord = Record<string, any>;

export async function GET() {
  try {
    const { user } = await requireSupabaseUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Do not rely on get_accessible_projects here. The teacher account is the
    // source of truth for which teacher/project this logged-in user may see.
    const admin = createSupabaseAdminClient();

    const { data: accounts, error: accountsError } = await admin
      .from('teacher_accounts')
      .select('project_id,teacher_id')
      .eq('user_id', user.id);

    if (accountsError) {
      console.error('Failed to load teacher account:', accountsError);
      return NextResponse.json(
        { success: false, error: 'تعذر تحميل ربط حساب الأستاذ.' },
        { status: 500 }
      );
    }

    if (!accounts?.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'هذا الحساب غير مربوط بأي أستاذ. اطلب من الإدارة ربط الحساب بالأستاذ.',
        },
        { status: 404 }
      );
    }

    const projectIds = [...new Set(accounts.map((account) => account.project_id))];

    const { data: projects, error: projectsError } = await admin
      .from('projects')
      .select('id,name,created_at,updated_at,config,subjects,teachers,classes,rooms,lessons,placements')
      .in('id', projectIds);

    if (projectsError) {
      console.error('Failed to load teacher projects:', projectsError);
      return NextResponse.json(
        { success: false, error: 'تعذر تحميل بيانات المؤسسة.' },
        { status: 500 }
      );
    }

    const visibleProjects = (projects ?? [])
      .map((project) => {
        const account = accounts.find(
          (item) => item.project_id === project.id
        );

        if (!account) return null;

        const teacherId = String(account.teacher_id);
        const teachers = Array.isArray(project.teachers)
          ? project.teachers as JsonRecord[]
          : [];
        const subjects = Array.isArray(project.subjects)
          ? project.subjects as JsonRecord[]
          : [];
        const classes = Array.isArray(project.classes)
          ? project.classes as JsonRecord[]
          : [];
        const lessons = Array.isArray(project.lessons)
          ? project.lessons as JsonRecord[]
          : [];
        const placements = Array.isArray(project.placements)
          ? project.placements as JsonRecord[]
          : [];

        const teacher = teachers.find(
          (item) => String(item.id) === teacherId
        );

        if (!teacher) {
          console.error('Teacher account points to missing teacher:', {
            projectId: project.id,
            teacherId,
            userId: user.id,
          });
          return null;
        }

        const teacherLessons = lessons.filter(
          (lesson) => String(lesson.teacherId) === teacherId
        );

        const lessonIds = new Set(
          teacherLessons.map((lesson) => String(lesson.id))
        );

        const subjectIds = new Set(
          teacherLessons.map((lesson) => String(lesson.subjectId))
        );

        const classIds = new Set(
          teacherLessons.map((lesson) => String(lesson.classGroupId))
        );

        const teacherPlacements = placements.filter((placement) =>
          lessonIds.has(String(placement.lessonId))
        );

        return {
          id: project.id,
          name: project.name,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          config: project.config,
          subjects: subjects.filter((subject) =>
            subjectIds.has(String(subject.id))
          ),
          teachers: [teacher],
          classes: classes.filter((classGroup) =>
            classIds.has(String(classGroup.id))
          ),
          rooms: [],
          lessons: teacherLessons,
          placements: teacherPlacements,
        };
      })
      .filter((project): project is NonNullable<typeof project> => Boolean(project));

    if (!visibleProjects.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'الحساب مربوط بالأستاذ، لكن الأستاذ غير موجود داخل بيانات المؤسسة.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: visibleProjects,
    });
  } catch (error) {
    console.error('Failed to load teacher timetable:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر تحميل جدول الأستاذ.' },
      { status: 500 }
    );
  }
}
