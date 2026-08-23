import { NextResponse } from 'next/server';
import { getTimetableUserRole } from '../../../lib/projects';
import { requireSupabaseUser } from '../../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../../lib/supabase/admin';

async function requireAdminOrManager() {
  const { user } = await requireSupabaseUser();

  if (!user) return null;

  // الحسابات التي تحمل role=admin في app_metadata
  // تعتبر حسابات إدارة.
  if (user.app_metadata?.role === 'admin') {
    return user;
  }

  // الحسابات القديمة التي يتم تعريفها كـ manager
  // تبقى مسموحة.
  const role = await getTimetableUserRole();

  return role === 'manager' ? user : null;
}

export async function GET() {
  try {
    const user = await requireAdminOrManager();

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح.' },
        { status: 403 }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data, error } =
      await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (error) {
      console.error(
        'Admin accounts list error:',
        error
      );

      return NextResponse.json(
        {
          error: 'تعذر تحميل حسابات الإدارة.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    const admins = (data.users ?? [])
      .filter(
        (item) =>
          item.app_metadata?.role === 'admin'
      )
      .map((item) => ({
        id: item.id,
        email: item.email ?? '',
        name: String(
          item.user_metadata?.name ?? ''
        ),
        createdAt: item.created_at,
        lastSignIn:
          item.last_sign_in_at ?? null,
      }));

    return NextResponse.json({ admins });
  } catch (error) {
    console.error(
      'Admin accounts GET error:',
      error
    );

    return NextResponse.json(
      {
        error: 'تعذر تحميل حسابات الإدارة.',
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminOrManager();

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const email = String(
      body.email ?? ''
    ).trim().toLowerCase();

    const password = String(
      body.password ?? ''
    );

    const name = String(
      body.name ?? ''
    ).trim();

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            'البريد الإلكتروني وكلمة المرور مطلوبة.',
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل.',
        },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    const {
      data: created,
      error,
    } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,

      app_metadata: {
        role: 'admin',
      },

      user_metadata: {
        name,
        role: 'admin',
      },
    });

    if (error || !created.user) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            'تعذر إنشاء حساب الإدارة.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: true,

        user: {
          id: created.user.id,
          email: created.user.email,
          name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'Admin accounts POST error:',
      error
    );

    return NextResponse.json(
      {
        error: 'تعذر إنشاء حساب الإدارة.',
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAdminOrManager();

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const userId = String(
      body.userId ?? ''
    ).trim();

    if (!userId) {
      return NextResponse.json(
        {
          error: 'معرف المستخدم مطلوب.',
        },
        { status: 400 }
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        {
          error:
            'لا يمكنك حذف حسابك الحالي.',
        },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    const {
      data: target,
      error: targetError,
    } =
      await admin.auth.admin.getUserById(
        userId
      );

    if (
      targetError ||
      !target.user
    ) {
      return NextResponse.json(
        {
          error:
            'الحساب غير موجود.',
        },
        { status: 404 }
      );
    }

    if (
      target.user.app_metadata?.role !==
      'admin'
    ) {
      return NextResponse.json(
        {
          error:
            'هذا الحساب ليس حساب إدارة.',
        },
        { status: 400 }
      );
    }

    const { error } =
      await admin.auth.admin.deleteUser(
        userId
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      'Admin accounts DELETE error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'تعذر حذف حساب الإدارة.',
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}