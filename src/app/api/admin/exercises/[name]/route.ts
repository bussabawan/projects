export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { ManageExercisesModel } from '@/lib/models/manageExercises';

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
      await ManageExercisesModel.restoreExercise(oldName);
      revalidateTag('exercises', 'max');
      return NextResponse.json({ success: true });
    }

    const newName = body.name;

    if (!newName || newName.trim() === '') {
      return NextResponse.json({ success: false, error: 'กรุณากรอกชื่อชุดแบบฝึกหัด' }, { status: 400 });
    }

    await ManageExercisesModel.updateExerciseName(oldName, newName.trim());
    revalidateTag('exercises', 'max');
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
    
    await ManageExercisesModel.deleteExercise(name);
    revalidateTag('exercises', 'max');
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
