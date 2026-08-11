"use server";

import { auth } from "@/auth";
import { UserModel } from '@/lib/models/user';

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
