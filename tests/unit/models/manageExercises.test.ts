import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageExercisesModel } from '@/lib/models/manageExercises';
import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

describe('ManageExercisesModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExercises', () => {
    it('ควรดึงรายการชุดแบบฝึกหัดที่ยังไม่ถูกลบ (remove = 0)', async () => {
      const mockExercises = [
        { exercises_id: 1, exercises_name: 'แบบฝึกหัดชุดที่ 1', thumbnail_id: 10 }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query).mockResolvedValueOnce([mockExercises, []] as unknown as [RowDataPacket[], unknown]);

      const exercises = await ManageExercisesModel.getExercises();
      expect(exercises).toHaveLength(1);
      expect(exercises[0].exercises_name).toBe('แบบฝึกหัดชุดที่ 1');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM exercises_data ed'),
        undefined
      );
    });
  });

  describe('deleteExercise (Soft Delete Cascade)', () => {
    it('ควร soft delete exercises_data และอัปเดต remove = 1 ใน patient_data, photo_in_exercises, category_in_exercises', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]),
        query: vi.fn().mockResolvedValue([[{ exercises_id: 1 }] as RowDataPacket[], []]),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      await ManageExercisesModel.deleteExercise('แบบฝึกหัดชุดที่ 1');

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE exercises_data SET remove = 1 WHERE exercises_name = ?',
        ['แบบฝึกหัดชุดที่ 1']
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE patient_data SET remove = 1 WHERE exercises_id IN (?)',
        [1]
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE photo_in_exercises SET remove = 1 WHERE exercises_id IN (?)',
        [1]
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE category_in_exercises SET remove = 1 WHERE exercises_id IN (?)',
        [1]
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
