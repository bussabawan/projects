import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface PlayDetail {
  id: number;
  time: string; // e.g., "20:54"
  icon: string; // game type icon/identifier
  game: string; // "ความจำ" or "จับคู่"
  score: string; // "44 คะแนน"
  duration: string; // "5.12 นาที"
  timestamp: number; // for sorting
}

export interface DayHistory {
  id: number; // unique id for rendering
  dateStr: string; // "10 / มิ.ย. / 2567"
  rawDate: string; // "2024-06-10"
  plays: string; // "3 ครั้ง 2 ประเภทเกม"
  totalTime: string; // "รวม 15 นาที"
  details: PlayDetail[];
}

export class UserHistoryModel {
  static async getHistory(userId: string | number, startDate?: string, endDate?: string): Promise<DayHistory[]> {
    if (!userId) throw new Error('User ID is required');

    const params: (string | number)[] = [userId];
    let dateFilter = '';
    
    if (startDate && endDate) {
      dateFilter = ' AND DATE(m.test_date) >= ? AND DATE(m.test_date) <= ?';
      params.push(startDate, endDate);
    }

    const matchingQuery = `
      SELECT 
        m.id_matching as log_id,
        DATE_FORMAT(m.test_date, '%Y-%m-%d') as rawDate,
        TIME_FORMAT(TIME(m.test_date), '%H:%i') as timeStr,
        m.correct_count as correct,
        SUM(TIME_TO_SEC(t.time_per_question)) as duration_sec,
        'จับคู่' as game_type
      FROM matching_exercises_log m
      LEFT JOIN matching_question_time_log t ON m.id_matching = t.id_matching AND t.remove = 0
      WHERE m.user_id = ? AND m.remove = 0
      ${dateFilter}
      GROUP BY m.id_matching
    `;

    const memoryQuery = `
      SELECT 
        m.id_memory as log_id,
        DATE_FORMAT(m.test_date, '%Y-%m-%d') as rawDate,
        TIME_FORMAT(TIME(m.test_date), '%H:%i') as timeStr,
        m.correct_count as correct,
        SUM(TIME_TO_SEC(t.time_per_question)) as duration_sec,
        'ความจำ' as game_type
      FROM memory_exercises_log m
      LEFT JOIN memory_question_time_log t ON m.id_memory = t.id_memory AND t.remove = 0
      WHERE m.user_id = ? AND m.remove = 0
      ${dateFilter}
      GROUP BY m.id_memory
    `;

    const [matchingRows] = await db.execute<RowDataPacket[]>(matchingQuery, params);
    const [memoryRows] = await db.execute<RowDataPacket[]>(memoryQuery, params);

    const allRows = [...matchingRows, ...memoryRows];

    const groupedByDate = new Map<string, { details: PlayDetail[], totalSec: number }>();

    allRows.forEach((row, index) => {
      const rawDate = row.rawDate;
      const timeStr = row.timeStr;
      const durationSec = Number(row.duration_sec || 0);
      
      const minutes = Math.floor(durationSec / 60);
      const seconds = durationSec % 60;
      const durationStr = minutes > 0 ? `${minutes}.${String(seconds).padStart(2, '0')} นาที` : `${seconds} วินาที`;

      const timestamp = new Date(`${rawDate}T${timeStr}`).getTime();

      const detail: PlayDetail = {
        id: index,
        time: timeStr,
        icon: row.game_type === 'ความจำ' ? 'memory' : 'matching',
        game: row.game_type,
        score: `${row.correct || 0} คะแนน`,
        duration: durationStr,
        timestamp: timestamp
      };

      if (!groupedByDate.has(rawDate)) {
        groupedByDate.set(rawDate, { details: [], totalSec: 0 });
      }
      
      const dayData = groupedByDate.get(rawDate)!;
      dayData.details.push(detail);
      dayData.totalSec += durationSec;
    });

    const formatThaiDate = (dateString: string) => {
      const date = new Date(dateString);
      const thaiDate = date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      return thaiDate.split(' ').join(' / ');
    };

    const history: DayHistory[] = [];
    let idCounter = 1;

    const sortedDates = Array.from(groupedByDate.keys()).sort((a, b) => b.localeCompare(a));

    for (const rawDate of sortedDates) {
      const dayData = groupedByDate.get(rawDate)!;
      const details = dayData.details;
      
      details.sort((a, b) => b.timestamp - a.timestamp);

      const uniqueGames = new Set(details.map(d => d.game)).size;
      const dayMin = Math.floor(dayData.totalSec / 60);
      
      history.push({
        id: idCounter++,
        dateStr: formatThaiDate(rawDate),
        rawDate,
        plays: `${details.length} ครั้ง ${uniqueGames} ประเภทเกม`,
        totalTime: `รวม ${dayMin} นาที`,
        details
      });
    }

    return history;
  }
}
