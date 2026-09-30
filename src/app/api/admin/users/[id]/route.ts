export const dynamic = 'force-dynamic';
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
      body.role = Number(body.role);
      if (body.role === 2) {
        body.password = 'API Login google';
      }
    }
    if (body.exercises_id !== undefined && body.exercises_id !== null) {
      if (Array.isArray(body.exercises_id)) {
        body.exercises_id = body.exercises_id.map(Number);
      } else {
        body.exercises_id = Number(body.exercises_id);
      }
    }

    await ManageUsersModel.updateUser(userId, body);

    revalidateTag('users');
    revalidateTag('patient-stats');

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in PUT /api/admin/users/[id]:', err);
    if (err.message && err.message.startsWith('RESTORE_REQUIRED:')) {
      const existingUserId = err.message.split(':')[1];
      return NextResponse.json(
        { success: false, requireRestore: true, existingUserId: parseInt(existingUserId, 10) },
        { status: 409 }
      );
    }
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
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    await ManageUsersModel.deleteUser(userId);

    revalidateTag('users');
    revalidateTag('patient-stats');

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
      
      revalidateTag('users');
      revalidateTag('patient-stats');
      
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
