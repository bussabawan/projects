'use server';

import { ManageExercisesModel } from '@/lib/models/manageExercises';
import { auth } from '@/auth';

export async function getExercisesData() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = parseInt(session.user.id, 10);
    const exercises = await ManageExercisesModel.getExercisesByPatientId(userId);
    return { success: true, data: exercises };
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return { success: false, error: 'Failed to fetch exercises' };
  }
}
