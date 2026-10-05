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

    it('getExercisesPaginated ควรดึงแบบฝึกหัดแบบแบ่งหน้าพร้อมค้นหา', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[{ exercises_id: 1, exercises_name: 'ชุดฝึกผลไม้' }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown])
        .mockResolvedValueOnce([[{ total: 1 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);

      const result = await ManageExercisesModel.getExercisesPaginated(1, 10, 'ผลไม้');
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        ['%ผลไม้%', 10, 0]
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

  describe('restoreExercise', () => {
    it('ควร restore ชุดแบบฝึกหัดและข้อมูลความสัมพันธ์ทั้งหมดใน transaction', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]),
        query: vi.fn().mockResolvedValue([[{ exercises_id: 10 }] as RowDataPacket[], []]),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      await ManageExercisesModel.restoreExercise('ชุดฝึกทดสอบ');

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE exercises_data SET remove = 0 WHERE exercises_name = ?',
        ['ชุดฝึกทดสอบ']
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE patient_data SET remove = 0 WHERE exercises_id IN (?)',
        [10]
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE photo_in_exercises SET remove = 0 WHERE exercises_id IN (?)',
        [10]
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE category_in_exercises SET remove = 0 WHERE exercises_id IN (?)',
        [10]
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });

  describe('getExerciseImages & getExerciseCategories', () => {
    it('getExerciseImages ควรคืนค่า array ของ photo_id', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ photo_id: 1 }, { photo_id: 2 }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const photoIds = await ManageExercisesModel.getExerciseImages('ชุดฝึกผลไม้');
      expect(photoIds).toEqual([1, 2]);
    });

    it('getExerciseCategories ควรคืนค่า array ของ category_id', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ category_id: 3 }, { category_id: 4 }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const catIds = await ManageExercisesModel.getExerciseCategories('ชุดฝึกผลไม้');
      expect(catIds).toEqual([3, 4]);
    });
  });

  describe('updateExerciseImages & updateExerciseCategories', () => {
    it('updateExerciseImages ควรโยน Error เมื่อไม่พบชุดแบบฝึกหัด', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]);

      await expect(
        ManageExercisesModel.updateExerciseImages('ชุดที่ไม่มี', [1])
      ).rejects.toThrow('ไม่พบชุดแบบฝึกหัดนี้');
    });

    it('updateExerciseImages ควรอัปเดตรูปภาพใน photo_in_exercises', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ exercises_id: 7 }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      await ManageExercisesModel.updateExerciseImages('ชุดฝึก', [10, 11]);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM photo_in_exercises WHERE exercises_id = ?',
        [7]
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'INSERT INTO photo_in_exercises (exercises_id, photo_id, remove) VALUES (?, ?, 0)',
        [7, 10]
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('updateExerciseCategories ควรอัปเดตหมวดหมู่ใน category_in_exercises', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ exercises_id: 7 }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      } as unknown as PoolConnection;

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection);

      await ManageExercisesModel.updateExerciseCategories('ชุดฝึก', [2, 3]);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM category_in_exercises WHERE exercises_id = ?',
        [7]
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'INSERT INTO category_in_exercises (exercises_id, category_id, remove) VALUES (?, ?, 0)',
        [7, 2]
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });

  describe('Duplicate Deleted Cases', () => {
    it('addExercise ควรคืนค่า isDuplicateDeleted: true เมื่อชื่อเคยถูกลบ', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]) // active check
        .mockResolvedValueOnce([[{ exercises_name: 'ชุดเก่า' }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]); // removed check

      const result = await ManageExercisesModel.addExercise('ชุดเก่า');
      expect(result).toEqual({ isDuplicateDeleted: true, name: 'ชุดเก่า' });
    });

    it('updateExerciseName ควรคืนค่า isDuplicateDeleted: true เมื่อชื่อใหม่เคยถูกลบ', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]) // active check
        .mockResolvedValueOnce([[{ exercises_name: 'ชุดเก่า' }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]); // removed check

      const result = await ManageExercisesModel.updateExerciseName('ชุดปัจจุบัน', 'ชุดเก่า');
      expect(result).toEqual({ isDuplicateDeleted: true, name: 'ชุดเก่า' });
    });
  });
});
