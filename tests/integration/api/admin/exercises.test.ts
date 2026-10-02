import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/exercises/route';
import { ManageExercisesModel } from '@/lib/models/manageExercises';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}));

vi.mock('@/lib/models/manageExercises', () => ({
  ManageExercisesModel: {
    getExercises: vi.fn(),
    getExercisesPaginated: vi.fn(),
    addExercise: vi.fn()
  }
}));

describe('API Route /api/admin/exercises (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/exercises', () => {
    it('ควรดึงรายการแบบฝึกหัดทั้งหมดเมื่อไม่มี query params', async () => {
      const mockList = [{ exercises_id: 1, exercises_name: 'ชุดฝึกผลไม้' }];
      vi.mocked(ManageExercisesModel.getExercises).mockResolvedValueOnce(mockList as unknown as import('@/lib/models/manageExercises').ExerciseInfo[]);

      const req = new Request('http://localhost:3000/api/admin/exercises');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockList);
    });

    it('ควรดึงรายการแบบแบ่งหน้าเมื่อมี page และ limit', async () => {
      vi.mocked(ManageExercisesModel.getExercisesPaginated).mockResolvedValueOnce({
        data: [{ exercises_id: 1, exercises_name: 'ชุดฝึกผลไม้' }] as unknown as import('@/lib/models/manageExercises').ExerciseInfo[],
        total: 10
      });

      const req = new Request('http://localhost:3000/api/admin/exercises?page=1&limit=5&search=ผล');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.total).toBe(10);
      expect(ManageExercisesModel.getExercisesPaginated).toHaveBeenCalledWith(1, 5, 'ผล');
    });

    it('ควรตอบกลับ status 500 เมื่อเกิดข้อผิดพลาดในการดึงข้อมูล', async () => {
      vi.mocked(ManageExercisesModel.getExercises).mockRejectedValueOnce(new Error('DB failure'));

      const req = new Request('http://localhost:3000/api/admin/exercises');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('DB failure');
    });
  });

  describe('POST /api/admin/exercises', () => {
    it('ควรตอบกลับ status 400 เมื่อไม่ระบุชื่อแบบฝึกหัด', async () => {
      const req = new Request('http://localhost:3000/api/admin/exercises', {
        method: 'POST',
        body: JSON.stringify({ name: '' })
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('ควรสร้างแบบฝึกหัดสำเร็จและคืนค่า success: true', async () => {
      vi.mocked(ManageExercisesModel.addExercise).mockResolvedValueOnce({ success: true });

      const req = new Request('http://localhost:3000/api/admin/exercises', {
        method: 'POST',
        body: JSON.stringify({ name: 'ชุดใหม่' })
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('ควรแจ้งเตือน isDuplicateDeleted เมื่อชื่อเคยถูกลบ', async () => {
      vi.mocked(ManageExercisesModel.addExercise).mockResolvedValueOnce({
        isDuplicateDeleted: true,
        name: 'ชุดเก่า'
      });

      const req = new Request('http://localhost:3000/api/admin/exercises', {
        method: 'POST',
        body: JSON.stringify({ name: 'ชุดเก่า' })
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.isDuplicateDeleted).toBe(true);
    });
  });
});
