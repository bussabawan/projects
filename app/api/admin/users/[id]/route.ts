import { NextResponse } from 'next/server';
import { ManageUsersModel } from '@/lib/models/manageUsers';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    
    // Convert string fields if needed
    if (body.role !== undefined) {
      body.role = parseInt(body.role, 10);
      if (body.role === 2) {
        body.password = 'API Login google';
      }
    }
    if (body.exercises_id !== undefined && body.exercises_id !== null) {
      body.exercises_id = parseInt(body.exercises_id, 10);
    }

    await ManageUsersModel.updateUser(userId, body);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/users/[id]:', error);
    const status = error.message === 'Username already exists' ? 409 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    await ManageUsersModel.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
