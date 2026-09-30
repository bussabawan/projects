import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { BaseModel } from './BaseModel';

export interface UserInfo {
  user_id: number;
  user_name: string;
  full_name: string;
  role: number;
  update_time: Date;
  exercises_id?: number | string | null;
  exercises_name?: string | null;
}

export class ManageUsersModel extends BaseModel {
  /**
   * Get paginated list of users by role
   * @param role 1 for Patient, 2 for Staff (or 0 for Admin)
   * @param search search string for name or username
   * @param page current page (1-indexed)
   * @param limit items per page
   */
  static getUsers = async (role: number, search: string = '', page: number = 1, limit: number = 10): Promise<{ data: UserInfo[], total: number }> => {
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
        LEFT JOIN exercises_data ex ON p.exercises_id = ex.exercises_id AND ex.remove = 0
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

    const rows = await this.query<RowDataPacket>(baseQuery, queryParams);
    const countRows = await this.query<RowDataPacket>(countQuery, countParams);

    return {
      data: rows as UserInfo[],
      total: countRows[0].total as number,
    };
  };

  /**
   * Create a new user (and patient data if role === 1)
   */
  static async createUser(userData: { user_name: string, full_name: string, role: number, password?: string, exercises_id?: number | number[] }): Promise<number> {
    return this.transaction(async (connection) => {
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

      return userId;
    });
  }

  /**
   * Update existing user
   */
  static async updateUser(userId: number, userData: { user_name?: string, full_name?: string, role?: number, password?: string, exercises_id?: number | number[] }): Promise<boolean> {
    return this.transaction(async (connection) => {
      const updateFields: string[] = [];
      const updateValues: (string | number | boolean | null)[] = [];

      if (userData.user_name) {
        // Check for active duplicates
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

      // Check for soft-deleted duplicates
      const checkParams: any[] = [];
      const checkConditions: string[] = [];
      if (userData.user_name) {
        checkConditions.push('user_name = ?');
        checkParams.push(userData.user_name);
      }
      if (userData.full_name) {
        checkConditions.push('full_name = ?');
        checkParams.push(userData.full_name);
      }
      
      if (checkConditions.length > 0) {
        checkParams.push(userId);
        const [removed] = await connection.execute<RowDataPacket[]>(
          `SELECT user_id FROM users_data WHERE (${checkConditions.join(' OR ')}) AND user_id != ? AND remove = 1 LIMIT 1`,
          checkParams
        );
        if (removed.length > 0) {
          throw new Error(`RESTORE_REQUIRED:${removed[0].user_id}`);
        }
      }

      if (userData.full_name) {
        updateFields.push('full_name = ?');
        updateValues.push(userData.full_name);
      }
      if (userData.role !== undefined) {
        updateFields.push('role = ?');
        updateValues.push(userData.role);
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

      return true;
    });
  }

  /**
   * Soft delete user
   */
  static async deleteUser(userId: number): Promise<boolean> {
    return this.transaction(async (connection) => {
      await connection.execute(
        'UPDATE users_data SET remove = 1 WHERE user_id = ?',
        [userId]
      );

      // Also soft delete patient data if it exists
      await connection.execute(
        'UPDATE patient_data SET remove = 1 WHERE user_id = ?',
        [userId]
      );

      return true;
    });
  }

  /**
   * Restore user
   */
  static async restoreUser(userId: number): Promise<boolean> {
    return this.transaction(async (connection) => {
      await connection.execute(
        'UPDATE users_data SET remove = 0 WHERE user_id = ?',
        [userId]
      );

      // Also restore patient data if it exists
      await connection.execute(
        'UPDATE patient_data SET remove = 0 WHERE user_id = ?',
        [userId]
      );

      return true;
    });
  }

}
