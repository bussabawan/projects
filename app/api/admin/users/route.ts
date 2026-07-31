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

    const userId = await ManageUsersModel.createUser({
      user_name: body.user_name,
      full_name: body.full_name,
      role: parseInt(body.role, 10),
      password: body.password,
      exercises_id: body.exercises_id ? parseInt(body.exercises_id, 10) : undefined
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: { user_id: userId }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/users:', error);
    const status = error.message === 'Username already exists' ? 409 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status }
    );
  }
}
