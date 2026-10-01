import { RowDataPacket } from 'mysql2/promise';
import { BaseModel } from './BaseModel';

export interface AdminStats {
  totalPatients: number;
  totalCategories: number;
  totalPhotos: number;
  totalExercises: number;
}

export class AdminStatsModel extends BaseModel {
  /**
   * Get overview statistics for the admin dashboard
   */
  static async getOverviewStats(): Promise<AdminStats> {
    try {
      // Query counts from each table ignoring removed items if applicable
      const patientRows = await this.query<RowDataPacket>('SELECT COUNT(*) as count FROM users_data WHERE role = 1 AND remove = 0');
      const exerciseRows = await this.query<RowDataPacket>('SELECT COUNT(*) as count FROM exercises_data WHERE remove = 0');
      const photoRows = await this.query<RowDataPacket>('SELECT COUNT(*) as count FROM photo_data WHERE remove = 0');

      
      const categoryRows = await this.query<RowDataPacket>('SELECT COUNT(*) as count FROM category_data WHERE remove = 0');

      return {
        totalPatients: patientRows[0].count || 0,
        totalCategories: categoryRows[0].count || 0,
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

  /**
   * Get system usage stats (line chart)
   */
  static async getSystemUsageStats(): Promise<{ name: string; เข้าใช้งาน: number }[]> {
    try {
      const query = `
        SELECT 
          DATE_FORMAT(dateStr, '%d/%m') as name,
          COUNT(*) as เข้าใช้งาน
        FROM (
          SELECT DATE(test_date) as dateStr FROM matching_exercises_log WHERE remove = 0
          UNION ALL
          SELECT DATE(test_date) as dateStr FROM memory_exercises_log WHERE remove = 0
        ) as combined
        WHERE dateStr >= DATE(DATE_SUB(NOW(), INTERVAL 14 DAY))
        GROUP BY dateStr
        ORDER BY dateStr ASC
      `;
      const rows = await this.query<{ name: string; เข้าใช้งาน: number } & RowDataPacket>(query);
      return rows;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return [];
    }
  }

  /**
   * Get image distribution by category (pie chart)
   */
  static async getImageCategoryStats(): Promise<{ name: string; value: number }[]> {
    try {
      const query = `
        SELECT 
          cd.category_name as name,
          COUNT(pic.photo_id) as value
        FROM category_data cd
        LEFT JOIN photo_in_category pic ON cd.category_id = pic.category_id AND pic.remove = 0
        LEFT JOIN photo_data pd ON pic.photo_id = pd.photo_id AND pd.remove = 0
        WHERE cd.remove = 0
        GROUP BY cd.category_id, cd.category_name
        HAVING value > 0
        ORDER BY value DESC
      `;
      const rows = await this.query<{ name: string; value: number } & RowDataPacket>(query);
      return rows;
    } catch (error) {
      console.error('Error fetching image category stats:', error);
      return [];
    }
  }

  /**
   * Get exercises distribution by category (bar chart)
   */
  static async getExerciseCategoryStats(): Promise<{ name: string; จำนวนชุด: number }[]> {
    try {
      const query = `
        SELECT 
          cd.category_name as name,
          COUNT(cie.exercises_id) as จำนวนชุด
        FROM category_data cd
        LEFT JOIN category_in_exercises cie ON cd.category_id = cie.category_id AND cie.remove = 0
        LEFT JOIN exercises_data ed ON cie.exercises_id = ed.exercises_id AND ed.remove = 0
        WHERE cd.remove = 0
        GROUP BY cd.category_id, cd.category_name
        HAVING จำนวนชุด > 0
        ORDER BY จำนวนชุด DESC
      `;
      const rows = await this.query<{ name: string; จำนวนชุด: number } & RowDataPacket>(query);
      return rows;
    } catch (error) {
      console.error('Error fetching exercise category stats:', error);
      return [];
    }
  }
}
