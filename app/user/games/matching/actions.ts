"use server";

import { auth } from "@/auth";
import { UserModel } from '@/lib/models/user';
import { ManageExercisesModel } from '@/lib/models/manageExercises';

export async function getUserAssignedExercises() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return [];
    }
    
    return await UserModel.getAssignedExercises(session.user.id);
  } catch (error) {
    console.error("Failed to fetch user assigned exercises:", error);
    return [];
  }
}

export async function getExerciseImageCount(exerciseId: number): Promise<number> {
  try {
    return await ManageExercisesModel.getExerciseImageCount(exerciseId);
  } catch (error) {
    console.error("Failed to fetch exercise image count:", error);
    return 30; // Default fallback
  }
}
