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

export async function getExerciseImageCount(exerciseId: number): Promise<number> {
  try {
    const { db } = await import('@/lib/db');
    const [rows] = await db.query<import('mysql2').RowDataPacket[]>(
      `SELECT COUNT(pie.photo_id) as count 
       FROM photo_in_exercises pie
       JOIN exercises_data ed ON pie.exercises_id = ed.exercises_id
       WHERE ed.exercises_id = ? AND ed.remove = 0 AND pie.remove = 0`,
      [exerciseId]
    );
    return rows[0].count as number;
  } catch (error) {
    console.error("Failed to fetch exercise image count:", error);
    return 30; // Default fallback
  }
}
