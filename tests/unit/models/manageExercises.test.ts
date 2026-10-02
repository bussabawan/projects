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

  describe('addExercise & updateExerciseName & getExerciseImageCount', () => {
    it('addExercise ควรโยน Error เมื่อมีชื่อแบบฝึกหัดซ้ำในระบบ', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([[{ exercises_id: 1 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);

      await expect(ManageExercisesModel.addExercise('แบบฝึกหัดชุดที่ 1'))
        .rejects.toThrow('มีชุดแบบฝึกหัดชื่อนี้อยู่ในระบบแล้ว');
    });

    it('addExercise ควรสร้างแบบฝึกหัดใหม่สำเร็จเมื่อชื่อไม่ซ้ำ', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]) // active check
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]); // removed check
      vi.mocked(db.execute).mockResolvedValueOnce([{ insertId: 5 } as ResultSetHeader, []] as unknown as [ResultSetHeader, unknown]);

      const result = await ManageExercisesModel.addExercise('ชุดผลไม้รวม');
      expect(result.success).toBe(true);
      expect(db.execute).toHaveBeenCalledWith(
        'INSERT INTO exercises_data (exercises_name, remove) VALUES (?, 0)',
        ['ชุดผลไม้รวม']
      );
    });

    it('updateExerciseName ควรอัปเดตชื่อแบบฝึกหัดใน exercises_data', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]) // active check
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]); // removed check
      vi.mocked(db.execute).mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as unknown as [ResultSetHeader, unknown]);

      await ManageExercisesModel.updateExerciseName('ชื่อเดิม', 'ชื่อใหม่');
      expect(db.execute).toHaveBeenCalledWith(
        'UPDATE exercises_data SET exercises_name = ? WHERE exercises_name = ?',
        ['ชื่อใหม่', 'ชื่อเดิม']
      );
    });

    it('getExerciseImageCount ควรคืนจำนวนภาพในแบบฝึกหัด', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([[{ count: 20 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);

      const count = await ManageExercisesModel.getExerciseImageCount(1);
      expect(count).toBe(20);
    });
  });
});
