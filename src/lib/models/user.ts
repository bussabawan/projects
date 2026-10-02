import { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { BaseModel } from './BaseModel';

export interface User {
  user_id: number;
  user_name: string;
  full_name: string;
  role: number;
  login_quota?: number;
  remove: number;
  update_time: Date;
}

export interface AuthenticateResult {
  user: User | null;
  isLocked?: boolean;
  remainingAttempts?: number;
  errorType?: 'NOT_FOUND' | 'LOCKED' | 'STAFF_GOOGLE_ONLY' | 'WRONG_PASSWORD';
}

export class UserModel extends BaseModel {
  /**
   * Find user by username
   */
  static async findByUserName(userName: string): Promise<User | null> {
    const userRow = await this.findOne<User & RowDataPacket>(
      'SELECT user_id, user_name, full_name, role, login_quota, remove, update_time FROM users_data WHERE user_name = ? AND (remove = 0 OR remove IS NULL)',
      [userName]
    );
    
    return userRow;
  }

  /**
   * Get current login quota (failed attempts) by username
   */
  static async getLoginQuota(userName: string): Promise<number | null> {
    const userRow = await this.findOne<{ login_quota: number } & RowDataPacket>(
      'SELECT login_quota FROM users_data WHERE user_name = ? AND (remove = 0 OR remove IS NULL)',
      [userName]
    );
    return userRow ? (userRow.login_quota ?? 0) : null;
  }

  /**
   * Reset login quota to 0 for a user
   */
  static async resetLoginQuota(userId: number): Promise<void> {
    await this.execute(
      'UPDATE users_data SET login_quota = 0 WHERE user_id = ?',
      [userId]
    );
  }

  /**
   * Authenticate user with username and password, tracking login_quota
   */
  static async authenticate(userName: string, password: string): Promise<AuthenticateResult> {
    const userRow = await this.findOne<(User & { stored_password: string }) & RowDataPacket>(
      'SELECT user_id, user_name, full_name, password as stored_password, role, login_quota, remove, update_time FROM users_data WHERE user_name = ? AND (remove = 0 OR remove IS NULL)',
      [userName]
    );
    
    if (!userRow) {
      return { user: null, errorType: 'NOT_FOUND', remainingAttempts: 9 };
    }

    const currentQuota = userRow.login_quota ?? 0;
    if (currentQuota >= 10) {
      return { user: null, isLocked: true, errorType: 'LOCKED', remainingAttempts: 0 };
    }

    // For Google API logins, passwords aren't verified this way.
    // If somehow a google user tries to login with a normal form, they shouldn't be able to unless they have a real password.
    if (userRow.stored_password === 'API Login google') {
       return { user: null, errorType: 'STAFF_GOOGLE_ONLY' }; 
    }
    
    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, userRow.stored_password);
    
    if (!isMatch) {
      const newQuota = currentQuota + 1;
      await this.execute(
        'UPDATE users_data SET login_quota = ? WHERE user_id = ?',
        [newQuota, userRow.user_id]
      );
      if (newQuota >= 10) {
        return { user: null, isLocked: true, errorType: 'LOCKED', remainingAttempts: 0 };
      }
      return { user: null, errorType: 'WRONG_PASSWORD', remainingAttempts: 10 - newQuota };
    }
    
    // Successful login: reset login_quota to 0
    if (currentQuota > 0) {
      await this.execute(
        'UPDATE users_data SET login_quota = 0 WHERE user_id = ?',
        [userRow.user_id]
      );
    }

    // Remove password from returned object
    const { stored_password, ...userWithoutPassword } = userRow;
    void stored_password; // bypass unused-var warning
    return { user: { ...userWithoutPassword, login_quota: 0 } as User };
  }

  /**
   * Log a successful login event
   */
  static async logLogin(userId: number): Promise<void> {
    try {
      await this.execute(
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
    const rows = await this.query<{ exercises_id: number, exercises_name: string, thumbnail_id?: number } & RowDataPacket>(`
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
    return rows;
  }
}
