export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { ManageUsersModel } from '@/lib/models/manageUsers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = parseInt(searchParams.get('role') || '1', 10);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await ManageUsersModel.getUsers(role, search, page, limit);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in GET /api/admin/users:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.user_name || !body.full_name || body.role === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const roleId = parseInt(body.role, 10);
    const password = roleId === 2 ? 'API Login google' : body.password;

    if (roleId === 1 && (!body.exercises_id || (Array.isArray(body.exercises_id) && body.exercises_id.length === 0))) {
      return NextResponse.json(
        { success: false, error: 'เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธเธธเธ”เนเธเธเธเธถเธเธซเธฑเธ”เน€เธฃเธดเนเธกเธ•เนเธเธญเธขเนเธฒเธเธเนเธญเธข 1 เธเธธเธ”' },
        { status: 400 }
      );
    }

      let parsedExercisesId: number | number[] | undefined = undefined;
      if (body.exercises_id !== undefined && body.exercises_id !== null) {
        if (Array.isArray(body.exercises_id)) {
          parsedExercisesId = body.exercises_id.map((id: string | number) => typeof id === 'string' ? parseInt(id, 10) : id);
        } else {
          parsedExercisesId = parseInt(body.exercises_id, 10);
        }
      }

    const userId = await ManageUsersModel.createUser({
      user_name: body.user_name,
      full_name: body.full_name,
      role: roleId,
      password: password,
      exercises_id: parsedExercisesId
    });

    revalidateTag('users', 'max');
    revalidateTag('patient-stats', 'max');
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: { user_id: userId }
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in POST /api/admin/users:', err);
    if (err.message && err.message.startsWith('RESTORE_REQUIRED:')) {
      const existingUserId = err.message.split(':')[1];
      return NextResponse.json(
        { success: false, requireRestore: true, existingUserId: parseInt(existingUserId, 10) },
        { status: 409 }
      );
    }
    const status = err.message === 'Username already exists' ? 409 : 500;
    const errorMessage = err.message === 'Username already exists' 
      ? 'เธฃเธซเธฑเธชเธเธนเนเธเนเธงเธขเธซเธฃเธทเธญเธญเธตเน€เธกเธฅเธเธตเนเธกเธตเธญเธขเธนเนเนเธเธฃเธฐเธเธเนเธฅเนเธง' 
      : err.message || 'Internal Server Error';
      
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}
