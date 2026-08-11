import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface ExerciseInfo {
  exercises_id: number;
  exercises_name: string;
}

export class ManageExercisesModel {
  /**
   * Get all exercises for dropdown selection
   */
  static async getExercises(): Promise<ExerciseInfo[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT exercises_id, exercises_name FROM exercises_data WHERE remove = 0 ORDER BY exercises_id ASC'
    );
    return rows as ExerciseInfo[];
  }

  /**
   * Get paginated list of exercises with search
   */
  static async getExercisesPaginated(page: number, limit: number, search: string = ''): Promise<{ data: ExerciseInfo[], total: number }> {
    const offset = (page - 1) * limit;
    let baseQuery = 'SELECT exercises_id, exercises_name FROM exercises_data WHERE remove = 0';
    let countQuery = 'SELECT COUNT(exercises_id) as total FROM exercises_data WHERE remove = 0';
    const queryParams: (string | number)[] = [];
    
    if (search) {
      const searchPattern = `%${search}%`;
      baseQuery += ' AND exercises_name LIKE ?';
      countQuery += ' AND exercises_name LIKE ?';
      queryParams.push(searchPattern);
    }
    
    baseQuery += ' ORDER BY exercises_id DESC LIMIT ? OFFSET ?';
    
    const [rows] = await db.query<RowDataPacket[]>(baseQuery, [...queryParams, limit, offset]);
    const [countRows] = await db.query<RowDataPacket[]>(countQuery, queryParams);
    
    return {
      data: rows as ExerciseInfo[],
      total: countRows[0].total as number,
    };
  }

  /**
   * Add a new exercise set (empty)
   */
  static async addExercise(name: string): Promise<{ success?: boolean; isDuplicateDeleted?: boolean; name?: string }> {
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT exercises_id FROM exercises_data WHERE exercises_name = ? AND remove = 0',
      [name]
    );
    if (existing.length > 0) {
      throw new Error("มีชุดแบบฝึกหัดชื่อนี้อยู่ในระบบแล้ว");
    }

    const [removed] = await db.query<RowDataPacket[]>(
      'SELECT exercises_name FROM exercises_data WHERE exercises_name = ? AND remove = 1 LIMIT 1',
      [name]
    );
    if (removed.length > 0) {
      return { isDuplicateDeleted: true, name: name };
    }

    await db.execute(
      'INSERT INTO exercises_data (exercises_name, remove) VALUES (?, 0)',
      [name]
    );
    return { success: true };
  }

  /**
   * Restore exercise
   */
  static async restoreExercise(name: string): Promise<void> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        'UPDATE exercises_data SET remove = 0 WHERE exercises_name = ?',
        [name]
      );
      
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT exercises_id FROM exercises_data WHERE exercises_name = ?',
        [name]
      );
      if (rows.length > 0) {
        const ids = rows.map(r => r.exercises_id);
        const placeholders = ids.map(() => '?').join(',');
        await connection.execute(
          `UPDATE patient_data SET remove = 0 WHERE exercises_id IN (${placeholders})`,
          ids
        );
        await connection.execute(
          `UPDATE photo_in_exercises SET remove = 0 WHERE exercises_id IN (${placeholders})`,
          ids
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get selected photos for an exercise
   */
  static async getExerciseImages(name: string): Promise<number[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pie.photo_id 
       FROM photo_in_exercises pie
       JOIN exercises_data ed ON pie.exercises_id = ed.exercises_id
       WHERE ed.exercises_name = ? AND ed.remove = 0 AND pie.remove = 0`,
      [name]
    );
    return rows.map(r => r.photo_id as number);
  }

  /**
   * Update selected photos for an exercise
   */
  static async updateExerciseImages(name: string, newPhotoIds: number[]): Promise<void> {
    const [existingRows] = await db.query<RowDataPacket[]>(
      'SELECT exercises_id FROM exercises_data WHERE exercises_name = ? AND remove = 0',
      [name]
    );

    if (existingRows.length === 0) {
      throw new Error("ไม่พบชุดแบบฝึกหัดนี้");
    }

    const exercisesId = existingRows[0].exercises_id;
    
    // Delete existing photos for this exercise in photo_in_exercises
    await db.execute('DELETE FROM photo_in_exercises WHERE exercises_id = ?', [exercisesId]);
    
    // Insert new photos
    for (const photoId of newPhotoIds) {
      await db.execute(
        'INSERT INTO photo_in_exercises (exercises_id, photo_id, remove) VALUES (?, ?, 0)',
        [exercisesId, photoId]
      );
    }
  }

  /**
   * Update exercise name
   */
  static async updateExerciseName(oldName: string, newName: string): Promise<void> {
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT exercises_id FROM exercises_data WHERE exercises_name = ? AND remove = 0',
      [newName]
    );
    if (existing.length > 0 && oldName !== newName) {
      throw new Error("มีชุดแบบฝึกหัดชื่อนี้อยู่ในระบบแล้ว");
    }

    await db.execute(
      'UPDATE exercises_data SET exercises_name = ? WHERE exercises_name = ?',
      [newName, oldName]
    );
  }

  /**
   * Delete exercise (Soft delete)
   */
  static async deleteExercise(name: string): Promise<void> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        'UPDATE exercises_data SET remove = 1 WHERE exercises_name = ?',
        [name]
      );
      
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT exercises_id FROM exercises_data WHERE exercises_name = ?',
        [name]
      );
      if (rows.length > 0) {
        const ids = rows.map(r => r.exercises_id);
        const placeholders = ids.map(() => '?').join(',');
        await connection.execute(
          `UPDATE patient_data SET remove = 1 WHERE exercises_id IN (${placeholders})`,
          ids
        );
        await connection.execute(
          `UPDATE photo_in_exercises SET remove = 1 WHERE exercises_id IN (${placeholders})`,
          ids
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
