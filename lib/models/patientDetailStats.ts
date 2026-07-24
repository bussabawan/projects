import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export class PatientDetailStatsModel {
  /**
   * Get detailed statistics for a specific patient
   */
  static async getPatientDetailStats(userId: string, filters?: { period?: string, category?: string, exerciseSet?: string, startDate?: string, endDate?: string }) {
    if (!userId) throw new Error('User ID is required');

    let matchingParams: any[] = [userId];
    let memoryParams: any[] = [userId];
    let dateFilter = '';
    
    if (filters?.period) {
      if (filters.period === 'today') {
        dateFilter = ' AND DATE(test_date) = CURDATE()';
      } else if (filters.period === 'last7') {
        dateFilter = ' AND test_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      } else if (filters.period === 'last30') {
        dateFilter = ' AND test_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      } else if (filters.period === 'thisMonth') {
        dateFilter = ' AND MONTH(test_date) = MONTH(CURDATE()) AND YEAR(test_date) = YEAR(CURDATE())';
      } else if (filters.period === 'custom' && filters.startDate && filters.endDate) {
        dateFilter = ' AND DATE(test_date) >= ? AND DATE(test_date) <= ?';
        matchingParams.push(filters.startDate, filters.endDate);
        memoryParams.push(filters.startDate, filters.endDate);
      }
    }
    
    let matchingExtraFilter = '';
    let memoryExtraFilter = '';
    
    if (filters?.category && filters.category !== 'all') {
      const catParam = `%หมวด${filters.category}%`;
      matchingExtraFilter += ` AND EXISTS (
        SELECT 1 FROM matching_question_time_log mt
        JOIN exercises_data ed ON mt.photo_id = ed.photo_id
        WHERE mt.id_matching = matching_exercises_log.id_matching
        AND ed.exercises_name LIKE ?
      )`;
      memoryExtraFilter += ` AND EXISTS (
        SELECT 1 FROM memory_question_time_log mt
        JOIN exercises_data ed ON mt.photo_id = ed.photo_id
        WHERE mt.id_memory = memory_exercises_log.id_memory
        AND ed.exercises_name LIKE ?
      )`;
      matchingParams.push(catParam);
      memoryParams.push(catParam);
    }
    
    if (filters?.exerciseSet && filters.exerciseSet !== 'all') {
      matchingExtraFilter += ` AND EXISTS (
        SELECT 1 FROM matching_question_time_log mt
        JOIN exercises_data ed ON mt.photo_id = ed.photo_id
        WHERE mt.id_matching = matching_exercises_log.id_matching
        AND ed.exercises_name = ?
      )`;
      memoryExtraFilter += ` AND EXISTS (
        SELECT 1 FROM memory_question_time_log mt
        JOIN exercises_data ed ON mt.photo_id = ed.photo_id
        WHERE mt.id_memory = memory_exercises_log.id_memory
        AND ed.exercises_name = ?
      )`;
      matchingParams.push(filters.exerciseSet);
      memoryParams.push(filters.exerciseSet);
    }

    // 1. Fetch Score Stats from Matching and Memory logs
    const matchingQuery = `
      SELECT 
        SUM(correct_count) as totalCorrect, 
        SUM(incorrect_count) as totalIncorrect,
        SUM(total_answers) as totalAnswers,
        COUNT(id_matching) as playCount,
        DATE_FORMAT(test_date, '%Y-%m-%d') as dateStr
      FROM matching_exercises_log
      WHERE user_id = ? AND remove = 0
      ${dateFilter}
      ${matchingExtraFilter}
      GROUP BY DATE_FORMAT(test_date, '%Y-%m-%d')
      ORDER BY dateStr ASC
    `;
    
    const memoryQuery = `
      SELECT 
        SUM(correct_count) as totalCorrect, 
        SUM(incorrect_count) as totalIncorrect,
        SUM(total_answers) as totalAnswers,
        COUNT(id_memory) as playCount,
        DATE_FORMAT(test_date, '%Y-%m-%d') as dateStr
      FROM memory_exercises_log
      WHERE user_id = ? AND remove = 0
      ${dateFilter}
      ${memoryExtraFilter}
      GROUP BY DATE_FORMAT(test_date, '%Y-%m-%d')
      ORDER BY dateStr ASC
    `;

    const [matchingRows] = await db.execute<RowDataPacket[]>(matchingQuery, matchingParams);
    const [memoryRows] = await db.execute<RowDataPacket[]>(memoryQuery, memoryParams);

    // 2. Aggregate data for the charts
    let totalCorrect = 0;
    let totalIncorrect = 0;
    
    let matchingCorrect = 0;
    let matchingIncorrect = 0;
    
    let memoryCorrect = 0;
    let memoryIncorrect = 0;
    
    const dailyStatsMap = new Map<string, {
      dateStr: string;
      answers: number;
      correct: number;
      incorrect: number;
      plays: number;
      matchingCorrect: number;
      matchingIncorrect: number;
      memoryCorrect: number;
      memoryIncorrect: number;
      matchingPlays: number;
      memoryPlays: number;
    }>();

    // Process matching
    matchingRows.forEach(row => {
      const correct = Number(row.totalCorrect || 0);
      const incorrect = Number(row.totalIncorrect || 0);
      const answers = Number(row.totalAnswers || 0);
      const plays = Number(row.playCount || 0);
      const date = row.dateStr;
      if (!date) return;
      
      matchingCorrect += correct;
      matchingIncorrect += incorrect;
      totalCorrect += correct;
      totalIncorrect += incorrect;
      
      if (!dailyStatsMap.has(date)) {
        dailyStatsMap.set(date, { dateStr: date, answers: 0, correct: 0, incorrect: 0, plays: 0, matchingCorrect: 0, matchingIncorrect: 0, memoryCorrect: 0, memoryIncorrect: 0, matchingPlays: 0, memoryPlays: 0 });
      }
      const day = dailyStatsMap.get(date)!;
      day.answers += answers;
      day.correct += correct;
      day.incorrect += incorrect;
      day.plays += plays;
      day.matchingCorrect += correct;
      day.matchingIncorrect += incorrect;
      day.matchingPlays += plays;
    });

    // Process memory
    memoryRows.forEach(row => {
      const correct = Number(row.totalCorrect || 0);
      const incorrect = Number(row.totalIncorrect || 0);
      const answers = Number(row.totalAnswers || 0);
      const plays = Number(row.playCount || 0);
      const date = row.dateStr;
      if (!date) return;
      
      memoryCorrect += correct;
      memoryIncorrect += incorrect;
      totalCorrect += correct;
      totalIncorrect += incorrect;
      
      if (!dailyStatsMap.has(date)) {
        dailyStatsMap.set(date, { dateStr: date, answers: 0, correct: 0, incorrect: 0, plays: 0, matchingCorrect: 0, matchingIncorrect: 0, memoryCorrect: 0, memoryIncorrect: 0, matchingPlays: 0, memoryPlays: 0 });
      }
      const day = dailyStatsMap.get(date)!;
      day.answers += answers;
      day.correct += correct;
      day.incorrect += incorrect;
      day.plays += plays;
      day.memoryCorrect += correct;
      day.memoryIncorrect += incorrect;
      day.memoryPlays += plays;
    });

    const dailyStats = Array.from(dailyStatsMap.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    // 3. Fetch Time Stats
    const mDateFilter = dateFilter.replace(/test_date/g, 'm.test_date');
    const mMatchingExtra = matchingExtraFilter.replace(/matching_exercises_log\.id_matching/g, 'm.id_matching');
    const mMemoryExtra = memoryExtraFilter.replace(/memory_exercises_log\.id_memory/g, 'm.id_memory');

    const timeQuery = `
      SELECT 
        DATE_FORMAT(m.test_date, '%Y-%m-%d') as dateStr,
        TIME_TO_SEC(t.time_per_question) as seconds,
        'จับคู่' as mode
      FROM matching_exercises_log m
      JOIN matching_question_time_log t ON m.id_matching = t.id_matching
      WHERE m.user_id = ? AND m.remove = 0 AND t.remove = 0
      ${mDateFilter}
      ${mMatchingExtra}
      
      UNION ALL
      
      SELECT 
        DATE_FORMAT(m.test_date, '%Y-%m-%d') as dateStr,
        TIME_TO_SEC(t.time_per_question) as seconds,
        'ความจำ' as mode
      FROM memory_exercises_log m
      JOIN memory_question_time_log t ON m.id_memory = t.id_memory
      WHERE m.user_id = ? AND m.remove = 0 AND t.remove = 0
      ${mDateFilter}
      ${mMemoryExtra}
    `;
    
    const timeParams = [...matchingParams, ...memoryParams];
    const [timeRows] = await db.execute<RowDataPacket[]>(timeQuery, timeParams);
    
    const timeMap = new Map<string, { totalSeconds: number; count: number; matchingSeconds: number; matchingCount: number; memorySeconds: number; memoryCount: number }>();
    
    timeRows.forEach(row => {
      const date = row.dateStr;
      const secs = Number(row.seconds || 0);
      const mode = row.mode;
      if (!date) return;
      
      if (!timeMap.has(date)) {
        timeMap.set(date, { totalSeconds: 0, count: 0, matchingSeconds: 0, matchingCount: 0, memorySeconds: 0, memoryCount: 0 });
      }
      const t = timeMap.get(date)!;
      t.totalSeconds += secs;
      t.count += 1;
      
      if (mode === 'จับคู่') {
        t.matchingSeconds += secs;
        t.matchingCount += 1;
      } else if (mode === 'ความจำ') {
        t.memorySeconds += secs;
        t.memoryCount += 1;
      }
    });
    
    const dailyTimeStats = Array.from(timeMap.entries()).map(([dateStr, data]) => ({
      dateStr,
      totalSeconds: data.totalSeconds,
      avgSeconds: data.count > 0 ? (data.totalSeconds / data.count).toFixed(2) : 0,
      matchingAvgSeconds: data.matchingCount > 0 ? (data.matchingSeconds / data.matchingCount).toFixed(2) : 0,
      memoryAvgSeconds: data.memoryCount > 0 ? (data.memorySeconds / data.memoryCount).toFixed(2) : 0
    })).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    // For cases where there's no time data, we can merge with dailyStats
    const fullDailyStats = dailyStats.map(stat => {
      const timeStat = dailyTimeStats.find(t => t.dateStr === stat.dateStr);
      return {
        ...stat,
        totalSeconds: timeStat ? timeStat.totalSeconds : 0,
        avgSeconds: timeStat ? Number(timeStat.avgSeconds) : 0,
        matchingAvgSeconds: timeStat ? Number(timeStat.matchingAvgSeconds) : 0,
        memoryAvgSeconds: timeStat ? Number(timeStat.memoryAvgSeconds) : 0,
      };
    });

    const scatterQuery = `
      SELECT 
        DATE_FORMAT(m.test_date, '%Y-%m-%d') as dateStr,
        TIME_TO_SEC(TIME(m.test_date))/3600 as timeOfDay,
        TIME_FORMAT(TIME(m.test_date), '%H:%i') as timeStr,
        SUM(TIME_TO_SEC(t.time_per_question)) as duration,
        'จับคู่' as mode
      FROM matching_exercises_log m
      JOIN matching_question_time_log t ON m.id_matching = t.id_matching
      WHERE m.user_id = ? AND m.remove = 0 AND t.remove = 0
      ${mDateFilter}
      ${mMatchingExtra}
      GROUP BY m.id_matching
      
      UNION ALL
      
      SELECT 
        DATE_FORMAT(m.test_date, '%Y-%m-%d') as dateStr,
        TIME_TO_SEC(TIME(m.test_date))/3600 as timeOfDay,
        TIME_FORMAT(TIME(m.test_date), '%H:%i') as timeStr,
        SUM(TIME_TO_SEC(t.time_per_question)) as duration,
        'ความจำ' as mode
      FROM memory_exercises_log m
      JOIN memory_question_time_log t ON m.id_memory = t.id_memory
      WHERE m.user_id = ? AND m.remove = 0 AND t.remove = 0
      ${mDateFilter}
      ${mMemoryExtra}
      GROUP BY m.id_memory
    `;

    const [scatterRows] = await db.execute<RowDataPacket[]>(scatterQuery, timeParams);
    
    const scatterStats = scatterRows.map(row => ({
      dateStr: row.dateStr,
      timeOfDay: Number(row.timeOfDay || 0),
      timeStr: row.timeStr,
      duration: Number(row.duration || 0),
      mode: row.mode || 'ไม่ระบุ'
    }));

    return {
      scoreStats: {
        total: { correct: totalCorrect, incorrect: totalIncorrect },
        separated: {
          matching: { correct: matchingCorrect, incorrect: matchingIncorrect },
          memory: { correct: memoryCorrect, incorrect: memoryIncorrect }
        }
      },
      dailyStats: fullDailyStats,
      scatterStats
    };
  }
}

