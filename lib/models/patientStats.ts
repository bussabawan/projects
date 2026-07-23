import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface PatientStatInfo {
  id: number;
  name: string;
  patientId: string;
  testSets: string[];
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
          u.user_id as patientId,
          IFNULL(ex.exercises_name, '-') as testSet
        FROM users_data u
        INNER JOIN patient_data p ON u.user_id = p.user_id
        LEFT JOIN exercises_data ex ON p.exercises_id = ex.exercises_id
        WHERE u.role = 1 AND u.remove = 0 AND p.remove = 0
        ORDER BY u.user_id ASC
      `;
      
      const [rows] = await db.execute<RowDataPacket[]>(query);
      
      const patientMap = new Map<number, PatientStatInfo>();
      rows.forEach((row) => {
        if (!patientMap.has(row.id)) {
          patientMap.set(row.id, {
            id: row.id,
            name: row.name || 'Unknown',
            patientId: row.patientId != null ? String(row.patientId) : 'N/A',
            testSets: []
          });
        }
        if (row.testSet && row.testSet !== '-') {
          const patient = patientMap.get(row.id)!;
          if (!patient.testSets.includes(row.testSet)) {
            patient.testSets.push(row.testSet);
          }
        }
      });
      
      return Array.from(patientMap.values());
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      throw new Error('Failed to fetch patient statistics');
    }
  }

}
