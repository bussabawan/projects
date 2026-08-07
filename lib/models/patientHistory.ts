import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export class PatientHistoryModel {
  /**
   * Get training history for a specific patient
   */
  static async getHistory(userId: string, startDate?: string, endDate?: string) {
    if (!userId) throw new Error('User ID is required');

    const params: (string | number)[] = [userId];
    let dateFilter = '';
    
    if (startDate && endDate) {
      dateFilter = ' AND DATE(test_date) >= ? AND DATE(test_date) <= ?';
      params.push(startDate, endDate);
    }

    const mDateFilter = dateFilter.replace(/test_date/g, 'm.test_date');

    const historyQuery = `
      SELECT 
        DATE_FORMAT(m.test_date, '%Y-%m-%d') as dateStr,
        TIME_FORMAT(TIME(m.test_date), '%H:%i') as timeStr,
        SUM(TIME_TO_SEC(t.time_per_question)) as duration,
        'จับคู่' as mode,
        m.correct_count as score
      FROM matching_exercises_log m
      LEFT JOIN matching_question_time_log t ON m.id_matching = t.id_matching AND t.remove = 0
      WHERE m.user_id = ? AND m.remove = 0
      ${mDateFilter}
      GROUP BY m.id_matching
      
      UNION ALL
      
      SELECT 
        DATE_FORMAT(m.test_date, '%Y-%m-%d') as dateStr,
        TIME_FORMAT(TIME(m.test_date), '%H:%i') as timeStr,
        SUM(TIME_TO_SEC(t.time_per_question)) as duration,
        'ความจำ' as mode,
        m.correct_count as score
      FROM memory_exercises_log m
      LEFT JOIN memory_question_time_log t ON m.id_memory = t.id_memory AND t.remove = 0
      WHERE m.user_id = ? AND m.remove = 0
      ${mDateFilter}
      GROUP BY m.id_memory
      ORDER BY dateStr DESC, timeStr DESC
    `;
    
    const [historyRows] = await db.execute<RowDataPacket[]>(historyQuery, [...params, ...params]);
    
    const dailyStatsMap = new Map<string, {
      dateStr: string;
      plays: number;
      totalSeconds: number;
      details: any[];
    }>();
    
    historyRows.forEach((row, index) => {
      const date = row.dateStr;
      if (!date) return;
      
      if (!dailyStatsMap.has(date)) {
        dailyStatsMap.set(date, { dateStr: date, plays: 0, totalSeconds: 0, details: [] });
      }
      
      const day = dailyStatsMap.get(date)!;
      day.plays += 1;
      day.totalSeconds += Number(row.duration || 0);
      
      day.details.push({
        id: index + 1,
        timeStr: row.timeStr,
        duration: Number(row.duration || 0),
        mode: row.mode,
        score: Number(row.score || 0)
      });
    });
    
    const dailyStats = Array.from(dailyStatsMap.values()).map(day => ({
      dateStr: day.dateStr,
      plays: day.plays,
      totalMinutes: Number((day.totalSeconds / 60).toFixed(2)),
      details: day.details
    }));
    
    return {
      dailyStats
    };
  }
}
