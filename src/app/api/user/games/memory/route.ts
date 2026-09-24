import { NextResponse } from 'next/server';
import { ManageExercisesModel } from '@/lib/models/manageExercises';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const exercises = await ManageExercisesModel.getExercisesByPatientId(userId);
    return NextResponse.json({ success: true, data: exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch exercises' }, { status: 500 });
  }
}
