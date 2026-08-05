import { NextResponse } from 'next/server';
import { ManageUsersModel } from '@/lib/models/manageUsers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search') || '';

    if (page && limit) {
      const result = await ManageUsersModel.getExercisesPaginated(Number(page), Number(limit), search);
      return NextResponse.json({
        success: true,
        data: result.data,
        total: result.total
      });
    }

    // Default behavior for other places (like dropdowns) that fetch all exercises
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
