import { NextResponse } from 'next/server';
import { ManageUsersModel } from '@/lib/models/manageUsers';

export async function GET() {
  try {
    const exercises = await ManageUsersModel.getExercises();
    
    return NextResponse.json({
      success: true,
      data: exercises
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/exercises:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
