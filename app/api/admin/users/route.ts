import { NextResponse } from 'next/server';
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
  } catch (error: any) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
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
        { success: false, error: 'กรุณาเลือกชุดแบบฝึกหัดเริ่มต้นอย่างน้อย 1 ชุด' },
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

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: { user_id: userId }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/users:', error);
    if (error.message && error.message.startsWith('RESTORE_REQUIRED:')) {
      const existingUserId = error.message.split(':')[1];
      return NextResponse.json(
        { success: false, requireRestore: true, existingUserId: parseInt(existingUserId, 10) },
        { status: 409 }
      );
    }
    const status = error.message === 'Username already exists' ? 409 : 500;
    const errorMessage = error.message === 'Username already exists' 
      ? 'รหัสผู้ป่วยหรืออีเมลนี้มีอยู่ในระบบแล้ว' 
      : error.message || 'Internal Server Error';
      
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}
