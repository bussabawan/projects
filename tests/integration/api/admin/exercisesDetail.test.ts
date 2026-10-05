import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT as updateExercise, DELETE as deleteExercise } from '@/app/api/admin/exercises/[name]/route';
import { GET as getExerciseImages, PUT as updateExerciseImages } from '@/app/api/admin/exercises/[name]/images/route';
import { ManageExercisesModel } from '@/lib/models/manageExercises';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}));

vi.mock('@/lib/models/manageExercises', () => ({
  ManageExercisesModel: {
    restoreExercise: vi.fn(),
    updateExerciseName: vi.fn(),
    deleteExercise: vi.fn(),
    getExerciseImages: vi.fn(),
    getExerciseCategories: vi.fn(),
    updateExerciseImages: vi.fn(),
    updateExerciseCategories: vi.fn()
  }
}));

describe('API Route /api/admin/exercises/[name] & images (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/admin/exercises/[name]', () => {
    it('ควรกู้คืนแบบฝึกหัดสำเร็จเมื่อ action="restore"', async () => {
      vi.mocked(ManageExercisesModel.restoreExercise).mockResolvedValueOnce(undefined);

      const req = new Request('http://localhost:3000/api/admin/exercises/ชุดผลไม้', {
        method: 'PUT',
        body: JSON.stringify({ action: 'restore' })
      });
      const params = Promise.resolve({ name: encodeURIComponent('ชุดผลไม้') });

      const res = await updateExercise(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageExercisesModel.restoreExercise).toHaveBeenCalledWith('ชุดผลไม้');
    });

    it('ควรตอบกลับ status 400 เมื่อไม่ระบุชื่อแบบฝึกหัดใหม่', async () => {
      const req = new Request('http://localhost:3000/api/admin/exercises/ชุดผลไม้', {
        method: 'PUT',
        body: JSON.stringify({ name: '' })
      });
      const params = Promise.resolve({ name: encodeURIComponent('ชุดผลไม้') });

      const res = await updateExercise(req, { params });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('กรุณากรอกชื่อชุดแบบฝึกหัด');
    });

    it('ควรอัปเดตชื่อชุดแบบฝึกหัดสำเร็จ', async () => {
      vi.mocked(ManageExercisesModel.updateExerciseName).mockResolvedValueOnce(undefined);

      const req = new Request('http://localhost:3000/api/admin/exercises/ชุดผลไม้', {
        method: 'PUT',
        body: JSON.stringify({ name: 'ชุดผลไม้รวม' })
      });
      const params = Promise.resolve({ name: encodeURIComponent('ชุดผลไม้') });

      const res = await updateExercise(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageExercisesModel.updateExerciseName).toHaveBeenCalledWith('ชุดผลไม้', 'ชุดผลไม้รวม');
    });
  });

  describe('DELETE /api/admin/exercises/[name]', () => {
    it('ควรลบชุดแบบฝึกหัดสำเร็จ', async () => {
      vi.mocked(ManageExercisesModel.deleteExercise).mockResolvedValueOnce(undefined);

      const req = new Request('http://localhost:3000/api/admin/exercises/ชุดผลไม้', { method: 'DELETE' });
      const params = Promise.resolve({ name: encodeURIComponent('ชุดผลไม้') });

      const res = await deleteExercise(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageExercisesModel.deleteExercise).toHaveBeenCalledWith('ชุดผลไม้');
    });
  });

  describe('/api/admin/exercises/[name]/images', () => {
    it('GET ควรดึงรายการรูปภาพและหมวดหมู่ในแบบฝึกหัดสำเร็จ', async () => {
      vi.mocked(ManageExercisesModel.getExerciseImages).mockResolvedValueOnce([10, 20]);
      vi.mocked(ManageExercisesModel.getExerciseCategories).mockResolvedValueOnce([1, 2]);

      const req = new NextRequest('http://localhost:3000/api/admin/exercises/ชุดผลไม้/images');
      const params = Promise.resolve({ name: encodeURIComponent('ชุดผลไม้') });

      const res = await getExerciseImages(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual([10, 20]);
      expect(json.categories).toEqual([1, 2]);
    });

    it('PUT ควรตอบกลับ status 400 เมื่อ photoIds ไม่ใช่ Array', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/exercises/ชุดผลไม้/images', {
        method: 'PUT',
        body: JSON.stringify({ photoIds: 'invalid' })
      });
      const params = Promise.resolve({ name: encodeURIComponent('ชุดผลไม้') });

      const res = await updateExerciseImages(req, { params });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('photoIds must be an array');
    });

    it('PUT ควรอัปเดตรูปภาพและหมวดหมู่ในแบบฝึกหัดสำเร็จ', async () => {
      vi.mocked(ManageExercisesModel.updateExerciseImages).mockResolvedValueOnce(undefined);
      vi.mocked(ManageExercisesModel.updateExerciseCategories).mockResolvedValueOnce(undefined);

      const req = new NextRequest('http://localhost:3000/api/admin/exercises/ชุดผลไม้/images', {
        method: 'PUT',
        body: JSON.stringify({ photoIds: [5, 6], categoryIds: [1] })
      });
      const params = Promise.resolve({ name: encodeURIComponent('ชุดผลไม้') });

      const res = await updateExerciseImages(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(ManageExercisesModel.updateExerciseImages).toHaveBeenCalledWith('ชุดผลไม้', [5, 6]);
      expect(ManageExercisesModel.updateExerciseCategories).toHaveBeenCalledWith('ชุดผลไม้', [1]);
    });
  });
});
