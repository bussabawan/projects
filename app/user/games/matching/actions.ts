"use server";

import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { auth } from "@/auth";

export async function getUserAssignedExercises() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return [];
    }
    const userId = session.user.id;

    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT DISTINCT ex.exercises_id, ex.exercises_name 
      FROM patient_data p
      JOIN exercises_data ex ON p.exercises_id = ex.exercises_id
      WHERE p.user_id = ? AND p.remove = 0 AND ex.remove = 0
      ORDER BY ex.exercises_id ASC
    `, [userId]);

    return rows as { exercises_id: number, exercises_name: string }[];
  } catch (error) {
    console.error("Failed to fetch user assigned exercises:", error);
    return [];
  }
}
