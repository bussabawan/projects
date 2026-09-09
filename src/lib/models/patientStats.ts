import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { unstable_cache } from 'next/cache';

export interface PatientStatInfo {
  id: number;
  name: string;
  patientId: string;
  testSets: string[];
  assignedSets: string[];
  playedSets: string[];
}

export class PatientStatsModel {
  /**
   * Get patient statistics list
   */
  static getPatientStats = unstable_cache(
    async (): Promise<PatientStatInfo[]> => {
      try {
        const query = `
          SELECT 
            u.user_id as id,
            u.full_name as name,
            u.user_name as patientId,
            IFNULL(ex.exercises_name, '-') as testSet
          FROM users_data u
          INNER JOIN patient_data p ON u.user_id = p.user_id
          LEFT JOIN exercises_data ex ON p.exercises_id = ex.exercises_id
          WHERE u.role = 1 AND u.remove = 0 AND p.remove = 0
          ORDER BY u.user_id ASC
        `;
        
        const playedMatchingQuery = `
          SELECT DISTINCT m.user_id as id, ed.exercises_name as testSet
          FROM matching_exercises_log m
          JOIN exercises_data ed ON m.exercises_id = ed.exercises_id
          WHERE m.remove = 0 AND ed.remove = 0
        `;
        
        const playedMemoryQuery = `
          SELECT DISTINCT m.user_id as id, ed.exercises_name as testSet
          FROM memory_exercises_log m
          JOIN exercises_data ed ON m.exercises_id = ed.exercises_id
          WHERE m.remove = 0 AND ed.remove = 0
        `;
        
        const [rows] = await db.execute<RowDataPacket[]>(query);
        const [matchingRows] = await db.execute<RowDataPacket[]>(playedMatchingQuery);
        const [memoryRows] = await db.execute<RowDataPacket[]>(playedMemoryQuery);
        
        const patientMap = new Map<number, PatientStatInfo>();
        
        rows.forEach((row) => {
          if (!patientMap.has(row.id)) {
            patientMap.set(row.id, {
              id: row.id,
              name: row.name || 'Unknown',
              patientId: row.patientId != null ? String(row.patientId) : 'N/A',
              testSets: [],
              assignedSets: [],
              playedSets: []
            });
          }
          if (row.testSet && row.testSet !== '-') {
            const patient = patientMap.get(row.id)!;
            if (!patient.assignedSets.includes(row.testSet)) {
              patient.assignedSets.push(row.testSet);
            }
            if (!patient.testSets.includes(row.testSet)) {
              patient.testSets.push(row.testSet);
            }
          }
        });
        
        const addPlayedSet = (row: RowDataPacket) => {
          if (patientMap.has(row.id) && row.testSet) {
            const patient = patientMap.get(row.id)!;
            if (!patient.playedSets.includes(row.testSet)) {
              patient.playedSets.push(row.testSet);
            }
            if (!patient.testSets.includes(row.testSet)) {
              patient.testSets.push(row.testSet);
            }
          }
        };
        
        matchingRows.forEach(addPlayedSet);
        memoryRows.forEach(addPlayedSet);
        
        return Array.from(patientMap.values());
      } catch (error) {
        console.error('Error fetching patient stats:', error);
        throw new Error('Failed to fetch patient statistics');
      }
    },
    ['PatientStatsModel-getPatientStats'],
    { tags: ['patient-stats'] }
  );

}
