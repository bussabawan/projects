import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageCategoriesModel } from '@/lib/models/manageCategories';
import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

describe('ManageCategoriesModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('ควรดึงรายการหมวดหมู่ที่ remove = 0 ทั้งหมด', async () => {
      const mockCats = [
        { category_id: 1, category_name: 'สัตว์' },
        { category_id: 2, category_name: 'ผลไม้' }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query).mockResolvedValueOnce([mockCats, []] as unknown as [RowDataPacket[], unknown]);

      const categories = await ManageCategoriesModel.getCategories();
      expect(categories).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT category_id, category_name FROM category_data WHERE remove = 0 ORDER BY category_id ASC',
        undefined
      );
    });

    it('getCategoriesPaginated ควรดึงหมวดหมู่แบบแบ่งหน้าพร้อมค้นหา', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[{ category_id: 1, category_name: 'ผลไม้' }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown])
        .mockResolvedValueOnce([[{ total: 1 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);

      const result = await ManageCategoriesModel.getCategoriesPaginated(1, 10, 'ผลไม้');
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        ['%ผลไม้%', 10, 0]
      );
    });
  });

  describe('addCategory', () => {
    it('ควรโยน Error เมื่อมีชื่อหมวดหมู่ซ้ำในระบบ', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([[{ category_id: 1 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);

      await expect(ManageCategoriesModel.addCategory('สัตว์'))
        .rejects.toThrow('มีหมวดหมู่ชื่อนี้อยู่ในระบบแล้ว');
    });

    it('ควรเพิ่มหมวดหมู่ใหม่สำเร็จเมื่อไม่มีชื่อซ้ำ', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]) // duplicate check
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]); // removed check
      vi.mocked(db.execute).mockResolvedValueOnce([{ insertId: 10 } as ResultSetHeader, []] as unknown as [ResultSetHeader, unknown]);

      const result = await ManageCategoriesModel.addCategory('ของเล่น');
      expect(result.success).toBe(true);
      expect(db.execute).toHaveBeenCalledWith(
        'INSERT INTO category_data (category_name, remove) VALUES (?, 0)',
        ['ของเล่น']
      );
    });
  });

  describe('updateCategoryName & deleteCategory', () => {
    it('updateCategoryName ควรอัปเดตชื่อหมวดหมู่ใน category_data', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]) // active check
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]); // removed check
      vi.mocked(db.execute).mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as unknown as [ResultSetHeader, unknown]);

      await ManageCategoriesModel.updateCategoryName('สัตว์', 'สัตว์ป่า');
      expect(db.execute).toHaveBeenCalledWith(
        'UPDATE category_data SET category_name = ? WHERE category_name = ?',
        ['สัตว์ป่า', 'สัตว์']
      );
    });

    it('deleteCategory ควร soft delete category_data และ photo_in_category', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]),
        query: vi.fn().mockResolvedValue([[{ category_id: 1 }] as RowDataPacket[], []]),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection as unknown as PoolConnection);

      await ManageCategoriesModel.deleteCategory('สัตว์');

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE category_data SET remove = 1 WHERE category_name = ?',
        ['สัตว์']
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE photo_in_category SET remove = 1 WHERE category_id IN (?)',
        [1]
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });

  describe('restoreCategory', () => {
    it('ควร restore หมวดหมู่และรูปภาพที่เกี่ยวข้องใน transaction', async () => {
      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]),
        query: vi.fn().mockResolvedValue([[{ category_id: 1 }] as RowDataPacket[], []]),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection as unknown as PoolConnection);

      await ManageCategoriesModel.restoreCategory('สัตว์');

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE category_data SET remove = 0 WHERE category_name = ?',
        ['สัตว์']
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE photo_in_category SET remove = 0 WHERE category_id IN (?)',
        [1]
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });

  describe('getCategoryImages & getCategoryImageCount', () => {
    it('getCategoryImages ควรดึงรายการ photo_id ทั้งหมดในหมวดหมู่', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ photo_id: 101 }, { photo_id: 102 }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const photoIds = await ManageCategoriesModel.getCategoryImages('ผลไม้');
      expect(photoIds).toEqual([101, 102]);
    });

    it('getCategoryImageCount ควรคืนค่านับจำนวนรูปภาพในหมวดหมู่', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ count: 5 }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const count = await ManageCategoriesModel.getCategoryImageCount(1);
      expect(count).toBe(5);
    });
  });

  describe('updateCategoryImages', () => {
    it('ควรโยน Error เมื่อไม่พบหมวดหมู่', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]);

      await expect(
        ManageCategoriesModel.updateCategoryImages('หมวดหมู่ที่ไม่มี', [1, 2])
      ).rejects.toThrow('ไม่พบหมวดหมู่นี้');
    });

    it('ควรอัปเดตรูปภาพในหมวดหมู่สำเร็จ', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ category_id: 5 }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const mockConnection = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(db.getConnection).mockResolvedValueOnce(mockConnection as unknown as PoolConnection);

      await ManageCategoriesModel.updateCategoryImages('ผลไม้', [10, 20]);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM photo_in_category WHERE category_id = ?',
        [5]
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'INSERT INTO photo_in_category (category_id, photo_id, remove) VALUES (?, ?, 0)',
        [5, 10]
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'INSERT INTO photo_in_category (category_id, photo_id, remove) VALUES (?, ?, 0)',
        [5, 20]
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });

  describe('updateCategoryName Duplicate Deleted Case', () => {
    it('ควรคืนค่า isDuplicateDeleted: true เมื่อชื่อใหม่ไปซ้ำกับหมวดหมู่ที่ถูกลบไปแล้ว', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]) // active check
        .mockResolvedValueOnce([[{ category_name: 'สัตว์เก่า' }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]); // removed check

      const result = await ManageCategoriesModel.updateCategoryName('สัตว์', 'สัตว์เก่า');
      expect(result).toEqual({ isDuplicateDeleted: true, name: 'สัตว์เก่า' });
    });
  });
});
