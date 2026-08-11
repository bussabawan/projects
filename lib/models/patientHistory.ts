import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export class PatientHistoryModel {
  /**
   * Get training history for a specific patient
   */
  static async getHistory(userId: string, startDate?: string, endDate?: string, page: number = 1, limit: number = 5) {
    if (!userId) throw new Error('User ID is required');

    const params: (string | number)[] = [userId];
    let dateFilter = '';
    
    if (startDate && endDate) {
      dateFilter = ' AND DATE(test_date) >= ? AND DATE(test_date) <= ?';
      params.push(startDate, endDate);
    }

    // 1. Get distinct dates for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT dateStr) as totalDates
      FROM (
        SELECT DATE_FORMAT(test_date, '%Y-%m-%d') as dateStr FROM matching_exercises_log WHERE user_id = ? AND remove = 0 ${dateFilter}
        UNION ALL
        SELECT DATE_FORMAT(test_date, '%Y-%m-%d') as dateStr FROM memory_exercises_log WHERE user_id = ? AND remove = 0 ${dateFilter}
      ) as combined
    `;
    const [countResult] = await db.query<RowDataPacket[]>(countQuery, [...params, ...params]);
    const totalDates = countResult[0].totalDates || 0;
    const totalPages = Math.ceil(totalDates / limit) || 1;

    const offset = (page - 1) * limit;

    const datesQuery = `
      SELECT DISTINCT dateStr
      FROM (
        SELECT DATE_FORMAT(test_date, '%Y-%m-%d') as dateStr FROM matching_exercises_log WHERE user_id = ? AND remove = 0 ${dateFilter}
        UNION ALL
        SELECT DATE_FORMAT(test_date, '%Y-%m-%d') as dateStr FROM memory_exercises_log WHERE user_id = ? AND remove = 0 ${dateFilter}
      ) as combined
      ORDER BY dateStr DESC
      LIMIT ? OFFSET ?
    `;

    const [datesResult] = await db.query<RowDataPacket[]>(datesQuery, [...params, ...params, limit, offset]);
    
    if (datesResult.length === 0) {
      return { dailyStats: [], totalPages, currentPage: page };
    }

    const dateList = datesResult.map(r => r.dateStr);
    const placeholders = dateList.map(() => '?').join(',');

    const mDateFilter = dateFilter.replace(/test_date/g, 'm.test_date');
    const inClause = `AND DATE_FORMAT(m.test_date, '%Y-%m-%d') IN (${placeholders})`;

    const detailParams = [userId, ...params.slice(1), ...dateList];

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
      ${inClause}
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
      ${inClause}
      GROUP BY m.id_memory
      ORDER BY dateStr DESC, timeStr DESC
    `;
    
    const [historyRows] = await db.query<RowDataPacket[]>(historyQuery, [...detailParams, ...detailParams]);
    
    const dailyStatsMap = new Map<string, {
      dateStr: string;
      plays: number;
      totalSeconds: number;
      details: any[];
    }>();
    
    // Initialize map with all requested dates in order to maintain sorting
    dateList.forEach(date => {
      dailyStatsMap.set(date, { dateStr: date, plays: 0, totalSeconds: 0, details: [] });
    });

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
      dailyStats,
      totalPages,
      currentPage: page
    };
  }
}
