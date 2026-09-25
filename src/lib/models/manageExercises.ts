import { RowDataPacket } from 'mysql2/promise';
import { BaseModel } from './BaseModel';

export interface ExerciseInfo {
  exercises_id: number;
  exercises_name: string;
  thumbnail_id?: number;
}

export class ManageExercisesModel extends BaseModel {
  /**
   * Get all exercises for dropdown selection
   */
  static getExercises = async (): Promise<ExerciseInfo[]> => {
    const rows = await this.query<RowDataPacket>(
      'SELECT exercises_id, exercises_name FROM exercises_data WHERE remove = 0 ORDER BY exercises_id ASC'
    );
    return rows as ExerciseInfo[];
  };

  /**
   * Get exercises assigned to a specific patient
   */
  static async getExercisesByPatientId(userId: number): Promise<ExerciseInfo[]> {
    const rows = await this.query<RowDataPacket>(
      `SELECT 
         ed.exercises_id, 
         ed.exercises_name,
         (
           SELECT pd.photo_id
           FROM category_in_exercises cie
           JOIN photo_in_category pic ON cie.category_id = pic.category_id
           JOIN photo_data pd ON pic.photo_id = pd.photo_id
           WHERE cie.exercises_id = ed.exercises_id
             AND cie.remove = 0 
             AND pic.remove = 0 
             AND pd.remove = 0
           ORDER BY RAND()
           LIMIT 1
         ) as thumbnail_id
       FROM exercises_data ed
       JOIN patient_data pd ON ed.exercises_id = pd.exercises_id
       WHERE pd.user_id = ? AND pd.remove = 0 AND ed.remove = 0
       GROUP BY ed.exercises_id, ed.exercises_name
       ORDER BY ed.exercises_id ASC`,
      [userId]
    );
    return rows as ExerciseInfo[];
  }

  /**
   * Get paginated list of exercises with search
   */
  static getExercisesPaginated = async (page: number, limit: number, search: string = ''): Promise<{ data: ExerciseInfo[], total: number }> => {
    const offset = (page - 1) * limit;
    let baseQuery = 'SELECT exercises_id, exercises_name FROM exercises_data WHERE remove = 0';
    let countQuery = 'SELECT COUNT(exercises_id) as total FROM exercises_data WHERE remove = 0';
    const queryParams: (string | number)[] = [];
    
    if (search) {
      const searchPattern = `%${search}%`;
      baseQuery += ' AND LOWER(exercises_name) COLLATE utf8mb4_bin LIKE LOWER(?) COLLATE utf8mb4_bin';
      countQuery += ' AND LOWER(exercises_name) COLLATE utf8mb4_bin LIKE LOWER(?) COLLATE utf8mb4_bin';
      queryParams.push(searchPattern);
    }
    
    baseQuery += ' ORDER BY exercises_id DESC LIMIT ? OFFSET ?';
    
    const rows = await this.query<RowDataPacket>(baseQuery, [...queryParams, limit, offset]);
    const countRows = await this.query<RowDataPacket>(countQuery, queryParams);
    
    return {
      data: rows as ExerciseInfo[],
      total: countRows[0].total as number,
    };
  };

  /**
   * Add a new exercise set (empty)
   */
  static async addExercise(name: string): Promise<{ success?: boolean; isDuplicateDeleted?: boolean; name?: string }> {
    const existing = await this.query<RowDataPacket>(
      'SELECT exercises_id FROM exercises_data WHERE exercises_name = ? AND remove = 0',
      [name]
    );
    if (existing.length > 0) {
      throw new Error("มีชุดแบบฝึกหัดชื่อนี้อยู่ในระบบแล้ว");
    }

    const removed = await this.query<RowDataPacket>(
      'SELECT exercises_name FROM exercises_data WHERE exercises_name = ? AND remove = 1 LIMIT 1',
      [name]
    );
    if (removed.length > 0) {
      return { isDuplicateDeleted: true, name: name };
    }

    await this.execute(
      'INSERT INTO exercises_data (exercises_name, remove) VALUES (?, 0)',
      [name]
    );
    return { success: true };
  }

  /**
   * Restore exercise
   */
  static async restoreExercise(name: string): Promise<void> {
    return this.transaction(async (connection) => {
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
        await connection.execute(
          `UPDATE category_in_exercises SET remove = 0 WHERE exercises_id IN (${placeholders})`,
          ids
        );
      }
    });
  }

  /**
   * Get selected photos for an exercise
   */
  static async getExerciseImages(name: string): Promise<number[]> {
    const rows = await this.query<RowDataPacket>(
      `SELECT pie.photo_id 
       FROM photo_in_exercises pie
       JOIN exercises_data ed ON pie.exercises_id = ed.exercises_id
       JOIN photo_data pd ON pie.photo_id = pd.photo_id
       WHERE ed.exercises_name = ? AND ed.remove = 0 AND pie.remove = 0 AND pd.remove = 0`,
      [name]
    );
    return rows.map(r => r.photo_id as number);
  }

  /**
   * Get selected categories for an exercise
   */
  static async getExerciseCategories(name: string): Promise<number[]> {
    const rows = await this.query<RowDataPacket>(
      `SELECT cie.category_id 
       FROM category_in_exercises cie
       JOIN exercises_data ed ON cie.exercises_id = ed.exercises_id
       JOIN category_data cd ON cie.category_id = cd.category_id
       WHERE ed.exercises_name = ? AND ed.remove = 0 AND cie.remove = 0 AND cd.remove = 0`,
      [name]
    );
    return rows.map(r => r.category_id as number);
  }

  /**
   * Get image count for an exercise
   */
  static async getExerciseImageCount(exerciseId: number): Promise<number> {
    const rows = await this.query<RowDataPacket>(
      `SELECT COUNT(pie.photo_id) as count 
       FROM photo_in_exercises pie
       JOIN exercises_data ed ON pie.exercises_id = ed.exercises_id
       JOIN photo_data pd ON pie.photo_id = pd.photo_id
       WHERE ed.exercises_id = ? AND ed.remove = 0 AND pie.remove = 0 AND pd.remove = 0`,
      [exerciseId]
    );
    return rows[0].count as number;
  }

  /**
   * Update selected photos for an exercise
   */
  static async updateExerciseImages(name: string, newPhotoIds: number[]): Promise<void> {
    const existingRows = await this.query<RowDataPacket>(
      'SELECT exercises_id FROM exercises_data WHERE exercises_name = ? AND remove = 0',
      [name]
    );

    if (existingRows.length === 0) {
      throw new Error("ไม่พบชุดแบบฝึกหัดนี้");
    }

    const exercisesId = existingRows[0].exercises_id;
    
    return this.transaction(async (connection) => {
      // Delete existing photos for this exercise in photo_in_exercises
      await connection.execute('DELETE FROM photo_in_exercises WHERE exercises_id = ?', [exercisesId]);
      
      // Insert new photos
      for (const photoId of newPhotoIds) {
        await connection.execute(
          'INSERT INTO photo_in_exercises (exercises_id, photo_id, remove) VALUES (?, ?, 0)',
          [exercisesId, photoId]
        );
      }
    });
  }

  /**
   * Update selected categories for an exercise
   */
  static async updateExerciseCategories(name: string, newCategoryIds: number[]): Promise<void> {
    const existingRows = await this.query<RowDataPacket>(
      'SELECT exercises_id FROM exercises_data WHERE exercises_name = ? AND remove = 0',
      [name]
    );

    if (existingRows.length === 0) {
      throw new Error("ไม่พบชุดแบบฝึกหัดนี้");
    }

    const exercisesId = existingRows[0].exercises_id;
    
    return this.transaction(async (connection) => {
      // Delete existing categories for this exercise
      await connection.execute('DELETE FROM category_in_exercises WHERE exercises_id = ?', [exercisesId]);
      
      // Insert new categories
      for (const categoryId of newCategoryIds) {
        await connection.execute(
          'INSERT INTO category_in_exercises (exercises_id, category_id, remove) VALUES (?, ?, 0)',
          [exercisesId, categoryId]
        );
      }
    });
  }

  /**
   * Update exercise name
   */
  static async updateExerciseName(oldName: string, newName: string): Promise<void> {
    const existing = await this.query<RowDataPacket>(
      'SELECT exercises_id FROM exercises_data WHERE exercises_name = ? AND remove = 0',
      [newName]
    );
    if (existing.length > 0 && oldName !== newName) {
      throw new Error("มีชุดแบบฝึกหัดชื่อนี้อยู่ในระบบแล้ว");
    }

    await this.execute(
      'UPDATE exercises_data SET exercises_name = ? WHERE exercises_name = ?',
      [newName, oldName]
    );
  }

  /**
   * Delete exercise (Soft delete)
   */
  static async deleteExercise(name: string): Promise<void> {
    return this.transaction(async (connection) => {
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
        await connection.execute(
          `UPDATE category_in_exercises SET remove = 1 WHERE exercises_id IN (${placeholders})`,
          ids
        );
      }
    });
  }
}
