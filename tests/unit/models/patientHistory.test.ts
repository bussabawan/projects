import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientHistoryModel } from '@/lib/models/patientHistory';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

describe('PatientHistoryModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHistory', () => {
    it('ควรโยน Error เมื่อไม่มี userId', async () => {
      await expect(PatientHistoryModel.getHistory(''))
        .rejects.toThrow('User ID is required');
    });

    it('ควรคืนค่า empty dailyStats เมื่อไม่มีประวัติการฝึก', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[{ totalDates: 0 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]) // countQuery
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]); // datesQuery

      const result = await PatientHistoryModel.getHistory('10', undefined, undefined, 1, 5);

      expect(result.dailyStats).toEqual([]);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(1);
    });

    it('ควรคำนวณสถิติและคะแนนของแต่ละเกมได้อย่างถูกต้อง', async () => {
      // 1. countQuery
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ totalDates: 1 }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      // 2. datesQuery
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ dateStr: '2026-10-01' }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      // 3. historyQuery
      const mockHistoryRows = [
        {
          dateStr: '2026-10-01',
          timeStr: '09:00',
          duration: 30,
          mode: 'จับคู่',
          correct_count: 5,
          total_questions: 5,
          click_count: 5
        },
        {
          dateStr: '2026-10-01',
          timeStr: '09:15',
          duration: 45,
          mode: 'ความจำ',
          correct_count: 4,
          total_questions: 4,
          click_count: 5
        }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query).mockResolvedValueOnce([
        mockHistoryRows,
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const result = await PatientHistoryModel.getHistory('10', '2026-10-01', '2026-10-01', 1, 5);

      expect(result.dailyStats).toHaveLength(1);
      const day = result.dailyStats[0];
      expect(day.dateStr).toBe('2026-10-01');
      expect(day.plays).toBe(2);
      expect(day.totalMinutes).toBe(1.25); // (30 + 45) / 60
      expect(day.details).toHaveLength(2);

      // เกมจับคู่: correct=5, clicks=5, totalQ=5 -> accuracy=1.0, score=100
      expect(day.details[0].score).toBe(100);
      // เกมความจำ: correct=4, clicks=5 -> accuracy=0.8, score=80
      expect(day.details[1].score).toBe(80);
    });
  });
});
