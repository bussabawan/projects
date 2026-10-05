import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT as updateCategory, DELETE as deleteCategory } from '@/app/api/admin/categories/[name]/route';
import { GET as getCategoryImages, PUT as updateCategoryImages } from '@/app/api/admin/categories/[name]/images/route';
import { ManageCategoriesModel } from '@/lib/models/manageCategories';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}));

vi.mock('@/lib/models/manageCategories', () => ({
  ManageCategoriesModel: {
    restoreCategory: vi.fn(),
    updateCategoryName: vi.fn(),
    deleteCategory: vi.fn(),
    getCategoryImages: vi.fn(),
    updateCategoryImages: vi.fn()
  }
}));

describe('API Route /api/admin/categories/[name] & images (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/admin/categories/[name]', () => {
    it('ควรกู้คืนหมวดหมู่สำเร็จเมื่อ action="restore"', async () => {
      vi.mocked(ManageCategoriesModel.restoreCategory).mockResolvedValueOnce(undefined);

      const req = new Request('http://localhost:3000/api/admin/categories/สัตว์', {
        method: 'PUT',
        body: JSON.stringify({ action: 'restore' })
      });
      const params = Promise.resolve({ name: encodeURIComponent('สัตว์') });

      const res = await updateCategory(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageCategoriesModel.restoreCategory).toHaveBeenCalledWith('สัตว์');
    });

    it('ควรตอบกลับ status 400 เมื่อไม่ระบุชื่อหมวดหมู่ใหม่', async () => {
      const req = new Request('http://localhost:3000/api/admin/categories/สัตว์', {
        method: 'PUT',
        body: JSON.stringify({ name: '' })
      });
      const params = Promise.resolve({ name: encodeURIComponent('สัตว์') });

      const res = await updateCategory(req, { params });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('กรุณากรอกชื่อหมวดหมู่');
    });

    it('ควรอัปเดตชื่อหมวดหมู่สำเร็จ', async () => {
      vi.mocked(ManageCategoriesModel.updateCategoryName).mockResolvedValueOnce(undefined);

      const req = new Request('http://localhost:3000/api/admin/categories/สัตว์', {
        method: 'PUT',
        body: JSON.stringify({ name: 'สัตว์ป่า' })
      });
      const params = Promise.resolve({ name: encodeURIComponent('สัตว์') });

      const res = await updateCategory(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageCategoriesModel.updateCategoryName).toHaveBeenCalledWith('สัตว์', 'สัตว์ป่า');
    });
  });

  describe('DELETE /api/admin/categories/[name]', () => {
    it('ควรลบหมวดหมู่สำเร็จ', async () => {
      vi.mocked(ManageCategoriesModel.deleteCategory).mockResolvedValueOnce(undefined);

      const req = new Request('http://localhost:3000/api/admin/categories/สัตว์', { method: 'DELETE' });
      const params = Promise.resolve({ name: encodeURIComponent('สัตว์') });

      const res = await deleteCategory(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageCategoriesModel.deleteCategory).toHaveBeenCalledWith('สัตว์');
    });
  });

  describe('/api/admin/categories/[name]/images', () => {
    it('GET ควรดึงรายการรูปภาพในหมวดหมู่สำเร็จ', async () => {
      vi.mocked(ManageCategoriesModel.getCategoryImages).mockResolvedValueOnce([1, 2, 3]);

      const req = new NextRequest('http://localhost:3000/api/admin/categories/สัตว์/images');
      const params = Promise.resolve({ name: encodeURIComponent('สัตว์') });

      const res = await getCategoryImages(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual([1, 2, 3]);
    });

    it('PUT ควรตอบกลับ status 400 เมื่อ photoIds ไม่ใช่ Array', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/categories/สัตว์/images', {
        method: 'PUT',
        body: JSON.stringify({ photoIds: 'not-an-array' })
      });
      const params = Promise.resolve({ name: encodeURIComponent('สัตว์') });

      const res = await updateCategoryImages(req, { params });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('photoIds must be an array');
    });

    it('PUT ควรอัปเดตรูปภาพในหมวดหมู่สำเร็จ', async () => {
      vi.mocked(ManageCategoriesModel.updateCategoryImages).mockResolvedValueOnce(undefined);

      const req = new NextRequest('http://localhost:3000/api/admin/categories/สัตว์/images', {
        method: 'PUT',
        body: JSON.stringify({ photoIds: [10, 20] })
      });
      const params = Promise.resolve({ name: encodeURIComponent('สัตว์') });

      const res = await updateCategoryImages(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageCategoriesModel.updateCategoryImages).toHaveBeenCalledWith('สัตว์', [10, 20]);
    });
  });
});
