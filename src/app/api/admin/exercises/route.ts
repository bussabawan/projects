export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { ManageExercisesModel } from '@/lib/models/manageExercises';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search') || '';

    if (page && limit) {
      const result = await ManageExercisesModel.getExercisesPaginated(Number(page), Number(limit), search);
      return NextResponse.json({
        success: true,
        data: result.data,
        total: result.total
      });
    }

    // Default behavior for other places (like dropdowns) that fetch all exercises
    const exercises = await ManageExercisesModel.getExercises();
    
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

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'กรุณากรอกชื่อชุดแบบฝึกหัด' }, { status: 400 });
    }

    const result = await ManageExercisesModel.addExercise(name.trim());
    
    if (result && result.isDuplicateDeleted) {
      return NextResponse.json({ 
        success: false, 
        isDuplicateDeleted: true,
        name: result.name
      });
    }

    revalidateTag('exercises', 'max');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in POST /api/admin/exercises:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

