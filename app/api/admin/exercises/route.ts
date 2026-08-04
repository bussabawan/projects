import { NextResponse } from 'next/server';
import { ManageUsersModel } from '@/lib/models/manageUsers';

export async function GET() {
  try {
    const exercises = await ManageUsersModel.getExercises();
    
    return NextResponse.json({
      success: true,
      data: exercises
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in GET /api/admin/exercises:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
