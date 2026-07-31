import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

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
    // Note: Assuming plain text password for now based on varchar(50) in DB.
    // If passwords are MD5 or hashed, the query/logic should be updated accordingly.
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT user_id, user_name, full_name, role, remove, update_time FROM users_data WHERE user_name = ? AND password = ? AND remove = 0',
      [userName, password]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as User;
  }

  /**
   * Record user login time
   */
  static async recordLogin(userId: number): Promise<void> {
    await db.execute(
      'INSERT INTO login_logs (user_id) VALUES (?)',
      [userId]
    );
  }
}
