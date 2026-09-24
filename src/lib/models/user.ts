import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';

export interface User {
  user_id: number;
  user_name: string;
  full_name: string;
  role: number;
  remove: number;
  update_time: Date;
}

export class UserModel {
  /**
   * Find user by username
   */
  static async findByUserName(userName: string): Promise<User | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT user_id, user_name, full_name, role, remove, update_time FROM users_data WHERE user_name = ? AND remove = 0',
      [userName]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as User;
  }

  /**
   * Authenticate user with username and password
   */
  static async authenticate(userName: string, password: string): Promise<User | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT user_id, user_name, full_name, password as stored_password, role, remove, update_time FROM users_data WHERE user_name = ? AND remove = 0',
      [userName]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    const userRow = rows[0];

    // For Google API logins, passwords aren't verified this way.
    // If somehow a google user tries to login with a normal form, they shouldn't be able to unless they have a real password.
    if (userRow.stored_password === 'API Login google') {
       return null; 
    }
    
    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, userRow.stored_password);
    
    if (!isMatch) {
      return null;
    }
    
    // Remove password from returned object
    const { stored_password, ...userWithoutPassword } = userRow;
    void stored_password; // bypass unused-var warning
    return userWithoutPassword as User;
  }

  /**
   * Log a successful login event
   */
  static async logLogin(userId: number): Promise<void> {
    try {
      await db.execute(
        'INSERT INTO login_logs (user_id, login_time) VALUES (?, NOW())',
        [userId]
      );
    } catch (error) {
      console.error('Error logging login:', error);
    }
  }

  /**
   * Get exercises assigned to a user
   */
  static async getAssignedExercises(userId: string): Promise<{ exercises_id: number, exercises_name: string, thumbnail_id?: number }[]> {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT 
        ex.exercises_id, 
        ex.exercises_name,
        (
          SELECT pd.photo_id
          FROM category_in_exercises cie
          JOIN photo_in_category pic ON cie.category_id = pic.category_id
          JOIN photo_data pd ON pic.photo_id = pd.photo_id
          WHERE cie.exercises_id = ex.exercises_id
            AND cie.remove = 0 
            AND pic.remove = 0 
            AND pd.remove = 0
          ORDER BY RAND()
          LIMIT 1
        ) as thumbnail_id
      FROM patient_data p
      JOIN exercises_data ex ON p.exercises_id = ex.exercises_id
      WHERE p.user_id = ? AND p.remove = 0 AND ex.remove = 0
      GROUP BY ex.exercises_id, ex.exercises_name
      ORDER BY ex.exercises_id ASC
    `, [userId]);
    return rows as { exercises_id: number, exercises_name: string, thumbnail_id?: number }[];
  }
}
