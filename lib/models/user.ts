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
    return userWithoutPassword as User;
  }
}
