import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface PatientStatInfo {
  id: number;
  name: string;
  patientId: string;
  testSet: string;
}

export class PatientStatsModel {
  /**
   * Get patient statistics list
   */
  static async getPatientStats(): Promise<PatientStatInfo[]> {
    try {
      const query = `
        SELECT 
          u.user_id as id,
          u.full_name as name,
          p.patient_id as patientId,
          IFNULL(e.Exercises_name, '-') as testSet
        FROM users_data u
        INNER JOIN patient_data p ON u.user_id = p.user_id
        LEFT JOIN (
          SELECT ae.patient_id, ex.Exercises_name,
          ROW_NUMBER() OVER(PARTITION BY ae.patient_id ORDER BY ae.assigned_id DESC) as rn
          FROM assigned_exercises ae
          JOIN Exercises_data ex ON ae.Exercises_id = ex.Exercises_id
          WHERE ae.remove = 0
        ) e ON p.patient_id = e.patient_id AND e.rn = 1
        WHERE u.role = 1 AND u.remove = 0 AND p.remove = 0
        ORDER BY u.user_id ASC
      `;
      
      const [rows] = await db.execute<RowDataPacket[]>(query);
      
      return rows.map((row) => ({
        id: row.id,
        name: row.name || 'Unknown',
        patientId: row.patientId != null ? String(row.patientId) : 'N/A',
        testSet: row.testSet
      }));
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      throw new Error('Failed to fetch patient statistics');
    }
  }
}
