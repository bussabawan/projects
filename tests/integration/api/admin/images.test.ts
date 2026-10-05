import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/images/route';
import { ManageImagesModel } from '@/lib/models/manageImages';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}));

vi.mock('@/lib/models/manageImages', () => ({
  ManageImagesModel: {
    getImages: vi.fn(),
    createImage: vi.fn()
  }
}));

describe('API Route /api/admin/images (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/images', () => {
    it('ควรดึงรูปภาพแบบแบ่งหน้าสำเร็จ', async () => {
      vi.mocked(ManageImagesModel.getImages).mockResolvedValueOnce({
        data: [{ id: 1, title: 'แมว', imageUrl: '/api/files/1?type=image' }] as unknown as import('@/lib/models/manageImages').ImageInfo[],
        totalPages: 1
      });

      const req = new NextRequest('http://localhost:3000/api/admin/images?page=1&limit=15&search=แมว&prioritizeIds=1,2');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.totalPages).toBe(1);
      expect(ManageImagesModel.getImages).toHaveBeenCalledWith(1, 15, 'แมว', [1, 2]);
    });

    it('ควรตอบกลับ status 500 เมื่อเกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพ', async () => {
      vi.mocked(ManageImagesModel.getImages).mockRejectedValueOnce(new Error('Query error'));

      const req = new NextRequest('http://localhost:3000/api/admin/images');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Query error');
    });
  });

  describe('POST /api/admin/images', () => {
    it('ควรตอบกลับ status 400 เมื่อไม่มี title หรือ imageUrl', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/images', {
        method: 'POST',
        body: JSON.stringify({ title: '' })
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Missing required fields');
    });

    it('ควรสร้างรูปภาพใหม่สำเร็จและคืนค่า id', async () => {
      vi.mocked(ManageImagesModel.createImage).mockResolvedValueOnce(88);

      const req = new NextRequest('http://localhost:3000/api/admin/images', {
        method: 'POST',
        body: JSON.stringify({ title: 'สุนัข', imageUrl: 'dog.webp' })
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.id).toBe(88);
    });

    it('ควรแจ้งเตือน isDuplicateDeleted เมื่อชื่อภาพเคยถูกลบ', async () => {
      vi.mocked(ManageImagesModel.createImage).mockResolvedValueOnce({
        isDuplicateDeleted: true,
        duplicateId: 44
      });

      const req = new NextRequest('http://localhost:3000/api/admin/images', {
        method: 'POST',
        body: JSON.stringify({ title: 'สุนัขเก่า', imageUrl: 'dog_old.webp' })
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.isDuplicateDeleted).toBe(true);
      expect(json.duplicateId).toBe(44);
    });

    it('ควรตอบกลับ status 400 เมื่อมีชื่อรูปภาพซ้ำที่ยังใช้งานอยู่', async () => {
      vi.mocked(ManageImagesModel.createImage).mockRejectedValueOnce(
        new Error('Image title already exists')
      );

      const req = new NextRequest('http://localhost:3000/api/admin/images', {
        method: 'POST',
        body: JSON.stringify({ title: 'สุนัขซ้ำ', imageUrl: 'dog.webp' })
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('มีชื่อรูปภาพนี้อยู่ในระบบแล้ว');
    });
  });
});
