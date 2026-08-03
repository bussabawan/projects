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
      // Query counts from each table ignoring removed items if applicable
      const [patientRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM users_data WHERE role = 1 AND remove = 0');
      const [exerciseRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM exercises_data WHERE remove = 0');
      const [photoRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM photo_data WHERE remove = 0');

      
      // Get unique categories by extracting tags from exercises_name
      const [allExercises] = await db.execute<RowDataPacket[]>('SELECT exercises_name FROM exercises_data WHERE remove = 0');
      const uniqueCategories = new Set(
        allExercises.map((row: Record<string, unknown>) => {
          const match = (row.exercises_name as string)?.match(/หมวด(.*?)(?:\s+เลเวล|$)/);
          return match ? match[1].trim() : row.exercises_name;
        }).filter(Boolean)
      );
      const totalCategories = uniqueCategories.size;

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
