import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminStatsModel } from '@/lib/models/adminStats';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

describe('AdminStatsModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverviewStats', () => {
    it('ควรดึงจำนวนรวมของ ผู้ป่วย แบบฝึกหัด รูปภาพ และหมวดหมู่ที่ remove = 0', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce([[{ count: 12 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]) // patients
        .mockResolvedValueOnce([[{ count: 5 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown])  // exercises
        .mockResolvedValueOnce([[{ count: 40 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]) // photos
        .mockResolvedValueOnce([[{ count: 8 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]); // categories

      const stats = await AdminStatsModel.getOverviewStats();

      expect(stats).toEqual({
        totalPatients: 12,
        totalExercises: 5,
        totalPhotos: 40,
        totalCategories: 8
      });
    });

    it('ควรคืนค่า fallback 0 เมื่อการ query ฐานข้อมูลล้มเหลว', async () => {
      vi.mocked(db.query).mockRejectedValueOnce(new Error('Connection error'));

      const stats = await AdminStatsModel.getOverviewStats();

      expect(stats).toEqual({
        totalPatients: 0,
        totalCategories: 0,
        totalPhotos: 0,
        totalExercises: 0
      });
    });
  });

  describe('getSystemUsageStats', () => {
    it('ควรดึงสถิติการใช้งานระบบย้อนหลัง 14 วัน', async () => {
      const mockUsage = [
        { name: '01/10', เข้าใช้งาน: 5 },
        { name: '02/10', เข้าใช้งาน: 8 }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query).mockResolvedValueOnce([mockUsage, []] as unknown as [RowDataPacket[], unknown]);

      const result = await AdminStatsModel.getSystemUsageStats();
      expect(result).toEqual(mockUsage);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DATE_SUB(NOW(), INTERVAL 14 DAY)'),
        undefined
      );
    });

    it('ควรคืนค่า [] เมื่อเกิดข้อผิดพลาด', async () => {
      vi.mocked(db.query).mockRejectedValueOnce(new Error('Query failed'));

      const result = await AdminStatsModel.getSystemUsageStats();
      expect(result).toEqual([]);
    });
  });

  describe('getImageCategoryStats & getExerciseCategoryStats', () => {
    it('getImageCategoryStats ควรดึงสถิติจำนวนภาพในแต่ละหมวดหมู่', async () => {
      const mockImageCats = [
        { name: 'สัตว์', value: 20 },
        { name: 'ผลไม้', value: 15 }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query).mockResolvedValueOnce([mockImageCats, []] as unknown as [RowDataPacket[], unknown]);

      const result = await AdminStatsModel.getImageCategoryStats();
      expect(result).toEqual(mockImageCats);
    });

    it('getExerciseCategoryStats ควรดึงสถิติจำนวนชุดแบบฝึกหัดในแต่ละหมวดหมู่', async () => {
      const mockExCats = [
        { name: 'สัตว์', จำนวนชุด: 4 },
        { name: 'ผลไม้', จำนวนชุด: 3 }
      ] as unknown as RowDataPacket[];

      vi.mocked(db.query).mockResolvedValueOnce([mockExCats, []] as unknown as [RowDataPacket[], unknown]);

      const result = await AdminStatsModel.getExerciseCategoryStats();
      expect(result).toEqual(mockExCats);
    });
  });
});
