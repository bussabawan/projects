import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameMatchingModel } from '@/lib/models/gameMatching';
import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

describe('GameMatchingModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExerciseImages', () => {
    it('ควรดึงรูปภาพของแบบฝึกหัดเฉพาะที่ remove = 0 และแปลง URL ให้ถูกต้อง', async () => {
      const mockRawRows = [
        { id: 1, title: 'สุนัข', imageUrl: 'dog.jpg', audioUrl: 'dog.mp3', audioTitle: 'สุนัข', audioGen: 1 }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query).mockResolvedValueOnce([mockRawRows, []] as unknown as [RowDataPacket[], unknown]);

      const images = await GameMatchingModel.getExerciseImages(1);
      expect(images).toHaveLength(1);
      expect(images[0].imageUrl).toContain('/api/files/1?type=image');
      expect(images[0].audioUrl).toContain('/api/files/1?type=audio');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM photo_in_exercises pie'),
        [1]
      );
    });
  });

  describe('saveGameLog (Transaction)', () => {
    it('ควรบันทึกลง matching_exercises_log และ matching_question_time_log ภายใต้ Transaction เดียวกัน', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        query: vi.fn()
          .mockResolvedValueOnce([{ insertId: 99 } as ResultSetHeader, []]) // matching_exercises_log
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]), // matching_question_time_log
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      const logData = {
        totalQuestions: 5,
        totalAnswers: 5,
        clickCount: 6,
        correctCount: 5,
        incorrectCount: 1
      };

      const timeLogs = [
        { photoId: 1, timePerQuestion: '00:00:03' }
      ];

      const success = await GameMatchingModel.saveGameLog(10, 1, logData, timeLogs);

      expect(success).toBe(true);
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO matching_exercises_log'),
        expect.arrayContaining([10, 1, 5, 5, 6, 5, 1])
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO matching_question_time_log'),
        [99, 1, '00:00:03']
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getUserGameHistory', () => {
    it('ควรดึงประวัติการเล่นเกมจับคู่และเรียงลำดับเวลา', async () => {
      const mockRows = [
        { id: 2, totalQuestions: 5, clickCount: 5, correctCount: 5, testDate: new Date('2026-10-02') },
        { id: 1, totalQuestions: 5, clickCount: 6, correctCount: 4, testDate: new Date('2026-10-01') }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query).mockResolvedValueOnce([mockRows, []] as unknown as [RowDataPacket[], unknown]);

      const history = await GameMatchingModel.getUserGameHistory(10, 7);
      expect(history).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM matching_exercises_log'),
        [10, 7]
      );
    });
  });
});
