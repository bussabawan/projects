import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageCategoriesModel } from '@/lib/models/manageCategories';
import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

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
});
