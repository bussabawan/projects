import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/categories/route';
import { ManageCategoriesModel } from '@/lib/models/manageCategories';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}));

vi.mock('@/lib/models/manageCategories', () => ({
  ManageCategoriesModel: {
    getCategories: vi.fn(),
    getCategoriesPaginated: vi.fn(),
    addCategory: vi.fn()
  }
}));

describe('API Route /api/admin/categories (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/categories', () => {
    it('ควรดึงรายการหมวดหมู่ทั้งหมดเมื่อไม่มี query params', async () => {
      const mockList = [{ category_id: 1, category_name: 'สัตว์' }];
      vi.mocked(ManageCategoriesModel.getCategories).mockResolvedValueOnce(mockList as unknown as import('@/lib/models/manageCategories').CategoryInfo[]);

      const req = new Request('http://localhost:3000/api/admin/categories');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockList);
    });

    it('ควรดึงรายการแบบแบ่งหน้าเมื่อมี page และ limit', async () => {
      vi.mocked(ManageCategoriesModel.getCategoriesPaginated).mockResolvedValueOnce({
        data: [{ category_id: 1, category_name: 'สัตว์' }] as unknown as import('@/lib/models/manageCategories').CategoryInfo[],
        total: 5
      });

      const req = new Request('http://localhost:3000/api/admin/categories?page=1&limit=5&search=สัตว์');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.total).toBe(5);
      expect(ManageCategoriesModel.getCategoriesPaginated).toHaveBeenCalledWith(1, 5, 'สัตว์');
    });

    it('ควรตอบกลับ status 500 เมื่อเกิดข้อผิดพลาดในการดึงข้อมูล', async () => {
      vi.mocked(ManageCategoriesModel.getCategories).mockRejectedValueOnce(new Error('DB failure'));

      const req = new Request('http://localhost:3000/api/admin/categories');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('DB failure');
    });
  });

  describe('POST /api/admin/categories', () => {
    it('ควรตอบกลับ status 400 เมื่อไม่ระบุชื่อหมวดหมู่', async () => {
      const req = new Request('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: '' })
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('ควรสร้างหมวดหมู่สำเร็จและคืนค่า success: true', async () => {
      vi.mocked(ManageCategoriesModel.addCategory).mockResolvedValueOnce({ success: true });

      const req = new Request('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'ผลไม้' })
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('ควรแจ้งเตือน isDuplicateDeleted เมื่อชื่อหมวดหมู่เคยถูกลบ', async () => {
      vi.mocked(ManageCategoriesModel.addCategory).mockResolvedValueOnce({
        isDuplicateDeleted: true,
        name: 'ผลไม้เก่า'
      });

      const req = new Request('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'ผลไม้เก่า' })
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.isDuplicateDeleted).toBe(true);
    });
  });
});
