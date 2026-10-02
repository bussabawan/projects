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
});
