import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameMemoryModel } from '@/lib/models/gameMemory';
import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

describe('GameMemoryModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExerciseImages', () => {
    it('ควรดึงรูปภาพของแบบฝึกหัดเฉพาะที่ remove = 0 และแปลง URL ให้ถูกต้อง', async () => {
      const mockRawRows = [
        { id: 1, title: 'สุนัข', imageUrl: 'dog.jpg', audioUrl: 'dog.mp3', audioTitle: 'สุนัข', audioGen: 1 }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query).mockResolvedValueOnce([mockRawRows, []] as unknown as [RowDataPacket[], unknown]);

      const images = await GameMemoryModel.getExerciseImages(1);
      expect(images).toHaveLength(1);
      expect(images[0].imageUrl).toContain('/api/files/1?type=image');
      expect(images[0].audioUrl).toContain('/api/files/1?type=audio');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM photo_in_exercises pie'),
        [1]
      );
    });
  });

  describe('getExerciseMaxAudioTime', () => {
    it('ควรคืนค่าเวลาสูงสุดของเสียงในแบบฝึกหัด หรือคืน fallback 2.5', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[{ maxTime: 4.2 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown])
        .mockResolvedValueOnce([[{ maxTime: null }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);

      const time1 = await GameMemoryModel.getExerciseMaxAudioTime(1);
      expect(time1).toBe(4.2);

      const time2 = await GameMemoryModel.getExerciseMaxAudioTime(2);
      expect(time2).toBe(2.5);
    });
  });

  describe('saveGameLog (Transaction)', () => {
    it('ควรบันทึกลง memory_exercises_log และ memory_question_time_log ภายใต้ Transaction เดียวกัน', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        query: vi.fn()
          .mockResolvedValueOnce([{ insertId: 77 } as ResultSetHeader, []]) // memory_exercises_log
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]), // memory_question_time_log
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      const logData = {
        totalQuestions: 5,
        totalAnswers: 5,
        displayTime: 3,
        clickCount: 6,
        correctCount: 5,
        incorrectCount: 1
      };

      const timeLogs = [
        { photoId: 10, timePerQuestion: '00:00:04' }
      ];

      const success = await GameMemoryModel.saveGameLog(10, 1, logData, timeLogs);

      expect(success).toBe(true);
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO memory_exercises_log'),
        expect.arrayContaining([10, 1, 5, 5, 3, 6, 5, 1])
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO memory_question_time_log'),
        [77, 10, '00:00:04']
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getRandomImages', () => {
    it('ควรสุ่มรูปภาพตัวหลอกของเกมความจำ และรองรับ fallback เมื่อรูปไม่พอ', async () => {
      // 1. หมวดหมู่
      vi.mocked(db.query).mockResolvedValueOnce([[{ category_id: 20 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);
      // 2. Query แรกได้ 1 รูป
      vi.mocked(db.query).mockResolvedValueOnce([[{ id: 1, title: 'ส้ม', imageUrl: 'orange.jpg', audioUrl: 'orange.mp3', audioTitle: 'ส้ม', audioGen: 1 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);
      // 3. Fallback query ได้อีก 1 รูป
      vi.mocked(db.query).mockResolvedValueOnce([[{ id: 2, title: 'กล้วย', imageUrl: 'banana.jpg', audioUrl: 'banana.mp3', audioTitle: 'กล้วย', audioGen: 1 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);

      const images = await GameMemoryModel.getRandomImages(2, [100], 8);
      expect(images).toHaveLength(2);
      expect(images[0].id).toBe(1);
      expect(images[1].id).toBe(2);
      expect(db.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('getUserGameHistory', () => {
    it('ควรดึงประวัติการเล่นเกมความจำและ reverse เรียงลำดับ', async () => {
      const mockRows = [
        { id: 2, totalQuestions: 4, clickCount: 4, correctCount: 4, testDate: new Date('2026-10-02') },
        { id: 1, totalQuestions: 4, clickCount: 5, correctCount: 3, testDate: new Date('2026-10-01') }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query).mockResolvedValueOnce([mockRows, []] as unknown as [RowDataPacket[], unknown]);

      const history = await GameMemoryModel.getUserGameHistory(5, 7);
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe(1);
      expect(history[1].id).toBe(2);
    });
  });
});
