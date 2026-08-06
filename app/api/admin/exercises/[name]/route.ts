import { NextResponse } from 'next/server';
import { ManageUsersModel } from '@/lib/models/manageUsers';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ name: string }> | { name: string } }
) {
  try {
    const resolvedParams = await params;
    const oldName = decodeURIComponent(resolvedParams.name);
    const body = await request.json();
    const action = body.action;

    if (action === 'restore') {
      await ManageUsersModel.restoreExercise(oldName);
      return NextResponse.json({ success: true });
    }

    const newName = body.name;

    if (!newName || newName.trim() === '') {
      return NextResponse.json({ success: false, error: 'กรุณากรอกชื่อชุดแบบฝึกหัด' }, { status: 400 });
    }

    await ManageUsersModel.updateExerciseName(oldName, newName.trim());

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in PUT /api/admin/exercises/[name]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> | { name: string } }
) {
  try {
    const resolvedParams = await params;
    const name = decodeURIComponent(resolvedParams.name);
    
    await ManageUsersModel.deleteExercise(name);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in DELETE /api/admin/exercises/[name]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
