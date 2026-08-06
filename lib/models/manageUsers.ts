import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

export interface UserInfo {
  user_id: number;
  user_name: string;
  full_name: string;
  role: number;
  update_time: Date;
  exercises_id?: number | string | null;
  exercises_name?: string | null;
}

export interface ExerciseInfo {
  exercises_id: number;
  exercises_name: string;
}

export class ManageUsersModel {
  /**
   * Get paginated list of users by role
   * @param role 1 for Patient, 2 for Staff (or 0 for Admin)
   * @param search search string for name or username
   * @param page current page (1-indexed)
   * @param limit items per page
   */
  static async getUsers(role: number, search: string = '', page: number = 1, limit: number = 10): Promise<{ data: UserInfo[], total: number }> {
    const offset = (page - 1) * limit;
    
    let baseQuery = '';
    let countQuery = '';
    const queryParams: (string | number | boolean | null)[] = [];
    const countParams: (string | number | boolean | null)[] = [];

    // Assuming staff role is 2 or 0. We'll search exactly the role passed.
    if (role === 1) {
      // Patient Query
      baseQuery = `
        SELECT 
          u.user_id, u.user_name, u.full_name, u.role, u.update_time,
          GROUP_CONCAT(p.exercises_id) as exercises_id,
          GROUP_CONCAT(ex.exercises_name SEPARATOR '||') as exercises_name
        FROM users_data u
        LEFT JOIN patient_data p ON u.user_id = p.user_id AND p.remove = 0
        LEFT JOIN exercises_data ex ON p.exercises_id = ex.exercises_id
        WHERE u.role = ? AND u.remove = 0
      `;
      countQuery = `
        SELECT COUNT(u.user_id) as total
        FROM users_data u
        WHERE u.role = ? AND u.remove = 0
      `;
    } else {
      // Staff Query
      baseQuery = `
        SELECT 
          u.user_id, u.user_name, u.full_name, u.role, u.update_time
        FROM users_data u
        WHERE u.role = ? AND u.remove = 0
      `;
      countQuery = `
        SELECT COUNT(u.user_id) as total
        FROM users_data u
        WHERE u.role = ? AND u.remove = 0
      `;
    }
    
    queryParams.push(role);
    countParams.push(role);

    if (search) {
      const searchPattern = `%${search}%`;
      baseQuery += ` AND (u.user_name LIKE ? OR u.full_name LIKE ?)`;
      countQuery += ` AND (u.user_name LIKE ? OR u.full_name LIKE ?)`;
      queryParams.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    if (role === 1) {
      baseQuery += ` GROUP BY u.user_id, u.user_name, u.full_name, u.role, u.update_time`;
    }

    baseQuery += ` ORDER BY u.user_id ASC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [rows] = await db.query<RowDataPacket[]>(baseQuery, queryParams);
    const [countRows] = await db.query<RowDataPacket[]>(countQuery, countParams);

    return {
      data: rows as UserInfo[],
      total: countRows[0].total as number,
    };
  }

  /**
   * Create a new user (and patient data if role === 1)
   */
  static async createUser(userData: { user_name: string, full_name: string, role: number, password?: string, exercises_id?: number | number[] }): Promise<number> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Ensure no duplicate username
      const [existing] = await connection.execute<RowDataPacket[]>(
        'SELECT user_id FROM users_data WHERE user_name = ? AND remove = 0',
        [userData.user_name]
      );
      if (existing.length > 0) {
        throw new Error('Username already exists');
      }

      // Check if full_name OR user_name exists and is removed
      const [removedUser] = await connection.execute<RowDataPacket[]>(
        'SELECT user_id FROM users_data WHERE (full_name = ? OR user_name = ?) AND remove = 1 LIMIT 1',
        [userData.full_name, userData.user_name]
      );
      if (removedUser.length > 0) {
        throw new Error(`RESTORE_REQUIRED:${removedUser[0].user_id}`);
      }

      let finalPassword = userData.password || userData.user_name; // Default password to username if not provided
      if (finalPassword !== 'API Login google') {
        const salt = await bcrypt.genSalt(10);
        finalPassword = await bcrypt.hash(finalPassword, salt);
      }
      
      const [userResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO users_data (user_name, full_name, password, role, remove, update_time) VALUES (?, ?, ?, ?, 0, NOW())',
        [userData.user_name, userData.full_name, finalPassword, userData.role]
      );

      const userId = userResult.insertId;

      if (userData.role === 1 && userData.exercises_id) {
        let exercisesArray: number[] = [];
        if (Array.isArray(userData.exercises_id)) {
          exercisesArray = userData.exercises_id;
        } else {
          exercisesArray = [userData.exercises_id];
        }

        if (exercisesArray.length > 0) {
          const insertQueries = exercisesArray.map(exId => 
            connection.execute('INSERT INTO patient_data (user_id, exercises_id, remove) VALUES (?, ?, 0)', [userId, exId])
          );
          await Promise.all(insertQueries);
        }
      }

      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update existing user
   */
  static async updateUser(userId: number, userData: { user_name?: string, full_name?: string, role?: number, password?: string, exercises_id?: number | number[] }): Promise<boolean> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const updateFields: string[] = [];
      const updateValues: (string | number | boolean | null)[] = [];

      if (userData.user_name) {
        // Check for duplicates
        const [existing] = await connection.execute<RowDataPacket[]>(
          'SELECT user_id FROM users_data WHERE user_name = ? AND user_id != ? AND remove = 0',
          [userData.user_name, userId]
        );
        if (existing.length > 0) {
          throw new Error('Username already exists');
        }
        updateFields.push('user_name = ?');
        updateValues.push(userData.user_name);
      }
      if (userData.full_name) {
        updateFields.push('full_name = ?');
        updateValues.push(userData.full_name);
      }
      if (userData.password) {
        let finalPassword = userData.password;
        if (finalPassword !== 'API Login google') {
          const salt = await bcrypt.genSalt(10);
          finalPassword = await bcrypt.hash(finalPassword, salt);
        }
        updateFields.push('password = ?');
        updateValues.push(finalPassword);
      }
      
      if (updateFields.length > 0) {
        updateFields.push('update_time = NOW()');
        updateValues.push(userId);
        await connection.execute(
          `UPDATE users_data SET ${updateFields.join(', ')} WHERE user_id = ?`,
          updateValues
        );
      }

      // Check if user is patient
      const [userRows] = await connection.execute<RowDataPacket[]>(
        'SELECT role FROM users_data WHERE user_id = ?', [userId]
      );
      
      if (userRows.length > 0 && userRows[0].role === 1 && userData.exercises_id !== undefined) {
        let exercisesArray: number[] = [];
        if (Array.isArray(userData.exercises_id)) {
          exercisesArray = userData.exercises_id;
        } else if (userData.exercises_id !== null) {
          exercisesArray = [userData.exercises_id];
        }

        // Delete existing patient_data rows for this user
        await connection.execute(
          'DELETE FROM patient_data WHERE user_id = ?',
          [userId]
        );
        
        // Insert new exercises
        if (exercisesArray.length > 0) {
          const insertQueries = exercisesArray.map(exId => 
            connection.execute('INSERT INTO patient_data (user_id, exercises_id, remove) VALUES (?, ?, 0)', [userId, exId])
          );
          await Promise.all(insertQueries);
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Soft delete user
   */
  static async deleteUser(userId: number): Promise<boolean> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        'UPDATE users_data SET remove = 1 WHERE user_id = ?',
        [userId]
      );

      // Also soft delete patient data if it exists
      await connection.execute(
        'UPDATE patient_data SET remove = 1 WHERE user_id = ?',
        [userId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Restore user
   */
  static async restoreUser(userId: number): Promise<boolean> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        'UPDATE users_data SET remove = 0 WHERE user_id = ?',
        [userId]
      );

      // Also restore patient data if it exists
      await connection.execute(
        'UPDATE patient_data SET remove = 0 WHERE user_id = ?',
        [userId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all exercises for dropdown selection
   */
  static async getExercises(): Promise<ExerciseInfo[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT MIN(exercises_id) as exercises_id, exercises_name FROM exercises_data WHERE remove = 0 GROUP BY exercises_name ORDER BY MIN(exercises_id) ASC'
    );
    return rows as ExerciseInfo[];
  }

  /**
   * Get paginated list of exercises with search
   */
  static async getExercisesPaginated(page: number, limit: number, search: string = ''): Promise<{ data: ExerciseInfo[], total: number }> {
    const offset = (page - 1) * limit;
    let baseQuery = 'SELECT MIN(exercises_id) as exercises_id, exercises_name FROM exercises_data WHERE remove = 0';
    let countQuery = 'SELECT COUNT(DISTINCT exercises_name) as total FROM exercises_data WHERE remove = 0';
    const queryParams: (string | number)[] = [];
    
    if (search) {
      const searchPattern = `%${search}%`;
      baseQuery += ' AND exercises_name LIKE ?';
      countQuery += ' AND exercises_name LIKE ?';
      queryParams.push(searchPattern);
    }
    
    baseQuery += ' GROUP BY exercises_name ORDER BY MIN(exercises_id) DESC LIMIT ? OFFSET ?';
    
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
  static async addExercise(name: string): Promise<any> {
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
      'INSERT INTO exercises_data (exercises_name, photo_id, remove) VALUES (?, NULL, 0)',
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
      'SELECT photo_id FROM exercises_data WHERE exercises_name = ? AND remove = 0 AND photo_id IS NOT NULL',
      [name]
    );
    return rows.map(r => r.photo_id as number);
  }

  /**
   * Update selected photos for an exercise
   */
  static async updateExerciseImages(name: string, newPhotoIds: number[]): Promise<void> {
    const [existingRows] = await db.query<RowDataPacket[]>(
      'SELECT exercises_id FROM exercises_data WHERE exercises_name = ?',
      [name]
    );

    if (existingRows.length === 0) {
      throw new Error("ไม่พบชุดแบบฝึกหัดนี้");
    }

    // Find the primary ID (the minimum exercises_id)
    const primaryRow = existingRows.reduce((min, row) => row.exercises_id < min.exercises_id ? row : min, existingRows[0]);
    const primaryId = primaryRow.exercises_id;
    
    // Delete all rows EXCEPT primaryId
    await db.execute('DELETE FROM exercises_data WHERE exercises_name = ? AND exercises_id != ?', [name, primaryId]);
    
    if (newPhotoIds.length === 0) {
      // Set primaryId to have photo_id = NULL
      await db.execute('UPDATE exercises_data SET photo_id = NULL, remove = 0 WHERE exercises_id = ?', [primaryId]);
    } else {
      // Set primaryId to the first photo
      await db.execute('UPDATE exercises_data SET photo_id = ?, remove = 0 WHERE exercises_id = ?', [newPhotoIds[0], primaryId]);
      
      // Insert the rest of the photos
      for (let i = 1; i < newPhotoIds.length; i++) {
        await db.execute('INSERT INTO exercises_data (exercises_name, photo_id, remove) VALUES (?, ?, 0)', [name, newPhotoIds[i]]);
      }
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
