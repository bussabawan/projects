import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE, PUT, PATCH } from '@/app/api/admin/images/[id]/route';
import { ManageImagesModel } from '@/lib/models/manageImages';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}));

vi.mock('@/lib/models/manageImages', () => ({
  ManageImagesModel: {
    deleteImage: vi.fn(),
    updateImage: vi.fn(),
    restoreImage: vi.fn()
  }
}));

describe('API Route /api/admin/images/[id] (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DELETE /api/admin/images/[id]', () => {
    it('ควรตอบกลับ status 400 เมื่อ id ไม่ถูกต้อง', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/images/invalid', { method: 'DELETE' });
      const params = Promise.resolve({ id: 'invalid' });

      const res = await DELETE(req, { params });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid ID');
    });

    it('ควรลบรูปภาพสำเร็จ', async () => {
      vi.mocked(ManageImagesModel.deleteImage).mockResolvedValueOnce(undefined);

      const req = new NextRequest('http://localhost:3000/api/admin/images/15', { method: 'DELETE' });
      const params = Promise.resolve({ id: '15' });

      const res = await DELETE(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageImagesModel.deleteImage).toHaveBeenCalledWith(15);
    });
  });

  describe('PUT /api/admin/images/[id]', () => {
    it('ควรตอบกลับ status 400 เมื่อไม่มี title หรือ imageUrl', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/images/15', {
        method: 'PUT',
        body: JSON.stringify({ title: '' })
      });
      const params = Promise.resolve({ id: '15' });

      const res = await PUT(req, { params });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Missing required fields');
    });

    it('ควรอัปเดตข้อมูลรูปภาพสำเร็จ', async () => {
      vi.mocked(ManageImagesModel.updateImage).mockResolvedValueOnce(undefined);

      const req = new NextRequest('http://localhost:3000/api/admin/images/15', {
        method: 'PUT',
        body: JSON.stringify({ title: 'แมวน้อย', imageUrl: 'cat.webp' })
      });
      const params = Promise.resolve({ id: '15' });

      const res = await PUT(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageImagesModel.updateImage).toHaveBeenCalledWith(15, expect.objectContaining({
        title: 'แมวน้อย',
        imageUrl: 'cat.webp'
      }));
    });
  });

  describe('PATCH /api/admin/images/[id]', () => {
    it('ควรกู้คืนรูปภาพสำเร็จเมื่อ action="restore"', async () => {
      vi.mocked(ManageImagesModel.restoreImage).mockResolvedValueOnce(undefined);

      const req = new NextRequest('http://localhost:3000/api/admin/images/15', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'restore' })
      });
      const params = Promise.resolve({ id: '15' });

      const res = await PATCH(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe('Image restored successfully');
      expect(ManageImagesModel.restoreImage).toHaveBeenCalledWith(15);
    });

    it('ควรตอบกลับ status 400 เมื่อ action ไม่ถูกต้อง', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/images/15', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'unknown' })
      });
      const params = Promise.resolve({ id: '15' });

      const res = await PATCH(req, { params });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid action');
    });
  });
});
