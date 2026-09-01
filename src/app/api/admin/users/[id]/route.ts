import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
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
      if (Array.isArray(body.exercises_id)) {
        body.exercises_id = body.exercises_id.map((id: string | number) => typeof id === 'string' ? parseInt(id, 10) : id);
      } else {
        body.exercises_id = parseInt(body.exercises_id, 10);
      }
    }

    await ManageUsersModel.updateUser(userId, body);

    revalidateTag('users', 'max');
    revalidateTag('patient-stats', 'max');

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in PUT /api/admin/users/[id]:', err);
    const status = err.message === 'Username already exists' ? 409 : 500;
    const errorMessage = err.message === 'Username already exists' 
      ? 'รหัสผู้ป่วยหรืออีเมลนี้มีอยู่ในระบบแล้ว' 
      : err.message || 'Internal Server Error';
    return NextResponse.json(
      { success: false, error: errorMessage },
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

    revalidateTag('users', 'max');
    revalidateTag('patient-stats', 'max');

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in DELETE /api/admin/users/[id]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    if (body.action === 'restore') {
      await ManageUsersModel.restoreUser(userId);
      if (body.data) {
        // Convert string fields if needed
        if (body.data.role !== undefined) {
          body.data.role = parseInt(body.data.role, 10);
        }
        if (body.data.exercises_id !== undefined && body.data.exercises_id !== null) {
          if (Array.isArray(body.data.exercises_id)) {
            body.data.exercises_id = body.data.exercises_id.map((exId: string | number) => typeof exId === 'string' ? parseInt(exId, 10) : exId);
          } else {
            body.data.exercises_id = parseInt(body.data.exercises_id, 10);
          }
        }
        await ManageUsersModel.updateUser(userId, body.data);
      }
      
      revalidateTag('users', 'max');
      revalidateTag('patient-stats', 'max');
      
      return NextResponse.json({
        success: true,
        message: 'User restored successfully'
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in PATCH /api/admin/users/[id]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
