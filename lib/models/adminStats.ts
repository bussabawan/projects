import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface AdminStats {
  totalPatients: number;
  totalCategories: number;
  totalPhotos: number;
  totalExercises: number;
}

export class AdminStatsModel {
  /**
   * Get overview statistics for the admin dashboard
   */
  static async getOverviewStats(): Promise<AdminStats> {
    try {
      // Query counts from each table in the test2 database, ignoring removed items if applicable
      const [patientRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM test2.users_data WHERE role = 1 AND remove = 0');
      const [exerciseRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM test2.Exercises_data WHERE remove = 0');
      const [photoRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM test2.Photo_data WHERE remove = 0');
      
      // The user didn't specify a table for Categories, so we set a default value or 0 for now.
      const totalCategories = 0; 

      return {
        totalPatients: patientRows[0].count || 0,
        totalCategories: totalCategories,
        totalPhotos: photoRows[0].count || 0,
        totalExercises: exerciseRows[0].count || 0
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Fallback in case of database connection error
      return {
        totalPatients: 0,
        totalCategories: 0,
        totalPhotos: 0,
        totalExercises: 0
      };
    }
  }
}
